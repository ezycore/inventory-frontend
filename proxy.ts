import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for handling route redirects
 * NOTE: Auth checks are handled client-side via Zustand store
 * This middleware only handles the root path redirect
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle root path - redirect to dashboard (auth will be checked client-side)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Allow access to all other routes - auth is checked client-side
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
