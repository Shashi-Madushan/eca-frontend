"use client";

import { useEffect, useMemo, useState } from "react";
import { CreateOrderPayload, OrderDto, OrderItemDto, OrderStatus, PaymentMethod } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Eye, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";

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

type DraftOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
};

const emptyItem: DraftOrderItem = {
  productId: "",
  productName: "",
  quantity: 1,
  unitPrice: 0,
  discountAmount: 0,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("PENDING");
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<DraftOrderItem[]>([{ ...emptyItem }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setOrders([]);
      toast.error("Could not load orders. Make sure API Gateway is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formattedOrderItems = useMemo<OrderItemDto[]>(() => {
    return orderItems
      .filter((item) => item.productId.trim() && item.productName.trim() && item.quantity > 0)
      .map((item) => {
        const unitPrice = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 0;
        const discount = Number(item.discountAmount) || 0;
        const totalPrice = Math.max(unitPrice * quantity - discount, 0);

        return {
          productId: item.productId.trim(),
          productName: item.productName.trim(),
          quantity,
          unitPrice,
          totalPrice,
          discountAmount: discount,
        };
      });
  }, [orderItems]);

  const subtotal = useMemo(() => {
    return formattedOrderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [formattedOrderItems]);

  const total = useMemo(() => {
    return Math.max(subtotal + (Number(taxAmount) || 0) - (Number(discountAmount) || 0), 0);
  }, [discountAmount, subtotal, taxAmount]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.customerId.toLowerCase().includes(search.toLowerCase()) ||
        String(order.orderId || "").includes(search.toLowerCase()) ||
        order.paymentMethod.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || order.orderStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const resetForm = () => {
    setCustomerId("");
    setPaymentMethod("CASH");
    setOrderStatus("PENDING");
    setTaxAmount(0);
    setDiscountAmount(0);
    setOrderItems([{ ...emptyItem }]);
  };

  const addItemRow = () => {
    setOrderItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItemRow = (index: number) => {
    setOrderItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateItem = (index: number, patch: Partial<DraftOrderItem>) => {
    setOrderItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId.trim()) {
      toast.error("Customer ID is required.");
      return;
    }

    if (formattedOrderItems.length === 0) {
      toast.error("Add at least one valid order item.");
      return;
    }

    const payload: CreateOrderPayload = {
      orderDate: new Date().toISOString().slice(0, 19),
      customerId: customerId.trim().toUpperCase(),
      orderStatus,
      paymentMethod,
      subtotalAmount: Number(subtotal.toFixed(2)),
      taxAmount: Number((Number(taxAmount) || 0).toFixed(2)),
      discountAmount: Number((Number(discountAmount) || 0).toFixed(2)),
      totalAmount: Number(total.toFixed(2)),
      orderItems: formattedOrderItems,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create order");
      }

      toast.success("Order created successfully.");
      setIsCreateOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error("Could not create order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteOrder = async (orderId?: number) => {
    if (!orderId) return;
    if (!confirm(`Delete order #${orderId}?`)) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
      toast.success("Order deleted successfully.");
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete order.");
    }
  };

  const updateOrderStatus = async (orderId?: number, newStatus?: OrderStatus) => {
    if (!orderId || !newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status?newStatus=${newStatus}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update order status");
      }

      setEditingStatus(null);
      toast.success("Order status updated successfully.");
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error("Could not update order status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);
  };

  const openDetails = (order: OrderDto) => {
    setSelectedOrder(order);
    setEditingStatus(null);
    setIsDetailsOpen(true);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Order Management</h2>
          <p className="text-slate-500 mt-2">Review, create, and manage customer orders.</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all rounded-lg px-4 h-10"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Order
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by order id, customer, payment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200/60 focus-visible:ring-blue-500 rounded-xl h-10 w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | OrderStatus)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm"
          >
            <option value="ALL">All Statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-100">
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Order ID</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Customer</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Status</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Payment</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11 text-right">Total</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Date</TableHead>
                <TableHead className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-sm">Loading orders...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-900">No orders found</p>
                      <p className="text-xs mt-1">Try another search or create a new order.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.orderId} className="hover:bg-slate-50/80 border-b-slate-50 transition-colors group">
                    <TableCell className="font-semibold text-slate-800">#{order.orderId}</TableCell>
                    <TableCell className="font-medium text-slate-700">{order.customerId}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200">
                        {order.orderStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-700">{order.paymentMethod}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {order.orderDate ? new Date(order.orderDate).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => openDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteOrder(order.orderId)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={(open) => {
        setIsDetailsOpen(open);
        if (!open) {
          setEditingStatus(null);
        }
      }}>
        <DialogContent className="max-w-3xl bg-white p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-semibold text-slate-900">Order Details</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Order #{selectedOrder?.orderId}</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/40">
                <p className="text-xs uppercase tracking-wider text-slate-500">Customer ID</p>
                <p className="font-semibold text-slate-900 mt-1">{selectedOrder?.customerId || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/40">
                <p className="text-xs uppercase tracking-wider text-slate-500">Payment Method</p>
                <p className="font-semibold text-slate-900 mt-1">{selectedOrder?.paymentMethod || "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/40">
                <p className="text-xs uppercase tracking-wider text-slate-500">Status</p>
                {editingStatus !== null ? (
                  <div className="flex gap-2 mt-1">
                    <select
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value as OrderStatus)}
                      className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white h-8"
                      onClick={() => updateOrderStatus(selectedOrder?.orderId, editingStatus)}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? "..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => setEditingStatus(null)}
                      disabled={isUpdatingStatus}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200">
                      {selectedOrder?.orderStatus || "-"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50"
                      onClick={() => setEditingStatus(selectedOrder?.orderStatus || "PENDING")}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/40">
                <p className="text-xs uppercase tracking-wider text-slate-500">Total</p>
                <p className="font-semibold text-slate-900 mt-1">{formatCurrency(selectedOrder?.totalAmount || 0)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50/50 text-sm font-semibold text-slate-800">Order Items</div>
              <div className="p-4 space-y-2">
                {(selectedOrder?.orderItems || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No order items available.</p>
                ) : (
                  (selectedOrder?.orderItems || []).map((item, index) => (
                    <div key={`${item.orderItemId || index}-${item.productId}`} className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{item.productName}</p>
                        <p className="text-xs text-slate-500">{item.productId}</p>
                      </div>
                      <div className="text-slate-700">x{item.quantity}</div>
                      <div className="font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl bg-white p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-semibold text-slate-900">Create Manual Order</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Fill order fields and add line items before saving.</p>
          </div>

          <form onSubmit={createOrder} className="p-6 space-y-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="customerId" className="text-sm font-medium text-slate-700">Customer ID</label>
                <Input
                  id="customerId"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="CUST001"
                />
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

              <div className="space-y-1.5">
                <label htmlFor="taxAmount" className="text-sm font-medium text-slate-700">Tax Amount</label>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="discountAmount" className="text-sm font-medium text-slate-700">Discount Amount</label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Order Items</h3>
                <Button type="button" variant="outline" onClick={addItemRow} className="rounded-lg">
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_100px_120px_120px_auto] gap-2 items-center rounded-lg border border-slate-100 p-3">
                    <Input
                      placeholder="Product ID"
                      value={item.productId}
                      onChange={(e) => updateItem(index, { productId: e.target.value })}
                    />
                    <Input
                      placeholder="Product Name"
                      value={item.productName}
                      onChange={(e) => updateItem(index, { productName: e.target.value })}
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 1 })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Item Discount"
                      value={item.discountAmount}
                      onChange={(e) => updateItem(index, { discountAmount: Number(e.target.value) || 0 })}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItemRow(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 grid sm:grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-slate-500">Subtotal</p>
                <p className="font-semibold text-slate-900">{formatCurrency(subtotal)}</p>
              </div>
              <div>
                <p className="text-slate-500">Tax - Discount</p>
                <p className="font-semibold text-slate-900">{formatCurrency((Number(taxAmount) || 0) - (Number(discountAmount) || 0))}</p>
              </div>
              <div>
                <p className="text-slate-500">Total</p>
                <p className="font-semibold text-slate-900">{formatCurrency(total)}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
