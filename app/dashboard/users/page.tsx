"use client";

import { useEffect, useState } from "react";
import { User, UserType, UserStatus } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    userType: "EMPLOYEE" as UserType,
    status: "ACTIVE" as UserStatus,
    phone: "",
    address: "",
    password: "", // Only used for creating
  });

  const fetchUsers = async (query = "") => {
    setIsLoading(true);
    try {
      const url = query ? `/api/iam/users/search?name=${encodeURIComponent(query)}` : `/api/iam/users`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Could not load users. Make sure API Gateway is running.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      userType: "EMPLOYEE",
      status: "ACTIVE",
      phone: "",
      address: "",
      password: "",
    });
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        status: user.status,
        phone: user.phone || "",
        address: user.address || "",
        password: "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/iam/users/${editingUser.id}` : `/api/iam/users`;
      const method = editingUser ? "PUT" : "POST";
      
      const payload = { ...formData };
      if (editingUser) {
        // Don't send password if editing (or handle it properly via API req)
        delete (payload as any).password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(editingUser ? "Failed to update user" : "Failed to create user");
      
      toast.success(editingUser ? "User updated successfully!" : "User created successfully!");
      setIsDialogOpen(false);
      resetForm();
      fetchUsers(search);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred wile saving the user.");
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/iam/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted successfully!");
      fetchUsers(search);
    } catch (error) {
      console.error(error);
      toast.error("Could not delete user");
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Users</h2>
          <p className="text-slate-500 mt-2">Manage your team members and their account permissions here.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all rounded-lg px-4 h-10">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/60 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search users by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200/60 focus-visible:ring-blue-500 rounded-xl h-10 w-full"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-100">
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">User</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Contact</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Role</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-sm">Loading users...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm font-medium text-slate-900">No users found</p>
                      <p className="text-xs mt-1">Try adjusting your search query or add a new user.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/80 border-b-slate-50 transition-colors group">
                    {/* User Info Column */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                          {user.firstName?.charAt(0) || user.username?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-sm">{user.firstName} {user.lastName}</span>
                          <span className="text-xs text-slate-500">@{user.username}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Column */}
                    <TableCell>
                      <span className="text-sm text-slate-600 block">{user.email}</span>
                      {user.phone && <span className="text-xs text-slate-400 block">{user.phone}</span>}
                    </TableCell>

                    {/* Role Column */}
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.userType === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-700' 
                            : user.userType === 'MANAGER'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.userType}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          user.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                            : user.status === 'SUSPENDED'
                            ? 'bg-red-50 text-red-700 border-red-200/50'
                            : 'bg-slate-100 text-slate-700 border-slate-200/50'
                        }`}>
                          {user.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>}
                          {user.status === 'SUSPENDED' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>}
                          {user.status === 'INACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>}
                          {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenDialog(user)}>
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteUser(user.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl bg-white p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {editingUser ? "Edit Team Member" : "Add New Team Member"}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              {editingUser ? "Update the details for this user below." : "Fill in the information below to add a new user to the system."}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name</Label>
                <Input id="firstName" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name</Label>
                <Input id="lastName" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
                <Input id="username" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="userType" className="text-sm font-medium text-slate-700">Role</Label>
                <select 
                  id="userType" 
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={formData.userType} 
                  onChange={e => setFormData({...formData, userType: e.target.value as UserType})}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-sm font-medium text-slate-700">Status</Label>
                <select 
                  id="status" 
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as UserStatus})}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
              </div>
              
              {!editingUser && (
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <Input id="password" type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
                </div>
              )}

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700">Address</Label>
                <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-lg shadow-sm border-slate-200" />
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-lg hover:bg-slate-50 hover:text-slate-900 border-slate-200">Cancel</Button>
              <Button type="submit" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm">{editingUser ? "Save Changes" : "Create User"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
