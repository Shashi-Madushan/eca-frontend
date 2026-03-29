"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, ShieldCheck, Trash2, Users2 } from "lucide-react";

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
import { User, UserStatus, UserType } from "@/types/models";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    userType: "EMPLOYEE" as UserType,
    status: "ACTIVE" as UserStatus,
    phone: "",
    address: "",
    password: "",
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
        delete (payload as { password?: string }).password;
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

  const activeUsers = useMemo(() => users.filter((user) => user.status === "ACTIVE").length, [users]);
  const managers = useMemo(() => users.filter((user) => user.userType !== "EMPLOYEE").length, [users]);

  const roleClass = (role: UserType) =>
    role === "ADMIN"
      ? "bg-black text-white border-black"
      : role === "MANAGER"
        ? "bg-black/[0.08] text-black border-black/10"
        : "bg-white text-black/70 border-black/10";

  const statusClass = (status: UserStatus) =>
    status === "ACTIVE"
      ? "bg-black text-white border-black"
      : status === "SUSPENDED"
        ? "bg-black/[0.08] text-black border-black/10"
        : "bg-white text-black/55 border-black/10";

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Staff Desk"
        title="User management"
        description="Manage staff accounts, roles, and status from a cleaner retail operations view."
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add user
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total users" value={users.length} helper="All staff profiles" />
          <MetricCard label="Active staff" value={activeUsers} helper="Currently available to operate" />
          <MetricCard label="Managers & admins" value={managers} helper="Elevated access accounts" />
        </div>
      </DashboardPageHeader>

      <SurfacePanel>
        <ToolbarRow>
          <form onSubmit={handleSearch} className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-2xl border-black/10 bg-white pl-11 shadow-[0_8px_24px_rgba(15,23,42,0.04)] placeholder:text-black/35"
            />
          </form>
          <SoftBadge>{users.length} records</SoftBadge>
        </ToolbarRow>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-black/6 bg-black/[0.02] hover:bg-black/[0.02]">
                <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Team member
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Contact
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Role
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Status
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
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={<Users2 className="h-6 w-6" />}
                      title="No users found"
                      description="Try a different search or create a new staff profile."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-black/6 hover:bg-black/[0.02]">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-black text-sm font-semibold text-white">
                          {user.firstName?.charAt(0) || user.username?.charAt(0) || "U"}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-black">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-black/55">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-medium text-black/78">{user.email}</p>
                      {user.phone ? <p className="text-xs text-black/45">{user.phone}</p> : null}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${roleClass(user.userType)}`}>
                        {formatEnumLabel(user.userType)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClass(user.status)}`}>
                        {formatEnumLabel(user.status)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-xl border-black/10 bg-white hover:bg-black/[0.03]"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-xl border-black/10 bg-white hover:bg-black/[0.03]"
                          onClick={() => deleteUser(user.id)}
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
        <DialogContent className="max-w-3xl rounded-[32px] border border-black/8 bg-white p-0 shadow-[0_28px_100px_rgba(15,23,42,0.12)]">
          <div className="border-b border-black/6 bg-[linear-gradient(180deg,_#ffffff,_#f4f4f5)] px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-black text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-black">
                  {editingUser ? "Edit user" : "Create user"}
                </DialogTitle>
                <p className="mt-1 text-sm text-black/55">
                  {editingUser
                    ? "Update the employee profile and permissions below."
                    : "Add a new team member to the system without changing any backend behavior."}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                <Label htmlFor="userType">Role</Label>
                <select
                  id="userType"
                  className="pos-select"
                  value={formData.userType}
                  onChange={(e) => setFormData({ ...formData, userType: e.target.value as UserType })}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="pos-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                />
              </div>
              {!editingUser ? (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-11 rounded-2xl border-black/10 bg-black/[0.02] px-4"
                  />
                </div>
              ) : null}
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
                {editingUser ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
