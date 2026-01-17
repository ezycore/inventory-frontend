"use client"

import AppSidebar from "@/components/layout/app-sidebar"
import { getCookie } from "cookies-next"
import Header from "@/components/layout/header"
import KBar from "@/components/kbar"
import { SidebarProvider, SidebarInset } from "@ui/components/sidebar"
import { AuthGuard } from "@/components/providers/auth-guard"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <AuthGuard>
      <KBar>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset>
            <Header />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </KBar>
    </AuthGuard>
  )
}
