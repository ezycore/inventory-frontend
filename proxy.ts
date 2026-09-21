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
  PREVIEW_BUILDER_HEADER,
  PREVIEW_BUILDER_PARAM,
  PREVIEW_CLEAR_PARAM,
  PREVIEW_COOKIE,
  PREVIEW_REQUEST_HEADER,
  PREVIEW_TOKEN_PARAM,
} from "@/lib/storefront-preview";
import {
  cachedPageSlug,
  isSitesPath,
  isStoreHomePath,
  sitesHomePath,
  sitesPagePath,
  sitesPreviewPath,
} from "@/lib/storefront-sites";
import { storeHomePageExists, storePageExists } from "@/lib/storefront-page-lookup";

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
 *
 * Store pages that can be HTML-cached are rewritten one step further, onto
 * `app/(storefront)/sites/[slug]/[mode]/…` — a route that reads only its params
 * (`lib/storefront-sites.ts`). That internal path is never served directly.
 */

// Public admin routes that don't require authentication.
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/resend-verification",
  // Mission Control's support-session entry link. It MUST be public: the
  // operator arrives with a one-time code and no session at all, so the auth
  // gate would bounce them to /login — where they have no password to type,
  // because a support session deliberately never issues one. Found by loading
  // a real entry link in a browser; every unit test passed with this broken.
  "/support/enter",
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
  headers.delete(PREVIEW_BUILDER_HEADER);

  // The cached route's internal path is not a public URL. Served directly it would
  // put any store on the platform host (`app.ezycore.com/sites/<slug>/…`) — a
  // second, uncanonical copy of every tenant. A custom domain is exempt only
  // because it never gets here: its `/sites/…` is rewritten under `/shop` below,
  // where it is an ordinary collection path.
  if (isSitesPath(pathname) && store?.base !== "") {
    return new NextResponse(null, { status: 404 });
  }

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
    // The editor appends this once the shop is published — see PREVIEW_CLEAR_PARAM.
    // Checked BEFORE the cookie is read, so this request stops previewing too
    // rather than clearing the cookie and then serving one more preview anyway.
    const previewEnded = request.nextUrl.searchParams.has(PREVIEW_CLEAR_PARAM);
    const previewToken = previewEnded
      ? null
      : (freshToken ?? request.cookies.get(PREVIEW_COOKIE)?.value ?? null);
    if (previewToken) headers.set(PREVIEW_REQUEST_HEADER, previewToken);
    // The page editor's frame of a system page (`/cart?builder=1`): the route
    // draws the draft live instead of as saved. Meaningless without a token.
    if (previewToken && request.nextUrl.searchParams.get(PREVIEW_BUILDER_PARAM) === "1") {
      headers.set(PREVIEW_BUILDER_HEADER, "1");
    }

    /** Remembers a token that arrived in the URL, on this store's host only. */
    const keepPreview = (response: NextResponse): NextResponse => {
      if (previewEnded) {
        response.cookies.delete(PREVIEW_COOKIE);
        return response;
      }
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

    // ---- A landing page as the homepage ----
    //
    // The store's front door is the Customize home, drawn by the request-reading
    // `shop` route, unless the merchant chose a landing page for it (backend
    // `settings.homePageId`). Then it goes to the home routes beside the page
    // routes: the cached one, or under owner preview the one that reads the token
    // — and the question is asked with that token, since an unpublished shop
    // answers only its owner.
    //
    // The same routes draw the store's `home` system page, once its classic home has
    // moved onto the builder (the backend answers `/` with whichever applies).
    //
    // Never inside the Customize editor's frame (`?preview=1`): that frame edits
    // the Customize home, which the shop draws again once the choice is cleared.
    // The page editor's frame of a builder home says so (`builder=1`) and is let
    // through, since it streams that page's unsaved sections.
    const search = request.nextUrl.searchParams;
    const customizeFrame = search.get("preview") === "1" && search.get(PREVIEW_BUILDER_PARAM) !== "1";
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      isStoreHomePath(store, pathname) &&
      !customizeFrame &&
      (await storeHomePageExists(store.slug, previewToken))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = sitesHomePath(store, { preview: Boolean(previewToken) });
      return keepPreview(NextResponse.rewrite(url, { request: { headers } }));
    }

    // ---- HTML-cached store pages ----
    //
    // Onto the route that reads nothing but its params, so Next can cache the
    // page per store and path. A preview is excluded — the cached route never
    // previews, and the preview token is exactly the request state it cannot
    // read — and so is anything but a read.
    //
    // And only a page that exists: a cached render cannot draw the shop's own
    // 404 (see `lib/storefront-page-lookup.ts`), so a miss stays on the
    // request-reading route below, which can.
    // ---- Owner preview of a store page ----
    //
    // Onto its own request-reading route beside the cached one, which draws the
    // draft in the page's own chrome. `shop/pages/[pageSlug]` cannot: its layout
    // always draws the full shop shell. No existence check — a preview may be of
    // a page nobody else can see, and the route answers its own 404.
    if (previewToken && (request.method === "GET" || request.method === "HEAD")) {
      const previewSlug = cachedPageSlug(store, pathname);
      if (previewSlug) {
        const url = request.nextUrl.clone();
        url.pathname = sitesPreviewPath(store, previewSlug);
        return keepPreview(NextResponse.rewrite(url, { request: { headers } }));
      }
    }

    const pageSlug =
      !previewToken && (request.method === "GET" || request.method === "HEAD")
        ? cachedPageSlug(store, pathname)
        : null;
    if (pageSlug && (await storePageExists(store.slug, pageSlug))) {
      const url = request.nextUrl.clone();
      url.pathname = sitesPagePath(store, pageSlug);
      return keepPreview(NextResponse.rewrite(url, { request: { headers } }));
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
