"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DashboardPageHeader,
  DashboardPageShell,
  MetricCard,
  SoftBadge,
  SurfacePanel,
  SurfaceHeader,
} from "@/components/dashboard/ui";
import { ArrowRight, ClipboardList, Package, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Command Center"
        title={`Welcome back, ${user?.firstName || user?.username}`}
        description="Run daily retail operations from one clean workspace. Use the dashboard to monitor people, products, customers, and orders before jumping into checkout."
        actions={
          <>
            <Button
              variant="outline"
              onClick={logout}
              className="h-11 rounded-2xl border-black/10 bg-white px-5 text-black hover:bg-black/[0.03]"
            >
              Sign out
            </Button>
            <Button
              render={<Link href="/dashboard/pos" />}
              className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
            >
              Open POS
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Role" value={user?.userType || "Unknown"} helper="Current access level" />
          <MetricCard label="Operator" value={user?.username || "Unknown"} helper={user?.email || "No email available"} />
          <MetricCard
            label="Workspace"
            value="Store Front"
            helper={<SoftBadge>{user?.status || "ACTIVE"}</SoftBadge>}
          />
        </div>
      </DashboardPageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SurfacePanel>
          <SurfaceHeader
            title="Daily workflow"
            description="Move between management and checkout tasks with a clear POS-style structure."
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {[
              {
                title: "Team management",
                description: "Update staff roles and access before opening or closing shifts.",
                href: "/dashboard/users",
                icon: Users,
              },
              {
                title: "Product catalog",
                description: "Keep pricing, inventory, and active product listings clean.",
                href: "/dashboard/products",
                icon: Package,
              },
              {
                title: "Customer care",
                description: "Track loyalty-ready customer records and purchase history.",
                href: "/dashboard/customers",
                icon: ShoppingCart,
              },
              {
                title: "Order desk",
                description: "Review manually created orders and order status changes.",
                href: "/dashboard/orders",
                icon: ClipboardList,
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-[24px] border border-black/8 bg-black/[0.02] p-5 transition hover:-translate-y-0.5 hover:bg-black/[0.04]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-black shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/60">{item.description}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-black">
                  Open
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </SurfacePanel>

        <SurfacePanel>
          <SurfaceHeader title="POS focus" description="Fast access to the counter workflow." />
          <div className="space-y-4 p-5 sm:p-6">
            <div className="rounded-[24px] bg-[linear-gradient(180deg,_#111111,_#252525)] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/55">
                Checkout Mode
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                Ready for the next customer
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Product browse, cart review, totals, and payment setup all stay on one screen.
              </p>
              <Button
                render={<Link href="/dashboard/pos" />}
                className="mt-6 h-11 rounded-2xl bg-white px-5 text-black hover:bg-white/90"
              >
                Launch terminal
              </Button>
            </div>

            <div className="rounded-[24px] border border-black/8 bg-black/[0.02] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/40">
                Suggested routine
              </p>
              <div className="mt-4 space-y-3 text-sm text-black/68">
                <p>1. Review low-stock products and pricing changes.</p>
                <p>2. Confirm customer records and operator session.</p>
                <p>3. Open the POS terminal and start checkout.</p>
              </div>
            </div>
          </div>
        </SurfacePanel>
      </div>
    </DashboardPageShell>
  );
}
