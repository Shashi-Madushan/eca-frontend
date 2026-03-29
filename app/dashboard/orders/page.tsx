"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DashboardPageHeader,
  DashboardPageShell,
  EmptyState,
  MetricCard,
  SoftBadge,
  SurfacePanel,
  ToolbarRow,
  formatEnumLabel,
} from "@/components/dashboard/ui";
import { CreateOrderPayload, OrderDto, OrderItemDto, OrderStatus, PaymentMethod } from "@/types/models";
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

  const formattedOrderItems = useMemo<OrderItemDto[]>(
    () =>
      orderItems
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
        }),
    [orderItems],
  );

  const subtotal = useMemo(
    () => formattedOrderItems.reduce((sum, item) => sum + item.totalPrice, 0),
    [formattedOrderItems],
  );

  const total = useMemo(
    () => Math.max(subtotal + (Number(taxAmount) || 0) - (Number(discountAmount) || 0), 0),
    [discountAmount, subtotal, taxAmount],
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch =
          order.customerId.toLowerCase().includes(search.toLowerCase()) ||
          String(order.orderId || "").includes(search.toLowerCase()) ||
          order.paymentMethod.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || order.orderStatus === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [orders, search, statusFilter],
  );

  const resetForm = () => {
    setCustomerId("");
    setPaymentMethod("CASH");
    setOrderStatus("PENDING");
    setTaxAmount(0);
    setDiscountAmount(0);
    setOrderItems([{ ...emptyItem }]);
  };

  const addItemRow = () => setOrderItems((prev) => [...prev, { ...emptyItem }]);
  const removeItemRow = (index: number) =>
    setOrderItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  const updateItem = (index: number, patch: Partial<DraftOrderItem>) =>
    setOrderItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);

  const openDetails = (order: OrderDto) => {
    setSelectedOrder(order);
    setEditingStatus(null);
    setIsDetailsOpen(true);
  };

  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.orderStatus === "DELIVERED").length,
    [orders],
  );
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.orderStatus === "PENDING").length,
    [orders],
  );

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Orders Desk"
        title="Order management"
        description="Review customer orders, update statuses, and create manual orders from a cleaner operations screen."
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create order
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Orders" value={orders.length} helper="All fetched orders" />
          <MetricCard label="Pending" value={pendingOrders} helper="Orders still waiting to move" />
          <MetricCard label="Delivered" value={deliveredOrders} helper="Completed fulfillment count" />
        </div>
      </DashboardPageHeader>

      <SurfacePanel>
        <ToolbarRow className="items-stretch sm:items-center">
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
              <Input
                type="text"
                placeholder="Search by order id, customer, payment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-2xl border-black/10 bg-white pl-11 shadow-[0_8px_24px_rgba(15,23,42,0.04)] placeholder:text-black/35"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | OrderStatus)}
              className="pos-select max-w-xs"
            >
              <option value="ALL">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatEnumLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <SoftBadge>{filteredOrders.length} visible</SoftBadge>
        </ToolbarRow>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-black/6 bg-black/[0.02] hover:bg-black/[0.02]">
                <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Order
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Customer
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Payment
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Total
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Date
                </TableHead>
                <TableHead className="px-6 text-right text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-72 text-center text-black/55">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={<ShoppingBag className="h-6 w-6" />}
                      title="No orders found"
                      description="Try another search or create a new manual order."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.orderId} className="border-black/6 hover:bg-black/[0.02]">
                    <TableCell className="px-6 py-4 font-semibold text-black">#{order.orderId}</TableCell>
                    <TableCell className="py-4 text-black/78">{order.customerId}</TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">
                        {formatEnumLabel(order.orderStatus)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-black/68">{formatEnumLabel(order.paymentMethod)}</TableCell>
                    <TableCell className="py-4 text-right font-semibold text-black">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-black/48">
                      {order.orderDate ? new Date(order.orderDate).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-xl border-black/10 bg-white hover:bg-black/[0.03]"
                          onClick={() => openDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-xl border-black/10 bg-white hover:bg-black/[0.03]"
                          onClick={() => deleteOrder(order.orderId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SurfacePanel>

      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) setEditingStatus(null);
        }}
      >
        <DialogContent className="max-w-4xl rounded-[32px] border border-black/8 bg-white p-0 shadow-[0_28px_100px_rgba(15,23,42,0.12)]">
          <div className="border-b border-black/6 bg-[linear-gradient(180deg,_#ffffff,_#f4f4f5)] px-6 py-6">
            <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-black">
              Order details
            </DialogTitle>
            <p className="mt-1 text-sm text-black/55">Order #{selectedOrder?.orderId}</p>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-black/8 bg-black/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">Customer ID</p>
                <p className="mt-2 text-lg font-semibold text-black">{selectedOrder?.customerId || "-"}</p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-black/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">Payment method</p>
                <p className="mt-2 text-lg font-semibold text-black">
                  {selectedOrder?.paymentMethod ? formatEnumLabel(selectedOrder.paymentMethod) : "-"}
                </p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-black/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">Status</p>
                {editingStatus !== null ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <select
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value as OrderStatus)}
                      className="pos-select"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatEnumLabel(status)}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      className="h-10 rounded-2xl bg-black px-4 text-white hover:bg-black/90"
                      onClick={() => updateOrderStatus(selectedOrder?.orderId, editingStatus)}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-2xl border-black/10 bg-white px-4 text-black hover:bg-black/[0.03]"
                      onClick={() => setEditingStatus(null)}
                      disabled={isUpdatingStatus}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full border border-black bg-black px-3 py-1 text-xs font-medium text-white">
                      {selectedOrder?.orderStatus ? formatEnumLabel(selectedOrder.orderStatus) : "-"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-2xl border-black/10 bg-white px-4 text-black hover:bg-black/[0.03]"
                      onClick={() => setEditingStatus(selectedOrder?.orderStatus || "PENDING")}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
              <div className="rounded-[24px] border border-black/8 bg-black/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">Total</p>
                <p className="mt-2 text-lg font-semibold text-black">
                  {formatCurrency(selectedOrder?.totalAmount || 0)}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/8 bg-white">
              <div className="border-b border-black/6 px-5 py-4 text-sm font-semibold text-black">Order items</div>
              <div className="space-y-3 p-5">
                {(selectedOrder?.orderItems || []).length === 0 ? (
                  <p className="text-sm text-black/55">No order items available.</p>
                ) : (
                  (selectedOrder?.orderItems || []).map((item, index) => (
                    <div
                      key={`${item.orderItemId || index}-${item.productId}`}
                      className="grid gap-3 rounded-[22px] border border-black/8 bg-black/[0.02] p-4 sm:grid-cols-[1fr_auto_auto]"
                    >
                      <div>
                        <p className="font-semibold text-black">{item.productName}</p>
                        <p className="text-xs text-black/45">{item.productId}</p>
                      </div>
                      <div className="text-sm font-medium text-black/65">x{item.quantity}</div>
                      <div className="font-semibold text-black">{formatCurrency(item.totalPrice)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-5xl rounded-[32px] border border-black/8 bg-white p-0 shadow-[0_28px_100px_rgba(15,23,42,0.12)]">
          <div className="border-b border-black/6 bg-[linear-gradient(180deg,_#ffffff,_#f4f4f5)] px-6 py-6">
            <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-black">
              Create manual order
            </DialogTitle>
            <p className="mt-1 text-sm text-black/55">
              Fill order details and line items before saving the order.
            </p>
          </div>

          <form onSubmit={createOrder} className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="customerId" className="text-sm font-medium text-black/75">
                  Customer ID
                </label>
                <Input
                  id="customerId"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="CUST001"
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="paymentMethod" className="text-sm font-medium text-black/75">
                  Payment Method
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
                  Order Status
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
              <div className="space-y-2">
                <label htmlFor="taxAmount" className="text-sm font-medium text-black/75">
                  Tax Amount
                </label>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="discountAmount" className="text-sm font-medium text-black/75">
                  Discount Amount
                </label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-black">Order items</h3>
                  <p className="text-sm text-black/55">Add products manually to this order.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItemRow}
                  className="h-11 rounded-2xl border-black/10 bg-white px-5 text-black hover:bg-black/[0.03]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add item
                </Button>
              </div>

              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-[24px] border border-black/8 bg-black/[0.02] p-4 lg:grid-cols-[1fr_1.2fr_110px_140px_140px_auto]"
                  >
                    <Input
                      placeholder="Product ID"
                      value={item.productId}
                      onChange={(e) => updateItem(index, { productId: e.target.value })}
                      className="h-11 rounded-2xl border-black/10 bg-white px-4"
                    />
                    <Input
                      placeholder="Product Name"
                      value={item.productName}
                      onChange={(e) => updateItem(index, { productName: e.target.value })}
                      className="h-11 rounded-2xl border-black/10 bg-white px-4"
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 1 })}
                      className="h-11 rounded-2xl border-black/10 bg-white px-4"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) || 0 })}
                      className="h-11 rounded-2xl border-black/10 bg-white px-4"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Item Discount"
                      value={item.discountAmount}
                      onChange={(e) => updateItem(index, { discountAmount: Number(e.target.value) || 0 })}
                      className="h-11 rounded-2xl border-black/10 bg-white px-4"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => removeItemRow(index)}
                      className="mt-1 rounded-xl border-black/10 bg-white hover:bg-black/[0.03] lg:mt-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-black/8 bg-black/[0.02] p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">Subtotal</p>
                <p className="mt-2 text-lg font-semibold text-black">{formatCurrency(subtotal)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">Tax - Discount</p>
                <p className="mt-2 text-lg font-semibold text-black">
                  {formatCurrency((Number(taxAmount) || 0) - (Number(discountAmount) || 0))}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">Total</p>
                <p className="mt-2 text-lg font-semibold text-black">{formatCurrency(total)}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-black/6 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="h-11 rounded-2xl border-black/10 bg-white px-5 text-black hover:bg-black/[0.03]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
              >
                {isSubmitting ? "Saving..." : "Create order"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
