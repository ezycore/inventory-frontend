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

/** Every visible nav title for a given feature set, flattened. */
function visibleTitles(features: OrganizationFeatures): string[] {
  const groups = navGroups.map((group) => ({
    ...group,
    items: filterNavItems(group.items, "admin", ALL_PERMISSIONS, features),
  }));
  return flattenNavItems(groups.flatMap((g) => g.items)).map((i) => i.title);
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
    expect(titles).not.toContain("Online Orders");
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

  it("still shows the Online Store group", () => {
    expect(visibleTitles(ONLINE_ONLY)).toContain("Online Store");
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
