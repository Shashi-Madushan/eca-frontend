"use client";

import { useEffect, useMemo, useState } from "react";
import { CreateOrderPayload, CustomerType, OrderItemDto, OrderStatus, PaymentMethod, ProductDto } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Minus, Plus, Search, ShoppingCart, Trash2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { getProxiedImageUrl } from "@/lib/imageProxy";

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
      setProducts(Array.isArray(data) ? data.filter((p) => p.isActive) : []);
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

  const subtotalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    return Math.max(subtotalAmount + (Number(taxAmount) || 0) - (Number(discountAmount) || 0), 0);
  }, [discountAmount, subtotalAmount, taxAmount]);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);
  };

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">POS</h2>
          <p className="text-slate-500 mt-2">Fast checkout with product search and right-side order placement.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 inline-flex items-center gap-2">
          <User className="h-4 w-4 text-slate-500" />
          <span>Operator: {user?.username || "Unknown"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_390px] gap-6 items-start">
        <section className="space-y-4">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name..."
              className="pl-9 bg-white rounded-xl border-slate-200"
            />
          </div>

          {isLoadingProducts ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">No active products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <article
                  key={product.productId}
                  className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0px_2px_10px_rgba(0,0,0,0.03)]"
                >
                  {product.images && product.images.length > 0 ? (
                    <div className="relative w-full h-40 bg-slate-100 mb-3">
                      <Image
                        src={getProxiedImageUrl(product.images[0])}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-slate-200 to-slate-100 mb-3 flex items-center justify-center">
                      <span className="text-slate-400 text-sm">No image</span>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{product.productId}</p>
                      </div>
                      <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2 text-[11px] text-slate-600">
                        {product.category}
                      </span>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(product.price)}</p>
                      <p className={`text-xs font-semibold ${product.stockQuantity <= 5 ? "text-rose-600" : "text-emerald-600"}`}>
                        Stock: {product.stockQuantity}
                      </p>
                    </div>

                    <Button
                      onClick={() => addToCart(product)}
                      disabled={product.stockQuantity <= 0}
                      className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add to Cart
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-slate-100 bg-white p-4 lg:p-5 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] xl:sticky xl:top-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-semibold text-slate-900 inline-flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Order Placement
            </h3>
            <span className="text-xs text-slate-500">{cartItems.length} items</span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="space-y-1.5">
              <label htmlFor="customer" className="text-sm font-medium text-slate-700">Customer</label>
              <select
                id="customer"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

            <div className="space-y-1.5">
              <label htmlFor="paymentMethod" className="text-sm font-medium text-slate-700">Payment Method</label>
              <select
                id="paymentMethod"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="orderStatus" className="text-sm font-medium text-slate-700">Order Status</label>
              <select
                id="orderStatus"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="taxAmount" className="text-sm font-medium text-slate-700">Tax</label>
                <Input
                  id="taxAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="discountAmount" className="text-sm font-medium text-slate-700">Discount</label>
                <Input
                  id="discountAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-70 overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <p className="text-sm text-slate-500 rounded-lg border border-dashed border-slate-200 p-3">Cart is empty.</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.productId} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.productId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCartItem(item.productId)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.unitPrice)}</p>
                    <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-1 py-1">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        className="h-6 w-6 inline-flex items-center justify-center text-slate-600"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        className="h-6 w-6 inline-flex items-center justify-center text-slate-600"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotalAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Tax</span>
              <span>{formatCurrency(Number(taxAmount) || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Discount</span>
              <span>- {formatCurrency(Number(discountAmount) || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-900 pt-1">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={resetOrder}>
              Clear
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={placeOrder}
              disabled={isPlacingOrder || cartItems.length === 0}
            >
              {isPlacingOrder ? "Placing..." : "Place Order"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
