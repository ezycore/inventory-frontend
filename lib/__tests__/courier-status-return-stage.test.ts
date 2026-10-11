// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { courierDoorBadge, courierStatusPresentation } from "@/lib/courier-status";

// G15 (inventory-backend/docs/features/business-modes.md): a refused parcel travelling back read
// "In transit" beside an order already reading Returned, and the shopper saw "On the way".
describe("courierStatusPresentation — the return leg", () => {
  it("says the parcel is coming back, whatever the normalized status", () => {
    const p = courierStatusPresentation("in_transit", "returning");
    expect(p.admin).toBe("Returning to you");
    expect(p.shopper.en).toBe("Returning to sender");
  });

  it("says the parcel is back once the courier hands it over", () => {
    expect(courierStatusPresentation("returned", "back").admin).toBe("Back with you");
  });

  it("keeps the delivery-leg label when there is no return stage", () => {
    expect(courierStatusPresentation("in_transit").admin).toBe("In transit");
    expect(courierStatusPresentation("in_transit", null).shopper.en).toBe("On the way");
  });
});

describe("courierDoorBadge", () => {
  it("a paid return never reads Delivered (live: ORD-20261004-00014, Steadfast partial_delivered)", () => {
    expect(courierDoorBadge({ paidReturn: true }, "shipped")?.admin).toBe("Paid return · coming back");
    expect(courierDoorBadge({ paidReturn: true }, "returned")?.admin).toBe("Paid return · back with you");
  });

  it("a part-delivery says so; anything else falls through to the courier status", () => {
    expect(courierDoorBadge({ partialDelivery: true }, "delivered")?.admin).toBe("Part delivered");
    expect(courierDoorBadge({}, "delivered")).toBeNull();
    expect(courierDoorBadge(undefined, "delivered")).toBeNull();
  });
});
