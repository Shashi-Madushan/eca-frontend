"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Edit2, Plus, Search, Star, Trash2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CustomerType } from "@/types/models";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    customerType: "REGULAR" as "REGULAR" | "PREMIUM",
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/iam/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Could not load customers. Make sure API Gateway is running.");
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          customer.email.toLowerCase().includes(search.toLowerCase()) ||
          customer.customerId.toLowerCase().includes(search.toLowerCase()),
      ),
    [customers, search],
  );

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      mobile: "",
      address: "",
      customerType: "REGULAR",
    });
    setEditingCustomer(null);
  };

  const handleOpenDialog = (customer?: CustomerType) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address || "",
        customerType: customer.customerType,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCustomer ? `/api/iam/customers/${editingCustomer.id}` : `/api/iam/customers`;
      const method = editingCustomer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(editingCustomer ? "Failed to update customer" : "Failed to create customer");

      toast.success(editingCustomer ? "Customer updated successfully!" : "Customer created successfully!");
      setIsDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving the customer.");
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await fetch(`/api/iam/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete customer");
      toast.success("Customer deleted successfully!");
      fetchCustomers();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete customer");
    }
  };

  const premiumCustomers = useMemo(
    () => customers.filter((customer) => customer.customerType === "PREMIUM").length,
    [customers],
  );
  const totalPoints = useMemo(
    () => customers.reduce((sum, customer) => sum + (customer.loyaltyPoints || 0), 0),
    [customers],
  );

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Customer Desk"
        title="Customer management"
        description="Keep your shopper database polished with loyalty status, contact details, and purchase visibility."
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add customer
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Customers" value={customers.length} helper="Profiles in the system" />
          <MetricCard label="Premium members" value={premiumCustomers} helper="High-value customer accounts" />
          <MetricCard label="Loyalty points" value={totalPoints} helper="Combined points across the base" />
        </div>
      </DashboardPageHeader>

      <SurfacePanel>
        <ToolbarRow>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <Input
              type="text"
              placeholder="Search customers, emails, or customer IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-2xl border-black/10 bg-white pl-11 shadow-[0_8px_24px_rgba(15,23,42,0.04)] placeholder:text-black/35"
            />
          </div>
          <SoftBadge>{filteredCustomers.length} visible</SoftBadge>
        </ToolbarRow>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-black/6 bg-black/[0.02] hover:bg-black/[0.02]">
                <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Customer
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Contact
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Tier
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Loyalty
                </TableHead>
                <TableHead className="px-6 text-right text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-72 text-center text-black/55">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={<UsersRound className="h-6 w-6" />}
                      title="No customers found"
                      description="Try another search or create a new customer record."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-black/6 hover:bg-black/[0.02]">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-black text-sm font-semibold text-white">
                          {customer.name?.charAt(0) || "C"}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-black">{customer.name}</p>
                          <p className="text-xs text-black/45">{customer.customerId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-medium text-black/78">{customer.email}</p>
                      <p className="text-xs text-black/45">{customer.mobile}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                          customer.customerType === "PREMIUM"
                            ? "border-black bg-black text-white"
                            : "border-black/10 bg-white text-black/70"
                        }`}
                      >
                        {customer.customerType === "PREMIUM" ? <Award className="mr-1.5 h-3.5 w-3.5" /> : null}
                        {formatEnumLabel(customer.customerType)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <p className="font-semibold text-black">{customer.loyaltyPoints} pts</p>
                      <p className="text-xs text-black/45">
                        ${customer.totalPurchases?.toFixed(2) || "0.00"} spent
                      </p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-xl border-black/10 bg-white hover:bg-black/[0.03]"
                          onClick={() => handleOpenDialog(customer)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-xl border-black/10 bg-white hover:bg-black/[0.03]"
                          onClick={() => deleteCustomer(customer.customerId)}
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
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl rounded-[32px] border border-black/8 bg-white p-0 shadow-[0_28px_100px_rgba(15,23,42,0.12)]">
          <div className="border-b border-black/6 bg-[linear-gradient(180deg,_#ffffff,_#f4f4f5)] px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-black text-white">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-black">
                  {editingCustomer ? "Edit customer" : "Add customer"}
                </DialogTitle>
                <p className="mt-1 text-sm text-black/55">
                  {editingCustomer
                    ? "Update the customer profile and loyalty details."
                    : "Create a new customer profile in the POS workspace."}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerType">Customer Tier</Label>
                <select
                  id="customerType"
                  className="pos-select"
                  value={formData.customerType}
                  onChange={(e) =>
                    setFormData({ ...formData, customerType: e.target.value as "REGULAR" | "PREMIUM" })
                  }
                >
                  <option value="REGULAR">Regular</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-black/6 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-11 rounded-2xl border-black/10 bg-white px-5 text-black hover:bg-black/[0.03]"
              >
                Cancel
              </Button>
              <Button type="submit" className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90">
                {editingCustomer ? "Save changes" : "Create customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
