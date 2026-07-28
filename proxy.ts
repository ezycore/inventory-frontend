// coding-standard: maintained
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hostnameOf, resolveStoreForHost } from "@/lib/storefront-host-map";

/**
 * Option A routing + admin auth gate.
 *
 * Tenant model: we own `ezycore.com`. On a tenant subdomain
 * (`{slug}.ezycore.com`) the admin owns the root and the public store lives at
 * `/shop`; internally everything renders from the `app/(storefront)/shop` tree.
 * The store slug always comes from the HOST (subdomain, custom-domain map, or
 * the backend's domains registry), never a path segment, and is forwarded to
 * the storefront via `x-ezy-store-*` request headers (read by
 * `lib/storefront-host.ts`).
 *
 *   - tenant subdomain   `{slug}.ezycore.com/shop/…`  → store (base `/shop`)
 *   - custom domain      `mystore.com/…` (root)        → store (base ``) —
 *     resolved via the env map first, then the backend's Settings → Domains
 *     registry (`lib/storefront-domain-lookup.ts`, cached ~60s)
 *   - `*.localhost`      `{slug}.localhost/shop/…`     → store, for local dev
 *   - everything else                                  → admin (auth-gated)
 *
 * The host→store rules themselves live in `lib/storefront-host-map.ts` — shared,
 * because `/robots.txt` and `/sitemap.xml` are excluded by the matcher below and
 * so must resolve the host without going through this proxy.
 */

// Public admin routes that don't require authentication.
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/resend-verification",
];

// Auth routes that should redirect to the dashboard if already authenticated.
const authRoutes = ["/login", "/signup"];

const isStorePath = (pathname: string) =>
  pathname === "/shop" || pathname.startsWith("/shop/");

const isLegacyStorePath = (pathname: string) =>
  pathname === "/s" || pathname.startsWith("/s/");

export async function proxy(request: NextRequest) {
  const hostHeader = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Build-time config first, then the merchant custom-domain registry (cached, so
  // steady-state traffic doesn't pay an extra round trip).
  const store = await resolveStoreForHost(hostnameOf(hostHeader));

  // Never trust client-supplied store headers — strip them, then set our own
  // from the resolved host so they can't be spoofed.
  const headers = new Headers(request.headers);
  headers.delete("x-ezy-store-slug");
  headers.delete("x-ezy-store-base");
  headers.delete("x-ezy-store-origin");

  if (store) {
    const proto =
      request.headers.get("x-forwarded-proto") ||
      request.nextUrl.protocol.replace(":", "");
    headers.set("x-ezy-store-slug", store.slug);
    headers.set("x-ezy-store-base", store.base);
    headers.set("x-ezy-store-origin", `${proto}://${hostHeader}`);

    // `/s/...` is gone — bounce any old links to the public store base.
    if (isLegacyStorePath(pathname)) {
      return NextResponse.redirect(new URL(store.base || "/", request.url));
    }

    if (store.base === "") {
      // Custom domain: the store is served at the root → rewrite to /shop.
      if (!isStorePath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = `/shop${pathname === "/" ? "" : pathname}`;
        return NextResponse.rewrite(url, { request: { headers } });
      }
      // Keep the internal `/shop` path out of the public custom-domain URL space.
      return NextResponse.redirect(
        new URL(pathname.replace(/^\/shop/, "") || "/", request.url),
      );
    }

    // Tenant subdomain: only `/shop/*` is the store; the rest is admin.
    if (isStorePath(pathname)) {
      return NextResponse.next({ request: { headers } });
    }
    // …otherwise fall through to the admin auth gate below.
  } else {
    // Non-store host. Two cases land here:
    //  - the storefront route on an unknown host: it still renders (shows
    //    "unavailable"); keep it public, never auth-gated.
    //  - `admin.<custom-domain>`: `store-by-host` returns exists:false for the
    //    admin kind, so it resolves to no store and falls through to the admin
    //    auth gate below — i.e. the merchant admin app is served there.
    if (isStorePath(pathname)) {
      return NextResponse.next({ request: { headers } });
    }
    if (isLegacyStorePath(pathname)) {
      return NextResponse.redirect(new URL("/shop", request.url));
    }
  }

  // ---- Admin auth gate ----
  const token = request.cookies.get("auth-token")?.value;
  const isAuthenticated = !!token;
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Handle root path
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url),
    );
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
