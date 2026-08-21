// coding-standard: maintained

interface ShippingSettings {
  shippingRule?: {
    mode: "flat" | "free_over_threshold" | "none";
    freeThreshold?: number;
  };
  shippingZones?: { freeThreshold?: number } | null;
  deliveryEstimates?: { insideDhaka?: string; outsideDhaka?: string };
}

/** Zoned shipping wins at checkout, so its offer must also win in marketing copy. */
export function effectiveFreeShippingThreshold(
  store?: Pick<ShippingSettings, "shippingRule" | "shippingZones">,
): number | undefined {
  const zoned = store?.shippingZones?.freeThreshold;
  if (zoned != null) return zoned;
  return store?.shippingRule?.mode === "free_over_threshold"
    ? store.shippingRule.freeThreshold
    : undefined;
}

/** Delivery copy before a shopper has selected a zone. */
export function deliveryEstimateSummary(
  store: Pick<ShippingSettings, "deliveryEstimates"> | undefined,
  labels: { insideDhaka: string; outsideDhaka: string; fallback: string },
): string {
  const inside = store?.deliveryEstimates?.insideDhaka?.trim();
  const outside = store?.deliveryEstimates?.outsideDhaka?.trim();
  if (inside && outside) {
    return `${labels.insideDhaka}: ${inside} · ${labels.outsideDhaka}: ${outside}`;
  }
  return inside || outside || labels.fallback;
}

/** Delivery copy after checkout has derived the shopper's zone. */
export function deliveryEstimateForZone(
  store: Pick<ShippingSettings, "deliveryEstimates"> | undefined,
  zone: "inside" | "outside",
): string | undefined {
  const value =
    zone === "inside"
      ? store?.deliveryEstimates?.insideDhaka
      : store?.deliveryEstimates?.outsideDhaka;
  return value?.trim() || undefined;
}
