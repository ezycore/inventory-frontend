"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/use-auth-store"
import { Loader2 } from "lucide-react"

// Routes that don't require authentication
const publicRoutes = ["/login", "/setup/owner"]

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/setup/owner"]

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore()

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const hasAuth = isAuthenticated && !!accessToken

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!_hasHydrated) {
      return
    }

    // If user is not authenticated and trying to access protected route, redirect to login
    if (!hasAuth && !isPublicRoute) {
      router.replace("/login")
    }
  }, [_hasHydrated, hasAuth, isPublicRoute, router])

  // Show loading while waiting for hydration
  if (!_hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show loading if not authenticated (will redirect)
  if (!hasAuth && !isPublicRoute) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
