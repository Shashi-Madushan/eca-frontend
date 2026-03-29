"use client";

import {
  ClipboardList,
  Home,
  LogOut,
  Package,
  ShoppingCart,
  UserSquare2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const items = [
  {
    title: "Overview",
    blurb: "Today at a glance",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Users",
    blurb: "Staff and permissions",
    url: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Customers",
    blurb: "Profiles and loyalty",
    url: "/dashboard/customers",
    icon: UserSquare2,
  },
  {
    title: "Products",
    blurb: "Catalog and stock",
    url: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Orders",
    blurb: "Manual and live orders",
    url: "/dashboard/orders",
    icon: ClipboardList,
  },
  {
    title: "POS Terminal",
    blurb: "Checkout workspace",
    url: "/dashboard/pos",
    icon: ShoppingCart,
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <Sidebar className="border-r-0 bg-transparent p-3">
      <div className="flex h-full flex-col rounded-[30px] border border-black/8 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <SidebarHeader className="gap-4 border-b border-black/6 px-4 py-5">
          <div className="rounded-[24px] bg-[linear-gradient(180deg,_#111111,_#2c2c2c)] p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">
                  ECA POS
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                  Retail Console
                </h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/75">
                Live
              </div>
            </div>
            <div className="mt-5 rounded-[20px] border border-white/10 bg-white/8 px-3 py-3">
              <p className="text-xs text-white/55">Signed in as</p>
              <p className="mt-1 text-sm font-semibold">{user?.username || "Unknown"}</p>
              <p className="text-xs text-white/60">{user?.userType || "N/A"}</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="pos-scrollbar pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-black/38">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={pathname === item.url}
                    className="h-auto rounded-[22px] px-3 py-3 text-black/65 transition-all data-[active=true]:bg-black data-[active=true]:text-white data-[active=true]:shadow-[0_12px_30px_rgba(15,23,42,0.2)] hover:bg-black/[0.04] hover:text-black"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-current/10 bg-current/5">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold">{item.title}</span>
                        <span className="truncate text-xs text-current/65">{item.blurb}</span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-3 border-t border-black/6 px-4 py-5">
          <div className="rounded-[22px] border border-black/8 bg-black/[0.025] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/35">
              Session
            </p>
            <p className="mt-2 text-sm font-semibold text-black">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-black/55">Ready for checkout and back office tasks</p>
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="h-11 w-full justify-start rounded-2xl border-black/10 bg-white px-4 text-black shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:bg-black/[0.03]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
