"use client"

import { useAuthStore } from "@/stores/use-auth-store"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Allow access to verification and reset password pages even when authenticated
    const publicPages = ['/verify-email', '/reset-password']
    const isPublicPage = publicPages.some(page => pathname.startsWith(page))

    // If user is authenticated and trying to access login/signup, redirect to dashboard
    if (isAuthenticated && user && !isPublicPage) {
      console.log('✅ Already authenticated, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router, pathname])

  return <>{children}</>
}
