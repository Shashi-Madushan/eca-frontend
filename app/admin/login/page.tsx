"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message || "Invalid credentials");
      }

      const userData = await res.json();
      login(userData);
      toast.success("Admin login successful");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,_#ffffff,_#f4f4f5)] p-4 lg:p-8">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-black/8 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(180deg,_#111111,_#2b2b2b)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/55">
              ECA POS
            </p>
            <h1 className="mt-6 max-w-md text-5xl font-semibold tracking-[-0.06em]">
              Proper retail operations start with a calm control room.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/72">
              Access the management workspace for orders, catalog control, staff, and front-counter checkout.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Clean white-first retail interface",
              "Centralized staff, product, and customer management",
              "Quick access to the live POS terminal",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-sm text-white/80"
              >
                <ShieldCheck className="h-5 w-5 text-white" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/40">
                Admin Login
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">
                Sign in to the dashboard
              </h2>
              <p className="text-sm leading-6 text-black/58">
                Use your administrator account to open the POS back office and store management screens.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-black/75">
                  Username
                </Label>
              <Input
                id="username"
                type="text"
                placeholder="admin_user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 text-black shadow-none placeholder:text-black/35"
              />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-black/75">
                  Password
                </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-2xl border-black/10 bg-black/[0.02] px-4 text-black shadow-none"
              />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-2xl bg-black text-white hover:bg-black/90"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Enter dashboard"}
                {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Button>
            </form>

            <div className="mt-6 rounded-[24px] border border-black/8 bg-black/[0.02] px-4 py-4 text-sm text-black/60">
              Need an admin account?{" "}
              <Link href="/admin/register" className="font-semibold text-black underline underline-offset-4">
                Register here
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
