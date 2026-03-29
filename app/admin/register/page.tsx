"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminRegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const router = useRouter();

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message || "Failed to register admin");
      }

      toast.success("Admin account created successfully");
      router.push("/admin/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,_#ffffff,_#f4f4f5)] p-4 lg:p-8">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-black/8 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.08)] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(180deg,_#101010,_#303030)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/55">
              ECA POS
            </p>
            <h1 className="mt-6 max-w-sm text-5xl font-semibold tracking-[-0.06em]">
              Create the admin account that runs the floor.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/72">
              Set up a new administrator with full access to users, catalog, customer data, orders, and POS operations.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Back office access for store operations",
              "Protected account onboarding for administrators",
              "Same white-first POS workspace after login",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-sm text-white/80"
              >
                <ShieldPlus className="h-5 w-5 text-white" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mb-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/40">
              Create Admin Account
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">
              Register a new administrator
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-black/58">
              Fill in the administrator details below. This only updates the frontend presentation and keeps the same registration behavior.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="firstName" className="text-sm font-medium text-black/75">
                  First Name
                </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 shadow-none"
              />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="lastName" className="text-sm font-medium text-black/75">
                  Last Name
                </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 shadow-none"
              />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="username" className="text-sm font-medium text-black/75">
                  Username
                </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                required
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 shadow-none"
              />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="email" className="text-sm font-medium text-black/75">
                  Email
                </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 shadow-none"
              />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="password" className="text-sm font-medium text-black/75">
                  Password
                </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                minLength={6}
                required
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 shadow-none"
              />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-black/75">
                  Confirm Password
                </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                minLength={6}
                required
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 shadow-none"
              />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="phone" className="text-sm font-medium text-black/75">
                  Phone
                </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Optional"
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 shadow-none"
              />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="address" className="text-sm font-medium text-black/75">
                  Address
                </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Optional"
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 shadow-none"
              />
            </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-black text-white hover:bg-black/90"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Admin Account"}
              {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
          </form>

          <div className="mt-6 rounded-[24px] border border-black/8 bg-black/[0.02] px-4 py-4 text-sm text-black/60">
            Already have an account?{" "}
            <Link href="/admin/login" className="font-semibold text-black underline underline-offset-4">
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
