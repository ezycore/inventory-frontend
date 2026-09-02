// coding-standard: maintained
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  hostnameOf,
  resolveStoreForHost,
} from "@/lib/storefront-host-map";
import { getStore } from "@/lib/storefront-server";
import { faviconHref } from "@/lib/storefront-client";

/**
 * Per-host `/favicon.ico`.
 *
 * The browser asks for this path implicitly, and Google falls back to it when a
 * page declares no icon it can read. Until this route existed it was answered by
 * the static file `public/favicon.ico` — one image, the EzyCore mark, served
 * from **every** host including a merchant's own domain. `uriibaba.com/favicon.ico`
 * returning our logo is the visible version of that; the invisible version is a
 * store on a bare `{slug}.ezycore.com` having no reachable icon at all, because
 * its `<link rel="icon">` lives at `/shop` while a crawler only reads the icon
 * off the home page — and on a tenant subdomain the home page is the admin app.
 *
 * So: resolve the host the same way `proxy.ts` and `robots.ts` do, and answer
 * with that store's own icon. Hosts that are not storefronts (the tenant root,
 * `app.`, `admin.<domain>`) keep the platform mark, which is correct — those
 * *are* EzyCore.
 *
 * A redirect rather than a proxied body: the icon already sits on the CDN behind
 * a year-long immutable cache, and streaming it through here would put every
 * bot's `/favicon.ico` probe — the single most-scanned path on the internet —
 * onto the app server's bandwidth to re-serve bytes Cloudflare already holds.
 *
 * NOTE: this only works because `public/favicon.ico` was deleted. A file in
 * `public/` is served ahead of any route, so leaving it there would shadow this
 * silently — the route would look correct in the tree and never once run.
 */

// The answer depends on the request host, so it can never be prerendered: one
// baked response would hand every tenant the same icon, which is the bug.
export const dynamic = "force-dynamic";

/** The EzyCore mark, for every host that is not a merchant storefront. */
const PLATFORM_ICON = "/icon.png";

export async function GET() {
  const h = await headers();
  const host = hostnameOf(h.get("host") || "");
  const origin = `${h.get("x-forwarded-proto") || "https"}://${h.get("host")}`;

  const store = await resolveStoreForHost(host);
  if (!store) return NextResponse.redirect(new URL(PLATFORM_ICON, origin), 307);

  // `getStore` is the same cached fetch the storefront layout makes (300s), so
  // in steady state this costs no backend request of its own.
  const icon = await getStore(store.slug)
    .then((s) => faviconHref(s?.favicon))
    .catch(() => undefined);

  // 307, not 308: "this store has no icon yet" and "this store's icon is X" are
  // both answers that change the day the merchant uploads one, and a permanent
  // redirect to the platform mark would be cached by browsers past that point.
  return NextResponse.redirect(icon ?? new URL(PLATFORM_ICON, origin), 307);
}
