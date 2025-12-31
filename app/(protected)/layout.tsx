"use client"

import AppSidebar from "@/components/layout/app-sidebar"
import { getCookie } from "cookies-next"
import Header from "@/components/layout/header"
import KBar from "@/components/kbar"
import { SidebarProvider, SidebarInset } from "@ui/components/sidebar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'

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
  )
}
