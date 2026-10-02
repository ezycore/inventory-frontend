// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { POS_PATH } from "@/constants/pos";
import { featuresForPath, permissionsForPath } from "@/lib/nav-utils";

/**
 * The POS counter must be gated exactly like New Sale: it posts the same sale.
 * `RouteAccessGuard` reads these off the nav table by URL, so a typo in the
 * nav row would open the counter to a role that may not sell.
 */
describe("POS counter route gates", () => {
  it("needs sales.create, like New Sale", () => {
    expect(permissionsForPath(POS_PATH)).toEqual(["sales.create"]);
  });

  it("needs the POS (`sales`) feature", () => {
    expect(featuresForPath(POS_PATH)?.all).toContain("sales");
  });
});
