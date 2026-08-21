import { describe, expect, it } from "vitest";
import { deliveryEstimateForZone, deliveryEstimateSummary, effectiveFreeShippingThreshold } from "./storefront-delivery";

describe("storefront delivery copy", () => {
  it("uses the zoned threshold when it overrides the general rule", () => {
    expect(effectiveFreeShippingThreshold({ shippingRule: { mode: "free_over_threshold", freeThreshold: 1000 }, shippingZones: { freeThreshold: 2000 } })).toBe(2000);
  });
  it("falls back to the active general threshold", () => {
    expect(effectiveFreeShippingThreshold({ shippingRule: { mode: "free_over_threshold", freeThreshold: 1000 } })).toBe(1000);
    expect(effectiveFreeShippingThreshold({ shippingRule: { mode: "flat" } })).toBeUndefined();
  });
  it("shows both estimates before zone selection and one after", () => {
    const store = { deliveryEstimates: { insideDhaka: "1–2 days", outsideDhaka: "3–5 days" } };
    expect(deliveryEstimateSummary(store, { insideDhaka: "Inside", outsideDhaka: "Outside", fallback: "At checkout" })).toBe("Inside: 1–2 days · Outside: 3–5 days");
    expect(deliveryEstimateForZone(store, "outside")).toBe("3–5 days");
  });
  it("uses neutral copy when no estimate exists", () => {
    expect(deliveryEstimateSummary(undefined, { insideDhaka: "Inside", outsideDhaka: "Outside", fallback: "At checkout" })).toBe("At checkout");
  });
});
