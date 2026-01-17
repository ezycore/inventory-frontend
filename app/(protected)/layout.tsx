"use client"

import AppSidebar from "@/components/layout/app-sidebar"
import { getCookie } from "cookies-next"
import Header from "@/components/layout/header"
import KBar from "@/components/kbar"
import { SidebarProvider, SidebarInset } from "@ui/components/sidebar"
import { useAuthStore } from "@/stores/use-auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Check authentication on mount and when it changes
    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated, redirecting to login')
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  // Don't render protected content if not authenticated
  if (!isAuthenticated || !user) {
    return null
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
  )
}
