"use client";

import KBar from "@/components/kbar";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@ui/components/sidebar";
import { getCookie } from "cookies-next";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultOpen = getCookie("sidebar_state") !== "false";

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
