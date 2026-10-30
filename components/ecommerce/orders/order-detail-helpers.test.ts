// coding-standard: maintained
import { describe, expect, it } from "vitest";

import {
  actorLabel,
  awaitsCourierReport,
  collectionLabels,
  holdsReservedStock,
} from "./order-detail-helpers";
import { testTranslator } from "@/tests/test-utils";

const t = testTranslator("ecommerce");

describe("actorLabel", () => {
  // G14 (inventory-backend/docs/features/business-modes.md): a courier's update read "Staff".
  it("credits the courier, not a member of staff, with a courier's update", () => {
    expect(actorLabel("courier", t)).toBe("Courier");
  });

  it("names the shopper and the system, and treats a user id as staff", () => {
    expect(actorLabel("shopper", t)).toBe("Customer");
    expect(actorLabel("system", t)).toBe("System");
    expect(actorLabel("6a95bf6fa0ef017fa9ace4cd", t)).toBe("Staff");
    expect(actorLabel(undefined, t)).toBe("—");
  });
});

describe("collectionLabels", () => {
  // The old "Mark COD collected" read as "the money is in my hand"; on a courier parcel the
  // courier has it until a payout.
  it("names the courier on a courier parcel", () => {
    expect(collectionLabels({ courier: { provider: "pathao" } }, "৳570", t)).toEqual({
      full: "Courier collected ৳570",
      less: "Courier collected less…",
    });
  });

  it("names the customer at a pickup counter", () => {
    expect(
      collectionLabels({ fulfillmentType: "pickup", paymentMethod: "cod" }, "৳570", t).full,
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

describe("holdsReservedStock", () => {
  it("only a confirmed order on a stock-tracked workspace holds stock", () => {
    expect(holdsReservedStock({ stockReserved: true }, true)).toBe(true);
  });

  it("a new order holds none — stock is reserved at confirm", () => {
    expect(holdsReservedStock({ stockReserved: false }, true)).toBe(false);
  });

  it("a stock-free workspace holds none, though confirm marks it reserved (QA-N13)", () => {
    expect(holdsReservedStock({ stockReserved: true }, false)).toBe(false);
  });
});
