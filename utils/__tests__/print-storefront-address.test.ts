// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { joinAddress } from "../print-storefront-order";

describe("joinAddress (printed order address)", () => {
  it("prints the district — it was left out (shadow test S11)", () => {
    expect(joinAddress("House 31, Road 46", undefined, "Thakurgaon")).toBe("House 31, Road 46, Thakurgaon");
  });

  it("street, area and district, in that order", () => {
    expect(joinAddress("House 6, Road 9", "Mirpur 12", "Dhaka")).toBe("House 6, Road 9, Mirpur 12, Dhaka");
  });

  it("does not repeat a part already written in the line", () => {
    expect(joinAddress("House 6, Road 9, Banani", "Banani", "Dhaka")).toBe("House 6, Road 9, Banani, Dhaka");
    expect(joinAddress("Nasirabad, Chattogram", undefined, "chattogram")).toBe("Nasirabad, Chattogram");
  });

  it("a pickup order with no address prints nothing", () => {
    expect(joinAddress(undefined, undefined, undefined)).toBe("");
  });
});
