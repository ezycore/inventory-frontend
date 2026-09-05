import { RouteAccessGuard } from "@/components/shared/route-access-guard";

/**
 * Feature gate for the sales section (sales, returns, storefront).
 *
 * The counter, sales history and sales returns. Sub-routes differ — `/sales/returns` follows `returns` and the online orders list follows `storefront` — which is why the gate is read per path rather than per section.
 *
 * Navigation hid these already; the URL did not. Typing the path, following an
 * old bookmark or clicking a stale link landed on a screen whose every request
 * 403s — and an empty table reads as *"you have none of these"* rather than
 * *"this is not part of your plan"*. The data was never at risk: `requireFeature`
 * on the backend refuses the writes regardless. This is about the lie the empty
 * screen tells.
 *
 * The guard reads the requirement out of `constants/navItem.ts`, the same table
 * the sidebar filters on, so a route cannot be gated in the menu and left open
 * on the page. It checks permission first, then feature — someone whose ROLE
 * blocks them must not be shown an upsell that would not let them in.
 */
export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteAccessGuard>{children}</RouteAccessGuard>;
}
