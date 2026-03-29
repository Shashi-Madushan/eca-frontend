"use client";

import { Home, Users, UserSquare2, LogOut, Package, ClipboardList, ShoppingCart } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

const items = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "User Management",
    url: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Customer Management",
    url: "/dashboard/customers",
    icon: UserSquare2,
  },
  {
    title: "Product Management",
    url: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Order Management",
    url: "/dashboard/orders",
    icon: ClipboardList,
  },
  {
    title: "POS",
    url: "/dashboard/pos",
    icon: ShoppingCart,
  },
]

export function AppSidebar() {
  const { user } = useAuth();

  return (
    <Sidebar className="border-r border-slate-200 bg-white">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <div className="px-4 pb-3 mb-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Operator</p>
            <p className="text-sm font-bold text-slate-900">{user?.username || "Unknown"}</p>
            <p className="text-xs text-slate-500">{user?.userType || "N/A"}</p>
          </div>

          <SidebarGroupLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />} className="transition-all hover:bg-slate-100/80 rounded-lg text-slate-600 hover:text-slate-900 font-medium py-2.5">
                    <item.icon className="w-5 h-5 opacity-70" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 pb-10 border-t border-slate-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => {
                // Perform logout, could redirect or call an endpoint
                console.log("Logout triggered");
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all font-medium rounded-lg py-2.5"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
