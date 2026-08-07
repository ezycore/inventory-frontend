import { describe, expect, it } from "vitest";
import { shippingRange, computeShipping } from "./storefront-shipping";
import type { StorefrontStore } from "@/lib/storefront-client";

type ShippingStore = Pick<StorefrontStore, "shippingRule" | "shippingZones">;

const store = (s: Partial<ShippingStore>): ShippingStore => ({
  shippingRule: { mode: "none" },
  ...s,
});

/**
 * `shippingRange` exists because the delivery zone is unknown before checkout.
 * The bug it fixes: `computeShipping` defaults to `"inside"`, so a zone-priced
 * store quoted the Dhaka fee on the cart and charged the outside one at
 * checkout — the shopper's money, understated, at the exact moment unexpected
 * delivery cost drives them away.
 */
describe("shippingRange", () => {
  it("is exact (not estimated) for a flat rule — zone is irrelevant", () => {
    const r = shippingRange(store({ shippingRule: { mode: "flat", flatFee: 50 } }), 500);
    expect(r).toEqual({ min: 50, max: 50, estimated: false });
  });

  it("is exact for free-over-threshold, because the subtotal is already known", () => {
    const s = store({
      shippingRule: { mode: "free_over_threshold", flatFee: 60, freeThreshold: 1000 },
    });
    expect(shippingRange(s, 500)).toEqual({ min: 60, max: 60, estimated: false });
    expect(shippingRange(s, 1500)).toEqual({ min: 0, max: 0, estimated: false });
  });

  it("is exact for a store that charges no shipping", () => {
    expect(shippingRange(store({}), 500)).toEqual({ min: 0, max: 0, estimated: false });
  });

  // The case the whole helper exists for.
  it("is a RANGE when the two Dhaka zones differ, and quotes the cheaper one", () => {
    const r = shippingRange(
      store({ shippingZones: { inside: 60, outside: 120 } }),
      500,
    );
    expect(r).toEqual({ min: 60, max: 120, estimated: true });
    // The old behaviour — what the cart used to show as if it were final.
    expect(computeShipping(store({ shippingZones: { inside: 60, outside: 120 } }), 500)).toBe(60);
  });

  it("collapses to exact once the zone free-threshold is met", () => {
    const s = store({ shippingZones: { inside: 60, outside: 120, freeThreshold: 1000 } });
    expect(shippingRange(s, 1500)).toEqual({ min: 0, max: 0, estimated: false });
    expect(shippingRange(s, 900).estimated).toBe(true);
  });

  it("collapses to exact when both zones are priced the same", () => {
    const r = shippingRange(store({ shippingZones: { inside: 80, outside: 80 } }), 500);
    expect(r).toEqual({ min: 80, max: 80, estimated: false });
  });

  /**
   * A half-configured store: only `inside` has a fee, so `outside` falls through
   * to the shipping rule. The range must reflect that fall-through, not treat the
   * unset direction as free.
   */
  it("handles a half-configured zone by falling through to the rule", () => {
    const r = shippingRange(
      store({
        shippingRule: { mode: "flat", flatFee: 200 },
        shippingZones: { inside: 60 },
      }),
      500,
    );
    expect(r).toEqual({ min: 60, max: 200, estimated: true });
  });

  it("charges nothing on an empty cart", () => {
    expect(shippingRange(store({ shippingZones: { inside: 60, outside: 120 } }), 0)).toEqual({
      min: 0,
      max: 0,
      estimated: false,
    });
  });

  it("survives a missing store (SSR before the payload lands)", () => {
    expect(shippingRange(undefined, 500)).toEqual({ min: 0, max: 0, estimated: false });
  });
});
