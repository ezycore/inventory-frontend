"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppSidebar from "@/components/layout/app-sidebar"
import { getCookie } from "cookies-next"
import Header from "@/components/layout/header"
import KBar from "@/components/kbar"
import { SidebarProvider, SidebarInset } from "@ui/components/sidebar"
import { useAuthStore } from "@/stores/use-auth-store"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand store to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Redirect to login if not authenticated (only after hydration)
  useEffect(() => {
    if (isHydrated && (!isAuthenticated || !token)) {
      router.replace('/login')
    }
  }, [isHydrated, isAuthenticated, token, router])

  // Show nothing until store is hydrated
  if (!isHydrated) {
    return null
  }

  // Don't render protected content if not authenticated
  if (!isAuthenticated || !token) {
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
