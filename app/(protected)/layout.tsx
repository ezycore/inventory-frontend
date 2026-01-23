"use client";

import KBar from "@/components/kbar";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { useMe } from "@/hooks/queries/use-auth";
import { SidebarInset, SidebarProvider } from "@ui/components/sidebar";
import { getCookie } from "cookies-next";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultOpen = getCookie("sidebar_state") !== "false";
  const verifyMe = useMe();

  useEffect(() => {
    verifyMe.mutate();
  }, []);
  
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
