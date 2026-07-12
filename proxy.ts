import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Option A routing + admin auth gate.
 *
 * Tenant model: we own `ezycore.com`. On a tenant subdomain
 * (`{slug}.ezycore.com`) the admin owns the root and the public store lives at
 * `/shop`; internally everything renders from the `app/(storefront)/shop` tree.
 * The store slug always comes from the HOST (subdomain or custom-domain map),
 * never a path segment, and is forwarded to the storefront via `x-ezy-store-*`
 * request headers (read by `lib/storefront-host.ts`).
 *
 *   - tenant subdomain   `{slug}.ezycore.com/shop/…`  → store (base `/shop`)
 *   - custom domain      `mystore.com/…` (root)        → store (base ``)
 *   - `*.localhost`      `{slug}.localhost/shop/…`     → store, for local dev
 *   - everything else                                  → admin (auth-gated)
 *
 * `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN` is the tenant root (e.g. "ezycore.com");
 * empty in local dev, where `*.localhost` stands in for it.
 */
const STOREFRONT_ROOT = process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN;

/** Custom domains → store slug, e.g. `{"mystore.com":"rmc41"}`. Wired manually. */
const CUSTOM_DOMAIN_MAP: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_MAP || "{}");
  } catch {
    return {};
  }
})();

// Subdomains on the tenant root that are NOT stores (central app, www).
const RESERVED_SUBDOMAINS = new Set(["www", "app"]);

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

type ResolvedStore = { slug: string; base: "/shop" | "" };

/** Map a request host to its store, or null when the host is not a storefront. */
function resolveStore(host: string): ResolvedStore | null {
  // Custom domain: the whole host is the store, served at its root.
  if (CUSTOM_DOMAIN_MAP[host]) {
    return { slug: CUSTOM_DOMAIN_MAP[host], base: "" };
  }
  // Local dev: `{slug}.localhost` behaves like a tenant subdomain.
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) return { slug: sub, base: "/shop" };
  }
  // Production tenant subdomain: `{slug}.ezycore.com`.
  if (
    STOREFRONT_ROOT &&
    host !== STOREFRONT_ROOT &&
    host.endsWith(`.${STOREFRONT_ROOT}`)
  ) {
    const sub = host.slice(0, host.length - STOREFRONT_ROOT.length - 1);
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) return { slug: sub, base: "/shop" };
  }
  return null;
}

const isStorePath = (pathname: string) =>
  pathname === "/shop" || pathname.startsWith("/shop/");

const isLegacyStorePath = (pathname: string) =>
  pathname === "/s" || pathname.startsWith("/s/");

export function proxy(request: NextRequest) {
  const hostHeader = request.headers.get("host") || "";
  const host = hostHeader.split(":")[0];
  const { pathname } = request.nextUrl;
  const store = resolveStore(host);

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
    // Non-store host: the storefront route still exists but has no slug →
    // render it (it shows "unavailable"); keep it public, never auth-gated.
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
