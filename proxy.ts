// coding-standard: maintained
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  hostnameOf,
  isLocalDevHost,
  isTenantRoutingConfigured,
  resolveStoreForHost,
  type ResolvedStore,
} from "@/lib/storefront-host-map";
import {
  lookupCanonicalHostByHost,
  lookupCanonicalHostBySlug,
} from "@/lib/storefront-domain-lookup";
import { canonicalRedirectFor } from "@/lib/storefront-canonical-redirect";
import {
  PREVIEW_COOKIE,
  PREVIEW_REQUEST_HEADER,
  PREVIEW_TOKEN_PARAM,
} from "@/lib/storefront-preview";

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
 *
 * A store with a custom domain renders on more than one of those hosts at once,
 * so store traffic is additionally **301'd onto its canonical host**
 * (`canonicalRedirectFor`) — the admin app is never touched by it. See
 * `lib/storefront-canonical-redirect.ts`.
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

/**
 * The one host this store's public URLs belong to, or null to serve the request
 * where it is. Costs one cached backend lookup per store per minute per instance.
 *
 * Skipped outright in two cases, on the same principle `robots.ts` and
 * `sitemap.ts` follow — say nothing rather than say something false:
 *  - **local dev** (`*.localhost`), where a store whose seed data names a
 *    production domain would bounce the developer clean out of their dev server;
 *  - **a build with no `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN`**, which cannot tell a
 *    tenant subdomain from a custom domain and therefore cannot know whether
 *    `/shop` belongs in the target path.
 */
const canonicalHostFor = async (
  store: ResolvedStore,
  host: string,
): Promise<string | null> => {
  if (isLocalDevHost(host) || !isTenantRoutingConfigured()) return null;
  // On a custom domain this reuses the cache entry the host→slug lookup just
  // filled, so resolving both costs one fetch, not two.
  return store.base === ""
    ? lookupCanonicalHostByHost(host)
    : lookupCanonicalHostBySlug(store.slug);
};

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
  headers.delete(PREVIEW_REQUEST_HEADER);

  if (store) {
    const proto =
      request.headers.get("x-forwarded-proto") ||
      request.nextUrl.protocol.replace(":", "");
    headers.set("x-ezy-store-slug", store.slug);
    headers.set("x-ezy-store-base", store.base);
    headers.set("x-ezy-store-origin", `${proto}://${hostHeader}`);

    // Owner preview (`lib/storefront-preview.ts`). The token rides in the URL
    // because a cross-origin iframe's own navigation is the one request the
    // admin cannot attach a header to — and it is moved onto a header HERE
    // because the storefront layout, which does the fetching, is a layout: it
    // receives `headers()` and never `searchParams`.
    //
    // The URL carries it once; the cookie carries it thereafter, so exploring an
    // unpublished shop does not fall out of preview on the first click. Both are
    // forwarded verbatim — the backend is what decides whether either means
    // anything, and a token for another org opens nothing here.
    const freshToken = request.nextUrl.searchParams.get(PREVIEW_TOKEN_PARAM);
    const previewToken =
      freshToken ?? request.cookies.get(PREVIEW_COOKIE)?.value ?? null;
    if (previewToken) headers.set(PREVIEW_REQUEST_HEADER, previewToken);

    /** Remembers a token that arrived in the URL, on this store's host only. */
    const keepPreview = (response: NextResponse): NextResponse => {
      if (freshToken) {
        response.cookies.set(PREVIEW_COOKIE, freshToken, {
          path: "/",
          sameSite: "lax",
          secure: proto === "https",
          // Matches the token's own lifetime: a cookie that outlives its token
          // just means the shop 404s again with no hint as to why.
          maxAge: 4 * 60 * 60,
        });
      }
      return response;
    };

    // `/s/...` is gone — bounce any old links to the public store base.
    if (isLegacyStorePath(pathname)) {
      return NextResponse.redirect(new URL(store.base || "/", request.url));
    }

    // ---- One permanent home per store ----
    //
    // A store with a custom domain renders on every host that resolves to it:
    // the domain, a registered `www.` twin, and `{slug}.ezycore.com/shop`. The
    // canonical tag asks a crawler to pick one; this tells it. Handles the host
    // swap and the `/shop` strip together, so a stale
    // `www.uriibaba.com/shop/phones` reaches `uriibaba.com/phones` in one hop.
    //
    // Only store traffic pays the lookup: on a tenant subdomain the admin app
    // owns every path outside `/shop` and must never be redirected anywhere.
    //
    // **A preview is exempt.** This redirect exists so crawlers index one host,
    // and a preview is seen by one person and indexed by nobody — so it buys
    // nothing here and costs something real: it would move an owner previewing a
    // shop that has a custom domain from `{slug}.ezycore.com` (same site as the
    // admin, so the preview cookie sticks) onto `mystore.com`, where the frame is
    // cross-site and a `Lax` cookie is neither set nor sent. The preview would
    // then survive exactly one page, and only in browsers permissive enough to
    // have kept it at all.
    if (!previewToken && (store.base === "" || isStorePath(pathname))) {
      const host = hostnameOf(hostHeader);
      const target = canonicalRedirectFor({
        method: request.method,
        host,
        pathname,
        base: store.base,
        canonicalHost: await canonicalHostFor(store, host),
      });
      if (target) {
        // A canonical host is served over TLS by definition — it only reaches
        // `active` once its on-demand certificate is issued. Staying on the same
        // host keeps the request's own scheme and port, which is what makes the
        // `/shop` strip still work on a plain-http dev origin.
        const sameHost = target.host === host;
        const scheme = sameHost
          ? request.nextUrl.protocol.replace(":", "")
          : "https";
        const destination = `${scheme}://${sameHost ? hostHeader : target.host}${target.path}${request.nextUrl.search}`;
        return NextResponse.redirect(destination, 301);
      }
    }

    if (store.base === "") {
      // Custom domain: the store is served at the root → rewrite to /shop.
      if (!isStorePath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = `/shop${pathname === "/" ? "" : pathname}`;
        return keepPreview(NextResponse.rewrite(url, { request: { headers } }));
      }
      // Keep the internal `/shop` path out of the public custom-domain URL space.
      // GET/HEAD already left above with a 301; this catches the rest, where a
      // permanent redirect would be the wrong instruction to cache.
      return NextResponse.redirect(
        new URL(pathname.replace(/^\/shop/, "") || "/", request.url),
      );
    }

    // Tenant subdomain: only `/shop/*` is the store; the rest is admin.
    if (isStorePath(pathname)) {
      return keepPreview(NextResponse.next({ request: { headers } }));
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
