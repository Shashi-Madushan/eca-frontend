"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CalendarDays, LayoutGrid, Search } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[linear-gradient(180deg,_#ffffff,_#f4f4f5)]">
        <div className="rounded-[28px] border border-black/8 bg-white px-8 py-6 text-sm font-medium text-black/60 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="pos-shell">
        <header className="sticky top-0 z-30 border-b border-black/6 bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-10 w-10 rounded-2xl border border-black/8 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-black/[0.03]" />
              <div className="hidden rounded-2xl border border-black/8 bg-black/[0.03] px-3 py-2 text-sm text-black/65 md:flex md:items-center md:gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span>Store Operations</span>
              </div>
            </div>

            <div className="hidden max-w-md flex-1 lg:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                <Input
                  aria-label="Workspace search"
                  placeholder="Search products, customers, orders..."
                  className="h-11 rounded-2xl border-black/8 bg-black/[0.03] pl-11 text-sm shadow-none placeholder:text-black/35"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-2xl border border-black/8 bg-white px-3 py-2 text-sm text-black/65 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:flex">
                <CalendarDays className="h-4 w-4" />
                <span>{todayLabel}</span>
              </div>
              <Button
                variant="outline"
                className="h-11 rounded-2xl border-black/10 bg-white px-4 text-black shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:bg-black/[0.03]"
              >
                {user.firstName || user.username}
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
