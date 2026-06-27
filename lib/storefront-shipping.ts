import type { StorefrontStore } from "@/lib/storefront-client";

/** Delivery zone (Dhaka-first, per the design). Captured at checkout. */
export type Zone = "inside" | "outside";

/** Whether the store charges by Dhaka zone (inside/outside) rather than a flat rule. */
export function hasZoneShipping(
  store: Pick<StorefrontStore, "shippingZones"> | null | undefined,
): boolean {
  const z = store?.shippingZones;
  return !!z && (z.inside != null || z.outside != null);
}

/**
 * Shipping fee for a subtotal. When the store has Dhaka zone rates configured,
 * the fee comes from the selected zone (free over the optional threshold);
 * otherwise it falls back to the merchant's flat/free-over `shippingRule`.
 * Mirrors the backend `computeShipping` so the preview matches what's charged.
 */
export function computeShipping(
  store: Pick<StorefrontStore, "shippingRule" | "shippingZones"> | null | undefined,
  subtotal: number,
  zone: Zone = "inside",
): number {
  if (!store || subtotal <= 0) return 0;
  const z = store.shippingZones;
  if (z && (z.inside != null || z.outside != null)) {
    if (z.freeThreshold && subtotal >= z.freeThreshold) return 0;
    return (zone === "outside" ? z.outside : z.inside) || 0;
  }
  const rule = store.shippingRule;
  if (!rule) return 0;
  if (rule.mode === "flat") return rule.flatFee || 0;
  if (rule.mode === "free_over_threshold") {
    return subtotal >= (rule.freeThreshold || 0) ? 0 : rule.flatFee || 0;
  }
  return 0;
}
