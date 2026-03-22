"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

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

  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full relative">
        <div className="absolute top-4 left-4 z-50">
          <SidebarTrigger />
        </div>
        <div className="p-8 mt-12 w-full h-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
