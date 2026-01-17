import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/resend-verification',
]

// Define auth routes that should redirect to dashboard if already authenticated
const authRoutes = [
  '/login',
  '/signup',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user has token in cookies (for server-side check)
  const authToken = request.cookies.get('auth_token')?.value

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Handle root path
  if (pathname === '/') {
    if (authToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If user has token and trying to access auth routes, redirect to dashboard
  if (authToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If no token and trying to access protected route, redirect to login
  if (!authToken && !isPublicRoute && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
