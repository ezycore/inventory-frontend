"use client";

import KBar from "@/components/kbar";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { useMe } from "@/services/api";
import { SidebarInset, SidebarProvider } from "@ui/components/sidebar";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const verifyMe = useMe();

  // Use consistent default for SSR, then update after mount
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Read cookie only after component mounts to avoid hydration mismatch
    const cookieValue = getCookie("sidebar_state");
    if (cookieValue === "false") {
      setSidebarOpen(false);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    verifyMe.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run once on mount
  }, []);

  return (
    <KBar>
      <SidebarProvider
        defaultOpen={sidebarOpen}
        open={isMounted ? sidebarOpen : undefined}
        onOpenChange={isMounted ? setSidebarOpen : undefined}
      >
        <AppSidebar />
        <SidebarInset>
          <Header />
          <div className="min-h-screen">
            <div className="container mx-auto p-4 sm:p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
