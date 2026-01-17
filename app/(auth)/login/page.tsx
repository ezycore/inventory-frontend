"use client"

import { LoginForm } from "@/components/login-form"
import { useAuthStore } from "@/stores/use-auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Wait for hydration, then redirect if already authenticated
    if (_hasHydrated && isAuthenticated && accessToken) {
      router.replace("/dashboard")
    }
  }, [_hasHydrated, isAuthenticated, accessToken, router])

  // Show loading while checking auth
  if (!_hasHydrated) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated && accessToken) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
