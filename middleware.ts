import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain rewrite for storefronts: `{slug}.STOREFRONT_ROOT` → `/s/{slug}`.
 *
 * INERT BY DEFAULT. It only acts when `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN` is set
 * (e.g. "mystore.com"), which is intentionally a DIFFERENT domain from the staff
 * workspace subdomains, so the two never collide. Until then, storefronts are
 * reached path-based at `/s/{slug}` and this middleware is a no-op.
 */
const STOREFRONT_ROOT = process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN;

export function middleware(req: NextRequest) {
  if (!STOREFRONT_ROOT) return NextResponse.next();

  const host = (req.headers.get("host") || "").split(":")[0];
  // Must be a subdomain of the storefront root (not the apex itself).
  if (host === STOREFRONT_ROOT || !host.endsWith(`.${STOREFRONT_ROOT}`)) {
    return NextResponse.next();
  }

  const slug = host.slice(0, host.length - STOREFRONT_ROOT.length - 1);
  if (!slug || slug === "www") return NextResponse.next();

  const url = req.nextUrl.clone();
  if (url.pathname.startsWith("/s/")) return NextResponse.next();
  url.pathname = `/s/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, the API, and static files.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
