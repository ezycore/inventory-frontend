import { describe, expect, it } from "vitest";
import {
  featuresForPath,
  filterNavItems,
  isReadOnlyRoute,
  permissionsForPath,
  unmetRouteFeatures,
} from "../nav-utils";
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

    /**
     * The nav row for courier payouts earns its keep here rather than in the sidebar.
     *
     * Without a row of its own, the nearest gated ancestor of `/ecommerce/payouts` is
     * `/ecommerce` → `storefront.view`. The endpoints want `storefront.orders.view`, so a role
     * holding one and not the other would pass this guard and then 403 every request behind
     * it — the failure the nav table exists to prevent.
     */
    it("gates courier payouts on the orders permission, not the storefront one", () => {
      expect(permissionsForPath("/ecommerce/payouts")).toEqual([
        "storefront.orders.view",
      ]);
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

  /**
   * The feature half of the same idea. Without it a merchant whose plan
   * withholds a capability still reaches the URL from a bookmark or a stale
   * tab, the page fires its request, and a `FEATURE_*_DISABLED` 403 surfaces as
   * a generic error toast — a wall where an upsell belongs.
   */
  describe("featuresForPath", () => {
    it("gates a storefront screen on storefront", () => {
      expect(featuresForPath("/ecommerce/coupons")).toEqual({
        all: ["storefront"],
        anyOf: [],
      });
    });

    it("carries both gate shapes when a route declares each", () => {
      // Sales Returns needs `returns` AND (sales OR storefront) — a shopper
      // return happens on an online-only workspace too.
      const gate = featuresForPath("/sales/returns");
      expect(gate?.all).toEqual(["returns"]);
      expect(gate?.anyOf).toContainEqual(["sales", "storefront"]);
    });

    /**
     * Courier payouts is the case where the URL, not the sidebar tree, decides the gate.
     *
     * The endpoints behind it are gated on `storefront` deliberately — a merchant with the
     * ledger switched off still needs to see what a courier is holding. Because gates resolve
     * by URL prefix, a page at `/accounts/payouts` would inherit `accounts` from the Cash &
     * Bank row and feature-lock a screen the backend serves them. So the path matters, and
     * this test is what stops it being "tidied" into the Money group later.
     */
    it("gates courier payouts on storefront, never on accounts", () => {
      const gate = featuresForPath("/ecommerce/payouts");
      expect(gate?.all).toEqual(["storefront"]);
      // It sits under Sell, so it also inherits that group's any-of — which `storefront`
      // already satisfies, so a shop-less online merchant still gets in.
      expect(gate?.anyOf).toContainEqual(["sales", "storefront"]);
      expect(
        unmetRouteFeatures(gate, {
          storefront: true,
          accounts: false,
          sales: false,
        } as never),
      ).toEqual([]);
      // What the alternative would have cost, pinned so the reasoning survives.
      expect(featuresForPath("/accounts")?.all).toEqual(["accounts"]);
    });

    it("takes the leaf on a shared url, like permissionsForPath", () => {
      // `/sales` is the POS screen; its container is any-of. The leaf's hard
      // `sales` requirement must win, or an online-only merchant is offered a
      // counter they cannot use.
      expect(featuresForPath("/sales")?.all).toEqual(["sales"]);
    });

    /**
     * The one place this differs from `permissionsForPath`, and the reason it
     * cannot just copy it: `filterNavItems` drops a whole subtree when a parent
     * fails, so a child inherits its ancestors' feature gates. Every child
     * happens to repeat its parent's declaration today, which is exactly why a
     * leaf-only rule would pass this suite and break on the first child that
     * trusts its parent instead.
     */
    it("inherits an ancestor's gate rather than only reading the leaf", () => {
      // The ancestor's url must NOT prefix the child's, or this proves nothing:
      // plain longest-match would find the parent by URL and the test passes
      // with inheritance deleted. A container with `url: "#"` is the honest
      // case — it can never match a path, so the only way its gate reaches the
      // child is by being carried down. (A first version of this test used
      // `/parent` + `/parent/child` and survived exactly that mutation.)
      const groups = [
        {
          label: "G",
          items: [
            {
              title: "Container",
              url: "#",
              features: ["storefront" as const],
              items: [
                {
                  title: "Child",
                  url: "/somewhere-else",
                  permissions: ["x.view"],
                },
              ],
            },
          ],
        },
      ];
      expect(featuresForPath("/somewhere-else", groups)?.all).toEqual([
        "storefront",
      ]);
    });

    it("accumulates an ancestor's any-of group alongside the leaf's own gate", () => {
      const groups = [
        {
          label: "G",
          items: [
            {
              title: "Container",
              url: "#",
              anyFeatures: ["sales" as const, "storefront" as const],
              items: [
                {
                  title: "Child",
                  url: "/leaf",
                  features: ["returns" as const],
                },
              ],
            },
          ],
        },
      ];
      const gate = featuresForPath("/leaf", groups);
      expect(gate?.all).toEqual(["returns"]);
      expect(gate?.anyOf).toEqual([["sales", "storefront"]]);
    });

    it("returns undefined for an ungated route", () => {
      expect(featuresForPath("/dashboard")).toBeUndefined();
      expect(featuresForPath("/customers")).toBeUndefined();
      expect(featuresForPath("/nowhere-at-all")).toBeUndefined();
    });

    it("does not match a route that merely shares a prefix string", () => {
      expect(featuresForPath("/ecommercesomething")).toBeUndefined();
    });
  });

  describe("unmetRouteFeatures", () => {
    // Every key explicitly false except the named ones. A partial map would not
    // mean "only these are on": a key MISSING from a map reads as ON, exactly as
    // the backend reads it (see `resolveFeatureMap`).
    const on = (...keys: string[]) =>
      Object.fromEntries(
        Object.keys(ALL_ON).map((k) => [k, keys.includes(k)]),
      ) as never;

    it("names a missing all-of key", () => {
      const gate = { all: ["storefront" as const], anyOf: [] };
      expect(unmetRouteFeatures(gate, on("sales"))).toEqual(["storefront"]);
    });

    it("says nothing when the gate is satisfied", () => {
      const gate = { all: ["storefront" as const], anyOf: [] };
      expect(unmetRouteFeatures(gate, on("storefront"))).toEqual([]);
    });

    it("an unsatisfied any-of group offers every route in, not one", () => {
      // Both open the screen, so telling the merchant about only one of them
      // would send them to buy the wrong thing.
      const gate = { all: [], anyOf: [["sales" as const, "storefront" as const]] };
      expect(unmetRouteFeatures(gate, on("tax"))).toEqual(["sales", "storefront"]);
    });

    it("a satisfied any-of group contributes nothing", () => {
      const gate = { all: [], anyOf: [["sales" as const, "storefront" as const]] };
      expect(unmetRouteFeatures(gate, on("storefront"))).toEqual([]);
    });
  });
});

/**
 * Read-only screens must outlive the capability that filled them.
 *
 * Adding a guard layout to every gated section closed a real hole — the URLs
 * were open with the sidebar hiding them — but it closed too much. Purchase
 * History and Stock History are pure reads, and their backends say so: both
 * routers use `requireFeatureForWrites`, which lets GET through on a closed
 * feature *on purpose*. `inventory.routes.ts` spells out why: "a workspace that
 * tracked stock for a year and switched it off still owns that history, and a
 * blanket gate would put a year of movements out of reach."
 *
 * So the guard locked screens the API was still happily serving.
 */
describe("isReadOnlyRoute", () => {
  it("exempts the history screens whose backends gate writes alone", () => {
    expect(isReadOnlyRoute("/purchases/history")).toBe(true);
    expect(isReadOnlyRoute("/inventory/movements")).toBe(true);
    expect(isReadOnlyRoute("/sales/history")).toBe(true);
    expect(isReadOnlyRoute("/accounts/transactions")).toBe(true);
  });

  it("does not exempt the write screens beside them", () => {
    // The flag is per-leaf and never inherited. "Purchase History" being
    // read-only says nothing about "New Purchase" one line above it, and a
    // section-level reading would reopen every write screen it contains.
    expect(isReadOnlyRoute("/purchases/orders")).toBe(false);
    expect(isReadOnlyRoute("/inventory/adjust")).toBe(false);
    expect(isReadOnlyRoute("/inventory/transfers")).toBe(false);
    expect(isReadOnlyRoute("/sales/returns")).toBe(false);
  });

  it("does not exempt reports, whose backends DO gate reads", () => {
    // `reports.routes.ts` uses the plain `requireFeature`, so its reads 403.
    // Exempting them would trade a locked screen for an empty one — which reads
    // as "you have no sales" rather than "this is not in your plan".
    expect(isReadOnlyRoute("/reports/purchases")).toBe(false);
    expect(isReadOnlyRoute("/reports/inventory")).toBe(false);
  });

  it("says no for a path nav does not know", () => {
    expect(isReadOnlyRoute("/nowhere")).toBe(false);
  });
});
