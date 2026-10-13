// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { AdminStorefrontOrder } from "@/services/api";
import { canHandOver, courierBookingCancelled } from "./order-hand-over-dialog";

/**
 * Who may be handed over in person (shadow test S4). Mirrors the backend
 * `storefrontOrderHandoverService`: offering the button where the API refuses is a
 * dialog that fails after the merchant has typed the reason.
 */
const order = (patch: Record<string, unknown>) =>
  ({ _id: "o1", fulfillmentType: "delivery", status: "processing", ...patch }) as unknown as AdminStorefrontOrder;

describe("handed over in person — who is offered it", () => {
  it("a confirmed or processing delivery order with no courier booked", () => {
    expect(canHandOver(order({ status: "confirmed" }))).toBe(true);
    expect(canHandOver(order({ status: "processing" }))).toBe(true);
  });

  it("not once a courier has the booking", () => {
    expect(canHandOver(order({ courier: { consignmentId: "C1" } }))).toBe(false);
    expect(
      canHandOver(order({ status: "shipped", courier: { consignmentId: "C1", normalizedStatus: "in_transit" } })),
    ).toBe(false);
  });

  it("a shipped order whose courier cancelled the booking", () => {
    const cancelled = order({
      status: "shipped",
      courier: { consignmentId: "C1", normalizedStatus: "cancelled", integration: "api" },
    });
    expect(canHandOver(cancelled)).toBe(true);
    expect(courierBookingCancelled(cancelled), "so plain Mark as Delivered is hidden").toBe(true);
  });

  it("never a pickup order, nor one already delivered", () => {
    expect(canHandOver(order({ fulfillmentType: "pickup", status: "confirmed" }))).toBe(false);
    expect(canHandOver(order({ status: "delivered" }))).toBe(false);
    expect(canHandOver(order({ status: "pending" }))).toBe(false);
  });
});
