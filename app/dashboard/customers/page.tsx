"use client";

import { useEffect, useState } from "react";
import { CustomerType } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit2, Trash2, Award } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerType | null>(null);

  // Form State
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

  // Basic client-side filtering since there is no customer search API setup
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.customerId.toLowerCase().includes(search.toLowerCase())
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

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h2>
          <p className="text-slate-500 mt-2">View and manage your entire customer base.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all rounded-lg px-4 h-10">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/60 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200/60 focus-visible:ring-blue-500 rounded-xl h-10 w-full"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-100">
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Customer</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Contact</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Plan</TableHead>
                <TableHead className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Loyalty / Spends</TableHead>
                <TableHead className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wider h-11 w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-sm">Loading customers...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                     <div className="flex flex-col items-center justify-center">
                      <p className="text-sm font-medium text-slate-900">No customers found</p>
                      <p className="text-xs mt-1">Try adjusting your search query or add a new customer.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/80 border-b-slate-50 transition-colors group">
                    {/* Customer Info Column */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${customer.customerType === 'PREMIUM' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {customer.name?.charAt(0) || "C"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-sm">{customer.name}</span>
                          <span className="text-xs text-slate-500 font-medium font-mono">{customer.customerId}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Column */}
                    <TableCell>
                      <span className="text-sm text-slate-600 block">{customer.email}</span>
                      <span className="text-xs text-slate-400 block">{customer.mobile}</span>
                    </TableCell>

                    {/* Plan Column */}
                    <TableCell>
                      <div className="flex items-center">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          customer.customerType === 'PREMIUM' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {customer.customerType === 'PREMIUM' && <Award className="w-3 h-3 mr-1" />}
                          {customer.customerType.charAt(0) + customer.customerType.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </TableCell>

                    {/* Points Column */}
                    <TableCell className="text-right">
                       <div className="flex flex-col items-end">
                          <span className="font-semibold text-slate-800 text-sm">
                            {customer.loyaltyPoints} <span className="text-xs text-slate-400 font-normal">pts</span>
                          </span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1">
                            ${customer.totalPurchases?.toFixed(2) || "0.00"}
                          </span>
                       </div>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenDialog(customer)}>
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteCustomer(customer.customerId)}>
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

      {/* Modern Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
           <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              {editingCustomer ? "Update the customer's information." : "Enter the required details to create a new customer record."}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
              <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
              <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-5">
               <div className="space-y-1.5">
                <Label htmlFor="mobile" className="text-sm font-medium text-slate-700">Mobile Number</Label>
                <Input id="mobile" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerType" className="text-sm font-medium text-slate-700">Customer Tier</Label>
                <select 
                  id="customerType" 
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={formData.customerType} 
                  onChange={e => setFormData({...formData, customerType: e.target.value as "REGULAR" | "PREMIUM"})}
                >
                  <option value="REGULAR">Regular</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium text-slate-700">Physical Address (Optional)</Label>
              <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
            </div>


            <DialogFooter className="pt-6 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-lg hover:bg-slate-50 hover:text-slate-900 border-slate-200">Cancel</Button>
              <Button type="submit" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm">{editingCustomer ? "Save Changes" : "Create Customer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
