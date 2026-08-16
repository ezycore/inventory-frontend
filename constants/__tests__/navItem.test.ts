import { describe, expect, it } from "vitest";
import { navGroups } from "../navItem";
import { filterNavItems, flattenNavItems } from "@/lib/nav-utils";
import { DEFAULT_ORGANIZATION_FEATURES, OrganizationFeatures } from "@/types";

/**
 * Exercises the real sidebar config — not synthetic items — against the shapes
 * onboarding can produce. These are the combinations a merchant actually ends
 * up in, so a regression here is a regression a customer would see.
 */

const ALL_PERMISSIONS = [
  "storefront.view",
  "storefront.orders.view",
  "storefront.manage",
  "taxes.view",
  "organization.view",
  "organization.edit",
  "organization.manage",
  "users.view",
  "users.manage",
];

const withFeatures = (
  overrides: Partial<OrganizationFeatures>
): OrganizationFeatures => ({ ...DEFAULT_ORGANIZATION_FEATURES, ...overrides });

/** navGroups as AppSidebar renders them: filtered, empty groups dropped. */
function visibleGroups(features: OrganizationFeatures) {
  return navGroups
    .map((group) => ({
      ...group,
      items: filterNavItems(group.items, "admin", ALL_PERMISSIONS, features),
    }))
    .filter((group) => group.items.length > 0);
}

/** Every visible nav title for a given feature set, flattened. */
function visibleTitles(features: OrganizationFeatures): string[] {
  return flattenNavItems(visibleGroups(features).flatMap((g) => g.items)).map(
    (i) => i.title
  );
}

/** Titles of the top-level (always-visible) rows, across every group. */
function topLevelTitles(features: OrganizationFeatures): string[] {
  return visibleGroups(features)
    .flatMap((g) => g.items)
    .map((item) => item.title);
}

/** Child titles of a top-level nav item, wherever it sits. */
function childrenOf(features: OrganizationFeatures, title: string): string[] {
  const parent = visibleGroups(features)
    .flatMap((g) => g.items)
    .find((item) => item.title === title);
  return (parent?.items ?? []).map((child) => child.title);
}

/** The group a top-level item belongs to. */
function groupOf(features: OrganizationFeatures, title: string) {
  return visibleGroups(features).find((group) =>
    group.items.some((item) => item.title === title)
  );
}

const SHOP_ONLY = withFeatures({ sales: true, storefront: false });
const ONLINE_ONLY = withFeatures({ sales: false, storefront: true });
const BOTH = withFeatures({ sales: true, storefront: true });

describe("navGroups — shop-only merchant", () => {
  it("shows the POS and hides the whole Online Store group", () => {
    const titles = visibleTitles(SHOP_ONLY);

    expect(titles).toContain("New Sale");
    expect(titles).toContain("Sales History");
    expect(titles).not.toContain("Online Store");
    expect(titles).not.toContain("Store Overview");
  });

  it("hides Online Orders, which now lives under Sales", () => {
    // Moving it into Sales must not leak the online channel into a shop that
    // has none — the entry keeps its own `storefront` gate.
    expect(childrenOf(SHOP_ONLY, "Sales")).not.toContain("Online Orders");
  });
});

describe("navGroups — online-only merchant", () => {
  it("keeps the Sales group even though the POS is off", () => {
    // The regression this guards: `sales: false` used to hide the Sales parent
    // and its history, but committing a storefront order writes a Sale — so an
    // online seller would have lost sight of their own revenue.
    const titles = visibleTitles(ONLINE_ONLY);

    expect(titles).toContain("Sales");
    expect(titles).toContain("Sales History");
  });

  it("hides the POS screen itself", () => {
    expect(visibleTitles(ONLINE_ONLY)).not.toContain("New Sale");
  });

  it("keeps Sales Returns, which returns online orders too", () => {
    expect(visibleTitles(ONLINE_ONLY)).toContain("Sales Returns");
  });

  it("drops Sales Returns when returns are off, keeping the rest", () => {
    const titles = visibleTitles(
      withFeatures({ sales: false, storefront: true, returns: false })
    );

    expect(titles).not.toContain("Sales Returns");
    expect(titles).toContain("Sales History");
  });

  it("still shows Online Store", () => {
    expect(visibleTitles(ONLINE_ONLY)).toContain("Online Store");
    expect(visibleTitles(ONLINE_ONLY)).toContain("Store Overview");
  });

  it("lists Online Orders under Sales, not under Online Store", () => {
    // Online orders are sales: they belong with the ledger the merchant reads,
    // while Online Store keeps only the channel's own screens.
    expect(childrenOf(ONLINE_ONLY, "Sales")).toContain("Online Orders");
    expect(childrenOf(ONLINE_ONLY, "Online Store")).not.toContain(
      "Online Orders"
    );
  });
});

describe("navGroups — Online Store as its own group", () => {
  it("sits in its own headed group, not in Sell", () => {
    expect(groupOf(BOTH, "Online Store")?.label).toBe("Store");
    expect(groupOf(BOTH, "Sales")?.label).toBe("Sell");
  });

  it("keeps every group label unique — AppSidebar keys groups by label", () => {
    // Two groups sharing a label (both "" while this group was unlabelled) gave
    // React duplicate keys, which reconciles into stale/duplicated rows in dev.
    for (const features of [SHOP_ONLY, ONLINE_ONLY, BOTH]) {
      const labels = visibleGroups(features).map((g) => g.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it("leaves exactly one Dashboard row in the rail", () => {
    for (const features of [SHOP_ONLY, ONLINE_ONLY, BOTH]) {
      const dashboards = visibleTitles(features).filter(
        (t) => t === "Dashboard"
      );
      expect(dashboards).toHaveLength(1);
    }
  });

  it("costs the rail exactly one always-visible row", () => {
    // The regression this guards: listing the eight storefront screens flat
    // pushed Buy and Stock below the fold, so Products needed a scroll.
    const group = groupOf(BOTH, "Online Store");

    expect(group?.items).toHaveLength(1);
    expect(childrenOf(BOTH, "Online Store").length).toBeGreaterThan(1);
  });

  it("keeps every storefront screen reachable under that one row", () => {
    expect(childrenOf(BOTH, "Online Store")).toEqual([
      "Store Overview",
      "Collections",
      "Campaigns",
      "Coupons",
      // Themes sits directly above Customize on purpose: a merchant picks a
      // whole look first and only then adjusts its parts, and the two pages
      // hand off to each other (Apply routes into Customize with the theme
      // staged as an unsaved edit).
      "Themes",
      "Customize",
      "Content",
      "Abandoned Carts",
      "Store Settings",
    ]);
  });

  it("takes the whole Store group away from a shop-only merchant", () => {
    expect(topLevelTitles(SHOP_ONLY)).not.toContain("Online Store");
    expect(visibleGroups(SHOP_ONLY).map((g) => g.label)).not.toContain("Store");
  });
});

describe("navGroups — a merchant with neither channel", () => {
  it("drops the Sales group entirely", () => {
    // Not reachable through onboarding (the first question always sets at least
    // one), but the filter must not leave a dead parent behind if it happens.
    const titles = visibleTitles(
      withFeatures({ sales: false, storefront: false })
    );

    expect(titles).not.toContain("Sales");
    expect(titles).not.toContain("Sales History");
  });
});

describe("navGroups — multiLocation", () => {
  const SINGLE = withFeatures({ multiLocation: false });

  it("keeps the Locations list, which holds the shop address", () => {
    // The single signup-created location carries the org's own address. Hiding
    // it would leave that address with no edit path anywhere in the product.
    expect(visibleTitles(SINGLE)).toContain("Locations");
  });

  it("hides the entries that need a second location", () => {
    const titles = visibleTitles(SINGLE);

    expect(titles).not.toContain("Transfer Stock");
    expect(titles).not.toContain("Stock by Location");
  });

  it("restores them when the feature is on", () => {
    const titles = visibleTitles(BOTH);

    expect(titles).toContain("Transfer Stock");
    expect(titles).toContain("Stock by Location");
  });

  it("keeps the rest of Inventory intact", () => {
    const titles = visibleTitles(SINGLE);

    expect(titles).toContain("Current Stock");
    expect(titles).toContain("Low Stock");
    expect(titles).toContain("Stock History");
  });
});

describe("navGroups — merged destinations", () => {
  it("no longer lists Catalog, which is now a tab on Products", () => {
    expect(visibleTitles(BOTH)).not.toContain("Catalog");
  });

  it("keeps Collections under Online Store", () => {
    // Storefront-only taxonomy with no Products equivalent, so it did not move.
    expect(visibleTitles(BOTH)).toContain("Collections");
  });

  it("no longer lists Storefront Accounts, now a tab on Customers", () => {
    expect(visibleTitles(BOTH)).not.toContain("Storefront Accounts");
  });

  it("no longer buries Feature Settings under Settings", () => {
    // It moved to the sidebar footer as "Customize workspace": it is the way
    // back from every hidden feature, so it must not itself be hidden.
    const titles = visibleTitles(BOTH);
    expect(titles).not.toContain("Feature Settings");
    expect(titles).not.toContain("Customize workspace");
  });

  it("keeps exactly one Customers entry for every business shape", () => {
    for (const features of [SHOP_ONLY, ONLINE_ONLY, BOTH]) {
      const customers = visibleTitles(features).filter((t) => t === "Customers");
      expect(customers).toHaveLength(1);
    }
  });
});

describe("navGroups — other feature gates still hold", () => {
  it("hides VAT surfaces when tax is off", () => {
    const titles = visibleTitles(withFeatures({ tax: false }));

    expect(titles).not.toContain("VAT Rates");
    expect(titles).not.toContain("VAT Report");
  });

  it("hides Cash & Bank when accounts is off", () => {
    const titles = visibleTitles(withFeatures({ accounts: false }));

    // A real-URL parent (/accounts) whose children are all gated — the case the
    // old empty-parent rule left behind as a dead row.
    expect(titles).not.toContain("Cash & Bank");
    expect(titles).not.toContain("Transactions");
  });

  it("hides the expiry report when expiry tracking is off", () => {
    expect(visibleTitles(withFeatures({ expiryTracking: false }))).not.toContain(
      "Expiry Report"
    );
  });
});
