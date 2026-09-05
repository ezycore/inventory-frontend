import { RouteAccessGuard } from "@/components/shared/route-access-guard";

/**
 * Feature gate for the suppliers section (purchases).
 *
 * A supplier exists to be bought from. Without purchasing there is nothing to record against one.
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
export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteAccessGuard>{children}</RouteAccessGuard>;
}
