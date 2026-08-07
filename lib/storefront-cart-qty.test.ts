import { describe, expect, it } from "vitest";
import { CART_UNCAPPED, cartLineCap, resolveCartCap } from "./storefront-cart-qty";

/**
 * The one rule these tests exist for: **`0` and "no limit" must not be the same
 * number.** They were, and the consequence was a sold-out line arriving in the
 * cart uncapped — the shopper could raise it to any quantity, and only checkout
 * said no. Every assertion below is that distinction from one side or the other.
 */
describe("cartLineCap", () => {
  it("caps a normal line at its sellable stock", () => {
    expect(cartLineCap(5, false)).toBe(5);
  });

  it("gives a sold-out line a cap of zero, not 'unlimited'", () => {
    expect(cartLineCap(0, false)).toBe(0);
    expect(resolveCartCap(cartLineCap(0, false))).toBe(0);
  });

  it("marks a backorder line uncapped with a NEGATIVE value", () => {
    const cap = cartLineCap(0, true);
    expect(cap).toBe(CART_UNCAPPED);
    expect(cap).toBeLessThan(0);
    expect(resolveCartCap(cap)).toBe(Infinity);
  });

  it("keeps a backorder line uncapped even when stock is healthy", () => {
    // Backorder is a property of the product, not of today's stock level.
    expect(cartLineCap(12, true)).toBe(CART_UNCAPPED);
  });

  it("treats missing or negative stock as none left", () => {
    // A catalogue row can omit the count; an over-reserved one can go negative.
    expect(cartLineCap(undefined, false)).toBe(0);
    expect(cartLineCap(null, false)).toBe(0);
    expect(cartLineCap(-3, false)).toBe(0);
  });

  it("floors a fractional count rather than offering half a unit", () => {
    expect(cartLineCap(2.7, false)).toBe(2);
  });
});
