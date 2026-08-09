// coding-standard: maintained
/**
 * `formatPermission` turns a catalogue key into the label shown beside a
 * checkbox in the role builder and in the role details drawer.
 *
 * The regression it guards: reading only the segment after the first dot
 * rendered `storefront.orders.view` and `storefront.orders.manage` both as
 * "Orders" — two identical checkboxes, side by side, for two different grants.
 * Found in a live pass over the builder, not by a test, which is why there is
 * one now.
 */
import { describe, expect, it } from "vitest";

import { formatPermission, getActionStyle, groupPermissions } from "./permission-display";

describe("formatPermission", () => {
  it("labels a two-part key with its action", () => {
    expect(formatPermission("products.view")).toBe("View");
    expect(formatPermission("stock.manage")).toBe("Manage");
    expect(formatPermission("transactions.capital")).toBe("Capital");
  });

  it("keeps three-part keys distinguishable", () => {
    expect(formatPermission("storefront.orders.view")).toBe("Orders · View");
    expect(formatPermission("storefront.orders.manage")).toBe("Orders · Manage");
    expect(formatPermission("storefront.orders.view")).not.toBe(
      formatPermission("storefront.orders.manage"),
    );
  });

  it("renders underscores as spaces", () => {
    expect(formatPermission("reports.stock_valuation")).toBe("Stock valuation");
  });

  it("falls back to the whole key when there is no dot", () => {
    expect(formatPermission("standalone")).toBe("standalone");
  });

  it("still resolves the action icon on a three-part key", () => {
    // `getActionStyle` matches substrings, so the verb is found wherever it
    // sits — losing this would give every storefront order permission the
    // neutral fallback icon.
    expect(getActionStyle(formatPermission("storefront.orders.view")).icon).toBe(
      getActionStyle(formatPermission("products.view")).icon,
    );
  });
});

describe("groupPermissions", () => {
  it("buckets by the first segment, so three-part keys stay in their module", () => {
    const groups = groupPermissions([
      "products.view",
      "storefront.view",
      "storefront.orders.view",
      "storefront.orders.manage",
    ]);

    expect(Object.keys(groups)).toEqual(["products", "storefront"]);
    expect(groups.storefront).toHaveLength(3);
  });
});
