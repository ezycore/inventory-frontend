// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { actorLabel, awaitsCourierReport, collectionLabels } from "./order-detail-helpers";

describe("actorLabel", () => {
  // G14 (inventory-backend/docs/features/business-modes.md): a courier's update read "Staff".
  it("credits the courier, not a member of staff, with a courier's update", () => {
    expect(actorLabel("courier")).toBe("Courier");
  });

  it("names the shopper and the system, and treats a user id as staff", () => {
    expect(actorLabel("shopper")).toBe("Customer");
    expect(actorLabel("system")).toBe("System");
    expect(actorLabel("6a95bf6fa0ef017fa9ace4cd")).toBe("Staff");
    expect(actorLabel(undefined)).toBe("—");
  });
});

describe("collectionLabels", () => {
  // The old "Mark COD collected" read as "the money is in my hand"; on a courier parcel the
  // courier has it until a payout.
  it("names the courier on a courier parcel", () => {
    expect(collectionLabels({ courier: { provider: "pathao" } }, "৳570")).toEqual({
      full: "Courier collected ৳570",
      less: "Courier collected less…",
    });
  });

  it("names the customer at a pickup counter", () => {
    expect(
      collectionLabels({ fulfillmentType: "pickup", paymentMethod: "cod" }, "৳570").full,
    ).toBe("Customer paid ৳570");
  });
});

describe("awaitsCourierReport", () => {
  it("waits for a connected courier to report a shipped parcel", () => {
    expect(awaitsCourierReport({ status: "shipped", courier: { integration: "api" } })).toBe(true);
  });

  it("does not wait once delivered, or for a courier the merchant tracks by hand", () => {
    expect(awaitsCourierReport({ status: "delivered", courier: { integration: "api" } })).toBe(false);
    expect(awaitsCourierReport({ status: "shipped", courier: { integration: "manual" } })).toBe(false);
  });
});

