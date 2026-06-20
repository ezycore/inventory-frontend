import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Subdomain rewrite for storefronts: `{slug}.STOREFRONT_ROOT` → `/s/{slug}`.
 *
 * INERT BY DEFAULT. It only acts when `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN` is set
 * (e.g. "mystore.com"), which is intentionally a DIFFERENT domain from the staff
 * workspace subdomains, so the two never collide. Until then, storefronts are
 * reached path-based at `/s/{slug}` and this branch is a no-op.
 */
const STOREFRONT_ROOT = process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN;

// Define public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/resend-verification",
];

// Define auth routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  // 1) Storefront subdomain rewrite (runs first; inert unless STOREFRONT_ROOT set).
  if (STOREFRONT_ROOT) {
    const host = (request.headers.get("host") || "").split(":")[0];
    // Must be a subdomain of the storefront root (not the apex itself).
    if (host !== STOREFRONT_ROOT && host.endsWith(`.${STOREFRONT_ROOT}`)) {
      const slug = host.slice(0, host.length - STOREFRONT_ROOT.length - 1);
      if (slug && slug !== "www" && !request.nextUrl.pathname.startsWith("/s/")) {
        const url = request.nextUrl.clone();
        url.pathname = `/s/${slug}${url.pathname === "/" ? "" : url.pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  const { pathname } = request.nextUrl;

  // Storefronts are public — never gate them behind auth.
  if (pathname.startsWith("/s/")) {
    return NextResponse.next();
  }

  // Check for auth token in cookies (server-side accessible)
  const token = request.cookies.get("auth-token")?.value;
  const isAuthenticated = !!token;
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Handle root path
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If user has token and trying to access auth routes, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If no token and trying to access protected route, redirect to login
  if (!isAuthenticated && !isPublicRoute && !pathname.startsWith("/api")) {
    const loginUrl = new URL("/login", request.url);
    const callbackUrl = pathname + request.nextUrl.search;
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Allow access
  return NextResponse.next();
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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
