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
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    verifyMe.mutate();
  }, []);

  useEffect(() => {
    // Read cookie only on client-side after mount
    const cookieValue = getCookie("sidebar_state");
    setDefaultOpen(cookieValue !== "false");
    setMounted(true);
  }, []);

  // Prevent rendering until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
