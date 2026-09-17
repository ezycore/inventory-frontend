import { describe, expect, it } from "vitest";
import { navGroups } from "../navItem";
import { filterNavItems, flattenNavItems, permissionsForPath } from "@/lib/nav-utils";
import { NavItem } from "@/types/layout";
import { DEFAULT_ORGANIZATION_FEATURES, OrganizationFeatures } from "@/types";

/**
 * Exercises the real sidebar config — not synthetic items — against the shapes
 * onboarding can produce. These are the combinations a merchant actually ends
 * up in, so a regression here is a regression a customer would see.
 */

/**
 * Every permission the nav table asks for — **derived, never listed by hand.**
 *
 * These tests are about feature gating, so they run as someone who holds every
 * permission; the permission axis is covered by `nav-utils.test.ts`. This was a
 * hardcoded array of nine strings, which was fine while only the storefront and
 * tax entries declared `permissions`. When the other 47 entries gained theirs on
 * 2026-08-17 the fixture silently became a *partial* grant, so eight tests
 * started failing on rows the merchant can see perfectly well — New Sale,
 * Current Stock, Customers, Locations. The list was wrong, not the nav.
 *
 * Deriving it means adding a nav entry can never break this file again.
 */
const collectPermissions = (items: NavItem[], into: Set<string>): Set<string> => {
  for (const item of items) {
    item.permissions?.forEach((permission) => into.add(permission));
    if (item.items?.length) collectPermissions(item.items, into);
  }
  return into;
};

const ALL_PERMISSIONS = [
  ...navGroups.reduce(
    (acc, group) => collectPermissions(group.items, acc),
    new Set<string>(),
  ),
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
      "Pages",
      "Abandoned Carts",
      "Meta Ad Reporting",
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

/**
 * The union rule, enforced rather than documented.
 *
 * `filterNavItems` tests a parent BEFORE recursing into its children, so a
 * parent gated more narrowly than a child hides that child outright — the child
 * never gets asked. `Reports` (`reports.view`) did exactly this to `Expiry
 * Report` (`stock.view`), which is the one report deliberately written for the
 * shop floor: `staff` holds `stock.view`, holds no `reports.view`, and so lost
 * the whole Reports section including the screen the exception exists for.
 *
 * A parent is allowed to declare MORE than its children (a container may be
 * admin-only on purpose). It may never declare less.
 */
describe("navGroups — a parent never gates out its own children", () => {
  const offenders: string[] = [];

  const walk = (items: NavItem[], trail: string[]) => {
    for (const item of items) {
      if (!item.items?.length) continue;
      const parentPerms = item.permissions ?? [];
      if (parentPerms.length > 0) {
        for (const child of item.items) {
          const childPerms = child.permissions ?? [];
          // An ungated child under a gated parent inherits the parent's gate,
          // which is intentional. Only a child asking for something the parent
          // does not offer is unreachable.
          if (childPerms.length === 0) continue;
          const unreachable = childPerms.every((p) => !parentPerms.includes(p));
          if (unreachable) {
            offenders.push(
              `${[...trail, item.title].join(" › ")} [${parentPerms.join(", ")}] ` +
                `hides "${child.title}" [${childPerms.join(", ")}]`,
            );
          }
        }
      }
      walk(item.items, [...trail, item.title]);
    }
  };
  for (const group of navGroups) walk(group.items, [group.label || "(root)"]);

  it("every gated parent admits every gated child", () => {
    expect(
      offenders,
      `these parents are narrower than a child, so the child is unreachable:\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });
});

/**
 * Report gates, against the rule the file states about itself.
 *
 * `navItem.ts` opens with an explicit rule: `sales` is the POS **counter**, not
 * the sales ledger, so anything that READS the ledger gates on `anyFeatures`.
 * Sales History followed it; Sales Report did not, and an online seller with
 * real online sales opened `/reports/sales` to "Sales Management is switched
 * off" (QA-L1). Staff Report had no gate at all, so the mirror-image bug showed
 * it to the same merchant where it means almost nothing (QA-C4).
 */
describe("report gates follow the ledger rule, not the counter", () => {
  const storefrontOnly = withFeatures({
    sales: false,
    purchases: false,
    inventoryTracking: false,
    storefront: true,
  });

  it("keeps Sales Report for a storefront-only merchant", () => {
    // The workspace that found this had booked real online sales. A report over
    // them cannot be gated on the counter that did not ring them up.
    expect(childrenOf(storefrontOnly, "Reports")).toContain("Sales Report");
  });

  it("keeps Sales Report for a counter-only merchant", () => {
    const counterOnly = withFeatures({ sales: true, storefront: false });
    expect(childrenOf(counterOnly, "Reports")).toContain("Sales Report");
  });

  it("drops Sales Report only when neither channel exists", () => {
    const neither = withFeatures({ sales: false, storefront: false });
    expect(childrenOf(neither, "Reports")).not.toContain("Sales Report");
  });

  it("hides Staff Report where staff do not originate the sale", () => {
    // Online orders originate with the shopper; staff only confirm, ship and
    // collect. Attributing revenue to an employee there credits whoever pressed
    // Confirm, beside a purchase column that can never fill.
    expect(childrenOf(storefrontOnly, "Reports")).not.toContain("Staff Report");
  });

  it("keeps Staff Report for a POS-less wholesaler", () => {
    // Any-of, not `sales`: staff raising purchase orders are still staff.
    const wholesaler = withFeatures({ sales: false, purchases: true });
    expect(childrenOf(wholesaler, "Reports")).toContain("Staff Report");
  });

  it("keeps Sales History and Sales Report agreeing with each other", () => {
    // These two read the same ledger. Any feature set that shows one must show
    // the other, or the merchant can list a sale they cannot report on.
    for (const features of [
      storefrontOnly,
      withFeatures({ sales: true, storefront: false }),
      withFeatures({ sales: false, storefront: false }),
      withFeatures({ sales: true, storefront: true }),
    ]) {
      const titles = visibleTitles(features);
      expect(titles.includes("Sales Report")).toBe(
        titles.includes("Sales History"),
      );
    }
  });
});

/**
 * The permission axis for three entries whose gate disagreed with the API
 * behind them (2026-09-17). `RouteAccessGuard` reads the same table, so a wrong
 * entry here was not just a missing row — it was a "no permission" screen on a
 * page the backend would have served.
 */
describe("navGroups — gates that follow the API", () => {
  const visibleFor = (permissions: string[]) =>
    flattenNavItems(
      navGroups.flatMap((group) =>
        filterNavItems(group.items, "custom", permissions, BOTH),
      ),
    ).map((item) => item.title);

  it("shows Roles to a manager, who holds roles.view and not users.manage", () => {
    expect(visibleFor(["roles.view"])).toContain("Roles");
    expect(permissionsForPath("/settings/roles")).toEqual(
      expect.arrayContaining(["roles.view", "users.manage"]),
    );
  });

  it("still shows Roles to users.manage alone — placing people needs the list", () => {
    expect(visibleFor(["users.manage"])).toContain("Roles");
  });

  it("hides Roles from a role with neither", () => {
    expect(visibleFor(["users.view"])).not.toContain("Roles");
  });

  it("gates Customize and Themes on storefront.design, which the Site API checks", () => {
    const designer = visibleFor(["storefront.view", "storefront.design"]);
    expect(designer).toEqual(expect.arrayContaining(["Customize", "Themes"]));

    const settingsOnly = visibleFor(["storefront.view", "storefront.manage"]);
    expect(settingsOnly).not.toContain("Customize");
    expect(settingsOnly).not.toContain("Themes");
    // …and keeps the settings-side screens that `manage` is for.
    expect(settingsOnly).toEqual(expect.arrayContaining(["Coupons", "Campaigns"]));
  });
});
