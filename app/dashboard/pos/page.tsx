"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, Search, ShoppingCart, Trash2, User, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DashboardPageShell,
  EmptyState,
  SoftBadge,
  SurfacePanel,
  formatEnumLabel,
} from "@/components/dashboard/ui";
import { useAuth } from "@/context/AuthContext";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { CreateOrderPayload, CustomerType, OrderItemDto, OrderStatus, PaymentMethod, ProductDto } from "@/types/models";
import { toast } from "sonner";

const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "MOBILE_PAYMENT",
  "BANK_TRANSFER",
  "GIFT_CARD",
];

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

type CartItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  stockQuantity: number;
};

export default function PosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("PENDING");
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const fetchProducts = async (query: string) => {
    setIsLoadingProducts(true);
    try {
      const baseUrl = query.trim()
        ? `/api/products/search?name=${encodeURIComponent(query.trim())}`
        : "/api/products";
      const res = await fetch(baseUrl);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data.filter((product) => product.isActive) : []);
    } catch (error) {
      console.error(error);
      setProducts([]);
      toast.error("Could not load products.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/iam/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setCustomers([]);
      toast.error("Could not load customers.");
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchProducts("");
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const subtotalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems],
  );

  const totalAmount = useMemo(
    () => Math.max(subtotalAmount + (Number(taxAmount) || 0) - (Number(discountAmount) || 0), 0),
    [discountAmount, subtotalAmount, taxAmount],
  );

  const addToCart = (product: ProductDto) => {
    if (product.stockQuantity <= 0) {
      toast.error("This product is out of stock.");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.productId);
      if (existing) {
        if (existing.quantity + 1 > product.stockQuantity) {
          toast.error("Cannot exceed available stock.");
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.productId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...prev,
        {
          productId: product.productId,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          stockQuantity: product.stockQuantity,
        },
      ];
    });
  };

  const updateCartQuantity = (productId: string, nextQuantity: number) => {
    setCartItems((prev) => {
      if (nextQuantity <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }

      return prev.map((item) => {
        if (item.productId !== productId) return item;
        if (nextQuantity > item.stockQuantity) {
          toast.error("Cannot exceed available stock.");
          return item;
        }
        return { ...item, quantity: nextQuantity };
      });
    });
  };

  const removeCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const resetOrder = () => {
    setCartItems([]);
    setSelectedCustomerId("");
    setPaymentMethod("CASH");
    setOrderStatus("PENDING");
    setTaxAmount(0);
    setDiscountAmount(0);
  };

  const placeOrder = async () => {
    if (!selectedCustomerId.trim()) {
      toast.error("Select a customer before placing the order.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Add at least one product to the cart.");
      return;
    }

    const orderItems: OrderItemDto[] = cartItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice.toFixed(2)),
      totalPrice: Number((item.unitPrice * item.quantity).toFixed(2)),
      discountAmount: 0,
    }));

    const payload: CreateOrderPayload = {
      orderDate: new Date().toISOString().slice(0, 19),
      customerId: selectedCustomerId.trim().toUpperCase(),
      orderStatus,
      paymentMethod,
      subtotalAmount: Number(subtotalAmount.toFixed(2)),
      taxAmount: Number((Number(taxAmount) || 0).toFixed(2)),
      discountAmount: Number((Number(discountAmount) || 0).toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      orderItems,
    };

    setIsPlacingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pos-operator-id": user?.id ? String(user.id) : "",
          "x-pos-operator-username": user?.username || "",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to place order");
      }

      toast.success("Order placed successfully.");
      resetOrder();
      fetchProducts(searchQuery);
    } catch (error) {
      console.error(error);
      toast.error("Could not place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);

  return (
    <DashboardPageShell>
      {/* <DashboardPageHeader
        eyebrow="Checkout"
        title="POS terminal"
        description="Run front-counter checkout with a polished product browser, customer assignment, and cart summary."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Operator" value={user?.username || "Unknown"} helper={user?.userType || "N/A"} />
          <MetricCard label="Active products" value={products.length} helper="Sellable catalog results" />
          <MetricCard label="Cart items" value={cartItems.length} helper="Distinct line items in cart" />
          <MetricCard label="Cart total" value={formatCurrency(totalAmount)} helper="Live checkout total" />
        </div>
      </DashboardPageHeader> */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <section className="flex flex-col gap-5">
          <SurfacePanel className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name..."
                  className="h-12 rounded-2xl border-black/10 bg-black/[0.02] pl-11 shadow-none placeholder:text-black/35"
                />
              </div>
              <SoftBadge>{products.length} results</SoftBadge>
            </div>
          </SurfacePanel>

          <div className="flex-1 overflow-y-auto">
            {isLoadingProducts ? (
              <SurfacePanel className="flex min-h-72 items-center justify-center text-sm text-black/55">
                Loading products...
              </SurfacePanel>
            ) : products.length === 0 ? (
              <SurfacePanel>
                <EmptyState
                  icon={<ShoppingCart className="h-6 w-6" />}
                  title="No active products found"
                  description="Try another search term or make sure active products exist in the catalog."
                />
              </SurfacePanel>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {products.map((product) => (
                <article
                  key={product.productId}
                  className="overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
                >
                  {product.images && product.images.length > 0 ? (
                    <div className="relative h-48 w-full bg-black/[0.03]">
                      <Image
                        src={getProxiedImageUrl(product.images[0])}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-[linear-gradient(180deg,_#f5f5f5,_#ebebeb)] text-sm text-black/35">
                      No image
                    </div>
                  )}

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="line-clamp-2 text-lg font-semibold tracking-[-0.03em] text-black">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-xs text-black/45">{product.productId}</p>
                      </div>
                      <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/65">
                        {product.category}
                      </span>
                    </div>

                    <div className="grid gap-3 rounded-[22px] border border-black/8 bg-black/[0.02] p-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/38">Price</p>
                        <p className="mt-1 text-lg font-semibold text-black">{formatCurrency(product.price)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/38">Stock</p>
                        <p className="mt-1 text-lg font-semibold text-black">{product.stockQuantity}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => addToCart(product)}
                      disabled={product.stockQuantity <= 0}
                      className="h-11 w-full rounded-2xl bg-black text-white hover:bg-black/90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add to cart
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            )}
          </div>
        </section>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <SurfacePanel className="overflow-hidden">
            <div className="border-b border-black/6 bg-[linear-gradient(180deg,_#111111,_#252525)] px-5 py-5 text-white sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Current sale</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Checkout cart</h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
                  {cartItems.length} items
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label htmlFor="customer" className="text-sm font-medium text-black/75">
                    Customer
                  </label>
                  <select
                    id="customer"
                    className="pos-select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.customerId} value={customer.customerId}>
                        {customer.customerId} - {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="paymentMethod" className="text-sm font-medium text-black/75">
                      Payment
                    </label>
                    <select
                      id="paymentMethod"
                      className="pos-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {formatEnumLabel(method)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="orderStatus" className="text-sm font-medium text-black/75">
                      Status
                    </label>
                    <select
                      id="orderStatus"
                      className="pos-select"
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatEnumLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="taxAmount" className="text-sm font-medium text-black/75">
                      Tax
                    </label>
                    <Input
                      id="taxAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                      className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="discountAmount" className="text-sm font-medium text-black/75">
                      Discount
                    </label>
                    <Input
                      id="discountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 flex-shrink-0">
                  <div className="rounded-[22px] border border-black/8 bg-black/[0.02] p-4">
                    <div className="flex items-center gap-2 text-black/55">
                      <User className="h-4 w-4" />
                      <span className="text-sm">Operator</span>
                    </div>
                    <p className="mt-2 font-semibold text-black">{user?.username || "Unknown"}</p>
                  </div>
                  <div className="rounded-[22px] border border-black/8 bg-black/[0.02] p-4">
                    <div className="flex items-center gap-2 text-black/55">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm">Payment</span>
                    </div>
                    <p className="mt-2 font-semibold text-black">{formatEnumLabel(paymentMethod)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-black">Cart items</h3>
                  <SoftBadge>{cartItems.length} lines</SoftBadge>
                </div>

                <div className="pos-scrollbar space-y-3 overflow-y-auto pr-1 flex-1">
                  {cartItems.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-black/12 bg-black/[0.02] p-5 text-sm text-black/55">
                      Cart is empty. Add products from the left to start checkout.
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.productId} className="rounded-[24px] border border-black/8 bg-black/[0.02] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-black">{item.productName}</p>
                            <p className="text-xs text-black/45">{item.productId}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.productId)}
                            className="rounded-full p-1 text-black/35 transition hover:bg-black/5 hover:text-black"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-black">{formatCurrency(item.unitPrice)}</p>
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-2 py-2">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-black/65 transition hover:bg-black/[0.04]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-black">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-black/65 transition hover:bg-black/[0.04]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-black/8 bg-black/[0.02] p-5 flex-shrink-0">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-black/62">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-black/62">
                    <span>Tax</span>
                    <span>{formatCurrency(Number(taxAmount) || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-black/62">
                    <span>Discount</span>
                    <span>- {formatCurrency(Number(discountAmount) || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/8 pt-3 text-base font-semibold text-black">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetOrder}
                  className="h-11 rounded-2xl border-black/10 bg-white text-black hover:bg-black/[0.03]"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  className="h-11 rounded-2xl bg-black text-white hover:bg-black/90"
                  onClick={placeOrder}
                  disabled={isPlacingOrder || cartItems.length === 0}
                >
                  {isPlacingOrder ? "Placing..." : "Place order"}
                </Button>
              </div>
            </div>
          </SurfacePanel>
        </aside>
      </div>
    </DashboardPageShell>
  );
}
