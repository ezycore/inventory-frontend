import { describe, expect, it } from "vitest";
import { filterNavItems, permissionsForPath } from "../nav-utils";
import { NavItem } from "@/types/layout";
import { DEFAULT_ORGANIZATION_FEATURES, OrganizationFeatures } from "@/types";

const ALL_ON = DEFAULT_ORGANIZATION_FEATURES;

/** The full feature set with the named keys forced off. */
const without = (...off: (keyof OrganizationFeatures)[]): OrganizationFeatures => ({
  ...ALL_ON,
  ...Object.fromEntries(off.map((k) => [k, false])),
});

const titles = (items: NavItem[]) => items.map((i) => i.title);

describe("filterNavItems", () => {
  it("keeps a leaf that declares an empty children list", () => {
    // Dashboard, Customers and Suppliers all ship `items: []` — that means
    // "leaf", not "parent whose children were removed".
    const items: NavItem[] = [{ title: "Dashboard", url: "/dashboard", items: [] }];

    expect(titles(filterNavItems(items, "admin", [], ALL_ON))).toEqual(["Dashboard"]);
  });

  it("keeps a parent that still has at least one visible child", () => {
    const items: NavItem[] = [
      {
        title: "Sales",
        url: "/sales",
        items: [
          { title: "New Sale", url: "/sales" },
          { title: "Sales Returns", url: "/sales/returns", features: ["returns"] },
        ],
      },
    ];

    const [sales] = filterNavItems(items, "admin", [], without("returns"));
    expect(sales.title).toBe("Sales");
    expect(titles(sales.items ?? [])).toEqual(["New Sale"]);
  });

  it("drops a '#' parent once every child is filtered away", () => {
    const items: NavItem[] = [
      {
        title: "Pricing",
        url: "#",
        items: [{ title: "VAT Rates", url: "/taxes", features: ["tax"] }],
      },
    ];

    expect(filterNavItems(items, "admin", [], without("tax"))).toEqual([]);
  });

  it("drops a real-URL parent once every child is filtered away", () => {
    // The regression this fix targets: the old rule only dropped emptied
    // parents whose url was "#", so "Cash & Bank" survived as a dead row.
    const items: NavItem[] = [
      {
        title: "Cash & Bank",
        url: "/accounts",
        items: [
          { title: "Accounts", url: "/accounts", features: ["accounts"] },
          {
            title: "Transactions",
            url: "/accounts/transactions",
            features: ["accounts"],
          },
        ],
      },
    ];

    expect(filterNavItems(items, "admin", [], without("accounts"))).toEqual([]);
  });

  it("drops a parent emptied by permissions, not just by features", () => {
    const items: NavItem[] = [
      {
        title: "Settings",
        url: "/settings",
        items: [
          {
            title: "Roles",
            url: "/settings/roles",
            permissions: ["users.manage"],
          },
        ],
      },
    ];

    expect(filterNavItems(items, "staff", [], ALL_ON)).toEqual([]);
  });

  it("drops a parent whose children are emptied at a deeper level", () => {
    const items: NavItem[] = [
      {
        title: "Reports",
        url: "/reports",
        items: [
          {
            title: "VAT",
            url: "#",
            items: [{ title: "VAT Report", url: "/reports/tax", features: ["tax"] }],
          },
        ],
      },
    ];

    // Grandchild gated off → child empties → parent empties → nothing renders.
    expect(filterNavItems(items, "admin", [], without("tax"))).toEqual([]);
  });

  it("hides the Locations group when multiLocation is off", () => {
    const items: NavItem[] = [
      {
        title: "Locations",
        url: "/locations",
        items: [
          { title: "Locations", url: "/locations", features: ["multiLocation"] },
          {
            title: "Stock by Location",
            url: "/locations/stock-report",
            features: ["multiLocation"],
          },
        ],
      },
    ];

    expect(filterNavItems(items, "admin", [], without("multiLocation"))).toEqual([]);
    expect(titles(filterNavItems(items, "admin", [], ALL_ON))).toEqual(["Locations"]);
  });

  it("keeps an anyFeatures item while one of its features is on", () => {
    // Sales History must survive `sales: false` for an online-only merchant,
    // because online orders commit to a Sale.
    const items: NavItem[] = [
      {
        title: "Sales History",
        url: "/sales/history",
        anyFeatures: ["sales", "storefront"],
      },
    ];

    expect(titles(filterNavItems(items, "admin", [], without("sales")))).toEqual([
      "Sales History",
    ]);
    expect(filterNavItems(items, "admin", [], without("sales", "storefront"))).toEqual(
      []
    );
  });

  it("does not mutate the input", () => {
    const items: NavItem[] = [
      {
        title: "Sales",
        url: "/sales",
        items: [{ title: "Sales Returns", url: "/sales/returns", features: ["returns"] }],
      },
    ];

    filterNavItems(items, "admin", [], without("returns"));
    expect(items[0].items).toHaveLength(1);
  });

  /**
   * The sidebar and the page read the same table, so a screen cannot be gated in
   * one and left open in the other. `/reports/sales` used to render "No data
   * available" to a staff user whose API call had 403'd.
   */
  describe("permissionsForPath", () => {
    it("gates a report on reports.view", () => {
      expect(permissionsForPath("/reports/sales")).toEqual(["reports.view"]);
    });

    it("prefers the deepest match — expiry is a shop-floor screen, not a report", () => {
      expect(permissionsForPath("/reports/expiry")).toEqual(["stock.view"]);
    });

    it("matches a nested route against its section", () => {
      expect(permissionsForPath("/products/some-id/edit")).toEqual([
        "products.view",
      ]);
    });

    /**
     * A section parent and its first child share a URL, and they declare
     * different things: the parent lists the union of every child (so the
     * container appears when any one is reachable), the child lists what that
     * screen needs. The guard must take the child — otherwise `/products` would
     * open for someone holding only `units.view`, and `/inventory` for someone
     * holding only `stock.manage`.
     */
    it("takes the leaf, not the container, when both declare the same url", () => {
      expect(permissionsForPath("/products")).toEqual(["products.view"]);
      expect(permissionsForPath("/inventory")).toEqual(["stock.view"]);
      expect(permissionsForPath("/accounts")).toEqual(["accounts.view"]);
      // `/sales` is the POS screen itself, so it needs create — not view.
      expect(permissionsForPath("/sales")).toEqual(["sales.create"]);
    });

    it("returns undefined for a route the table does not gate", () => {
      expect(permissionsForPath("/dashboard")).toBeUndefined();
      expect(permissionsForPath("/nowhere-at-all")).toBeUndefined();
    });

    it("does not match a route that merely shares a prefix string", () => {
      // "/reportsomething" must not inherit "/reports".
      expect(permissionsForPath("/reportsomething")).toBeUndefined();
    });
  });
});
