import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@/tests/test-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { DEFAULT_ORGANIZATION_FEATURES, type OrganizationFeatures } from "@/types";
import type { DashboardOverview } from "@/services/api";
import { QuickActions } from "./quick-actions";

/**
 * Quick Actions are shortcuts into screens the sidebar already gates. Before
 * this was enforced they were a hardcoded list, so a shop that turned the POS
 * off during onboarding still got a "New Sale" button on its dashboard — the
 * one entry point the nav work had just removed.
 *
 * Assertions read the links' `href`s: the gate is about where a shortcut
 * LANDS, and a label can be renamed without the destination moving.
 */
const signIn = (
  permissions: string[],
  features: Partial<OrganizationFeatures>,
) =>
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "owner@example.com",
      role: "owner",
      permissions,
      organization: {
        name: "Test Org",
        slug: "test-org",
        features: features as OrganizationFeatures,
      },
    },
    token: "test-token",
    isAuthenticated: true,
  });

/** Everything a full-access owner of an all-features-on org can reach. */
const ALL_PERMISSIONS = [
  "sales.create",
  "storefront.orders.view",
  "storefront.design",
  "purchases.create",
  "products.create",
  "customers.view",
  "stock.view",
  "reports.view",
];
/**
 * Every feature on — **derived, never listed by hand.** `areAllFeaturesEnabled`
 * tests `=== true`, so every feature an object omits reads as OFF; a hand list
 * names itself ALL and is not, and breaks this file the day a shortcut gains a
 * gate. Same fix as `ALL_PERMISSIONS` in `constants/__tests__/navItem.test.ts`.
 */
const ALL_FEATURES: OrganizationFeatures = {
  ...DEFAULT_ORGANIZATION_FEATURES,
  sales: true,
  storefront: true,
  purchases: true,
  inventoryTracking: true,
  multiLocation: true,
};

const EVERY_HREF = [
  "/sales/pos",
  "/ecommerce/orders",
  "/products",
  "/purchases",
  "/customers",
  "/inventory/lowstock",
  "/ecommerce/customize",
  "/reports",
];

/** The links one layout renders, in order. Both are in the DOM; CSS picks one. */
const linksIn = (container: HTMLElement, layout: "desktop" | "phone") =>
  Array.from(
    container.querySelectorAll<HTMLAnchorElement>(`[data-layout="${layout}"] a`),
  );
const hrefs = (container: HTMLElement, layout: "desktop" | "phone" = "desktop") =>
  linksIn(container, layout).map((a) => a.getAttribute("href"));

const render = (overview?: DashboardOverview) =>
  renderWithProviders(<QuickActions overview={overview} />).container;

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});

describe("QuickActions — gating", () => {
  it("shows every shortcut when features and permissions allow it", () => {
    signIn(ALL_PERMISSIONS, ALL_FEATURES);

    // The positive control: without this, the gating assertions below would
    // pass just as happily against a card that rendered nothing at all.
    expect(hrefs(render())).toEqual(EVERY_HREF);
  });

  it("hides New Sale when the POS feature is off", () => {
    signIn(ALL_PERMISSIONS, { ...ALL_FEATURES, sales: false });
    const container = render();

    expect(hrefs(container)).not.toContain("/sales/pos");
    expect(hrefs(container)).toContain("/ecommerce/orders");
  });

  it("hides shortcuts the user lacks permission for", () => {
    // A staff-shaped user: catalogue and stock yes, money and purchasing no.
    signIn(["products.create", "stock.view"], ALL_FEATURES);

    expect(hrefs(render())).toEqual(["/products", "/inventory/lowstock"]);
  });

  it("renders nothing rather than an empty card when all shortcuts are gated away", () => {
    signIn([], ALL_FEATURES);

    // Not just "no links" — the whole section must be gone.
    expect(render()).toBeEmptyDOMElement();
  });

  it("opens the POS in its own tab and everything else in place", () => {
    signIn(ALL_PERMISSIONS, ALL_FEATURES);
    const [pos, orders] = linksIn(render(), "desktop");

    expect(pos.getAttribute("target")).toBe("_blank");
    expect(orders.getAttribute("target")).toBeNull();
  });
});

/**
 * The tier the gates were added for: a storefront-only shop with no counter, no
 * purchasing and no stock. Every shortcut it keeps must land somewhere it can
 * actually go.
 */
describe("QuickActions — storefront-only", () => {
  const STOREFRONT_ONLY: OrganizationFeatures = {
    ...DEFAULT_ORGANIZATION_FEATURES,
    sales: false,
    purchases: false,
    inventoryTracking: false,
    multiLocation: false,
    storefront: true,
  };

  it("offers nothing that lands on a blocked screen", () => {
    // Permissions are full here on purpose — this is the FEATURE axis. A
    // merchant holding `purchases.create` on a plan without purchasing still
    // must not be handed a shortcut to `/purchases`.
    signIn(ALL_PERMISSIONS, STOREFRONT_ONLY);

    expect(hrefs(render())).toEqual([
      "/ecommerce/orders",
      "/products",
      "/customers",
      "/ecommerce/customize",
      "/reports",
    ]);
  });

  it("brings Purchase back the moment purchasing is switched on", () => {
    // Features are per-org toggles, so the gate must be a live read.
    signIn(ALL_PERMISSIONS, { ...STOREFRONT_ONLY, purchases: true });
    const container = render();

    expect(hrefs(container)).toContain("/purchases");
    expect(hrefs(container)).not.toContain("/inventory/lowstock");
  });
});

describe("QuickActions — counts", () => {
  const overview = (pending?: number, low?: [number, number]) =>
    ({
      ...(pending === undefined ? {} : { ordersPipeline: { pending, open: pending } }),
      ...(low ? { lowStock: { items: [], count: low[0], outOfStockCount: low[1] } } : {}),
    }) as unknown as DashboardOverview;

  it("badges the order queue and the low-stock shortcut", () => {
    signIn(ALL_PERMISSIONS, ALL_FEATURES);
    const container = render(overview(12, [3, 2]));
    const desktop = container.querySelector('[data-layout="desktop"]')!;

    expect(desktop.textContent).toContain("12 to confirm");
    // Out-of-stock counts too — "running low" includes "ran out".
    expect(desktop.querySelector('a[href="/inventory/lowstock"]')!.textContent).toContain("5");
  });

  it("shows no number for an empty queue or a block the server did not send", () => {
    signIn(ALL_PERMISSIONS, ALL_FEATURES);
    const container = render(overview(0));

    expect(container.textContent).not.toContain("to confirm");
    expect(container.querySelector('a[href="/inventory/lowstock"]')!.textContent).toBe("Low Stock");
  });
});

describe("QuickActions — phone", () => {
  it("leads with New Sale and puts the order queue first in the grid", () => {
    signIn(ALL_PERMISSIONS, ALL_FEATURES);

    // Every shortcut still appears exactly once — the lead is not repeated.
    expect(hrefs(render(), "phone")).toEqual(EVERY_HREF);
  });

  it("leads with Online Orders when the POS is off", () => {
    signIn(ALL_PERMISSIONS, { ...ALL_FEATURES, sales: false });

    expect(hrefs(render(), "phone")[0]).toBe("/ecommerce/orders");
  });
});
