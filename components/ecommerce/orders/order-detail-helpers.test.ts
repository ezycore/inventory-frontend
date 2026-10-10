// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { actorLabel } from "./order-detail-helpers";

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
