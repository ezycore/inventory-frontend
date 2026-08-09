// coding-standard: maintained
/**
 * Cache invalidation, declared as an effect graph.
 *
 * The recurring bug this replaces: every mutation author had to know the *whole* dependency graph of
 * the app — that confirming a storefront order reserves stock, that marking it paid posts a Sale and
 * moves money, that all three restate the dashboard. Nobody knows all of that, so each mutation
 * invalidated the one or two roots its author happened to have in mind, and the rest went stale.
 *
 * So the dependency is inverted. A mutation declares **what it did**; this file owns **what that
 * dirties**. Adding a new consumer of some data means editing one entry here, not hunting down every
 * mutation that feeds it.
 *
 *   onSuccess: () => invalidate(qc, "order.confirmed")
 *
 * Events are named after the *backend* state transitions, which are already documented per domain in
 * `easystock-backend/.claude/skills/{sales-flow,purchase-flow,inventory-stock,accounting-ledger,storefront-orders}`.
 * Keep the two vocabularies aligned — an event that doesn't correspond to something the backend
 * actually does is a sign the frontend is inventing a workflow.
 *
 * Full rationale: `docs/plan/query-invalidation.md` §3.2.
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { queryKeys as k } from "./query-keys";

/**
 * Read models that are a pure derivation of everything else, so almost every write dirties them.
 * They are cheap to list and expensive to forget — a dashboard that disagrees with the page the user
 * just came from is the most-reported flavour of this bug.
 */
const DERIVED: QueryKey[] = [k.dashboard.all(), k.reports.all()];

const STOCK: QueryKey[] = [
  k.inventory.all(),
  k.stock.all(),
  k.variants.all(),
  k.products.all(),
  k.locationStockReport.all(),
  ...DERIVED,
];

const MONEY: QueryKey[] = [k.accounts.all(), k.transactions.all(), ...DERIVED];

/**
 * Compose key groups without repeating a key. Composed events overlap by construction — a posted
 * sale spreads both `MONEY` and `STOCK`, and both carry `DERIVED` — and a declaration that lists
 * the dashboard twice reads as if it meant something.
 */
const union = (...groups: QueryKey[][]): QueryKey[] => [
  ...new Map(groups.flat().map((key) => [JSON.stringify(key), key])).values(),
];

/**
 * Domain event → every key it dirties.
 *
 * Composition is deliberate and load-bearing: a posted sale really does move both stock and money, so
 * `sale.posted` spreads both. Prefer composing an existing event over hand-listing keys again.
 */
export const EFFECTS = {
  /** Any stock movement: adjustment, transfer, receive, opening stock, batch change. */
  "stock.moved": STOCK,

  /** Any cash/bank movement that is not itself a sale or purchase (transfers, expenses, deposits). */
  "money.moved": MONEY,

  /** A Sale document was created or finalized — stock leaves, money and customer due move. */
  "sale.posted": union([k.salesOrders.all(), k.customers.all()], MONEY, STOCK),

  /** A draft sale changed, or was deleted. No stock and no money have moved yet. */
  "sale.drafted": [k.salesOrders.all(), ...DERIVED],

  /** A payment was recorded against a Sale. */
  "sale.paid": [k.salesOrders.all(), k.customers.all(), ...MONEY],

  /** A sales return: stock comes back, money or customer credit goes out. */
  "sale.returned": union(
    [k.salesReturns.all(), k.salesOrders.all(), k.customers.all()],
    MONEY,
    STOCK,
  ),

  /** A purchase order was created, updated or cancelled. Nothing received yet. */
  "purchase.ordered": [k.purchaseOrders.all(), k.suppliers.all(), ...DERIVED],

  /** Goods received against a PO — stock arrives, cost basis moves, supplier due moves. */
  "purchase.received": union(
    [k.purchaseOrders.all(), k.suppliers.all()],
    MONEY,
    STOCK,
  ),

  /** A payment was recorded against a purchase order. */
  "purchase.paid": [k.purchaseOrders.all(), k.suppliers.all(), ...MONEY],

  /** A purchase return: stock leaves, supplier due or refund moves. */
  "purchase.returned": union(
    [k.purchaseReturns.all(), k.purchaseOrders.all(), k.suppliers.all()],
    MONEY,
    STOCK,
  ),

  /** A storefront order changed state without touching stock or money (status, courier, tracking). */
  "order.changed": [
    k.storefrontOrders.all(),
    k.storefrontDashboard.all(),
    ...DERIVED,
  ],

  /**
   * Order dispatched to a courier (API or manual). Dispatch is **commit-first**: it books the
   * order's Sale and consumes the stock reservation, so it dirties strictly more than
   * `order.changed` — the sales list, the customer, the ledger and stock all move with it.
   */
  "order.dispatched": union(
    [
      k.storefrontOrders.all(),
      k.storefrontDashboard.all(),
      k.storefrontCustomers.all(),
      k.salesOrders.all(),
      k.customers.all(),
    ],
    MONEY,
    STOCK,
  ),

  /** Order confirmed — stock is reserved for it. */
  "order.confirmed": union(
    [
      k.storefrontOrders.all(),
      k.storefrontDashboard.all(),
      k.storefrontCustomers.all(),
    ],
    STOCK,
  ),

  /** Money moved on an order: COD advance, mark-paid, courier cost, refund. Mark-paid posts a Sale. */
  "order.settled": union(
    [
      k.storefrontOrders.all(),
      k.storefrontDashboard.all(),
      k.storefrontCustomers.all(),
      k.salesOrders.all(),
      k.customers.all(),
    ],
    MONEY,
  ),

  /** An order was cancelled or returned — reserved stock is released and money may go back. */
  "order.returned": union(
    [
      k.storefrontOrders.all(),
      k.storefrontDashboard.all(),
      k.storefrontCustomers.all(),
      k.salesReturns.all(),
      k.salesOrders.all(),
    ],
    MONEY,
    STOCK,
  ),

  /**
   * Catalog master data changed: product, category, brand, unit, tax rate, discount.
   *
   * Deliberately coarse. A resource's own lists and dropdowns are already flushed by prefix (see
   * `services/api/query-keys.ts`), so this event carries only the *cross*-resource effect — the
   * product and inventory rows that embed a category/brand/unit name or a tax rate. Splitting it six
   * ways would add six event names to avoid one refetch of a list that is already on screen.
   */
  "catalog.changed": [
    k.products.all(),
    k.variants.all(),
    k.categories.all(),
    k.inventory.all(),
    ...DERIVED,
  ],

  /** The storefront catalog overlay changed (listing flags, collections, campaigns, coupons). */
  "storefront.catalog.changed": [
    k.storefrontCatalog.all(),
    k.campaigns.all(),
    k.coupons.all(),
    k.storefrontDashboard.all(),
  ],

  /** A customer or supplier record changed. Their name/terms are embedded in documents. */
  "party.changed": [
    k.customers.all(),
    k.suppliers.all(),
    k.salesOrders.all(),
    k.purchaseOrders.all(),
    ...DERIVED,
  ],

  /**
   * Organization-level config changed: settings, features, VAT registration, locations, users,
   * roles, the signed-in profile. `DERIVED` is included because org settings decide how money and
   * tax are *presented* — a VAT registration change restates the VAT report. Coarse on purpose:
   * `invalidateQueries` only refetches queries that are actually mounted, and no one is looking at
   * the dashboard while editing settings, so the unmounted ones just get marked stale.
   */
  "org.changed": [
    k.organization.all(),
    k.locations.all(),
    k.users.all(),
    k.roles.all(),
    k.profile.all(),
    ...DERIVED,
  ],

  /**
   * A role was authored, edited or deleted.
   *
   * Narrower than `org.changed` on purpose — no `DERIVED`. A role decides who
   * may *do* things, not what any figure equals, so no report or dashboard
   * number moves. The three that do:
   * - `roles` — the list and the permission catalog;
   * - `users` — a row's role label, and a delete reassigns holders outright;
   * - `profile` — permissions resolve per request, so editing your own role
   *   changes what the app should show you on the very next one, with no
   *   re-login. Miss this and the nav keeps offering pages that now 403.
   */
  "role.changed": [k.roles.all(), k.users.all(), k.profile.all()],
} satisfies Record<string, QueryKey[]>;

export type DomainEvent = keyof typeof EFFECTS;

/**
 * Events whose data the **public storefront** renders server-side, and which therefore dirty a
 * second cache no `QueryClient` can reach: Next's Data Cache + Full Route Cache, tagged
 * `store:{slug}` by `lib/storefront-server.ts`. Those entries are shared by every shopper and live
 * in the server, so a merchant cannot clear one by reloading — before this list existed, an edit
 * took up to five minutes to appear on the shop.
 *
 * Declared here rather than at each `onSuccess` for the reason this whole file exists: thirteen
 * mutation authors each remembering a second flush is exactly the graph nobody keeps in their head.
 *
 * **`stock.moved` is deliberately absent.** Stock levels do show on the storefront, but stock moves
 * on every sale — flushing per movement would leave the cache empty in a busy shop. The catalogue
 * routes' own 60s `revalidate` covers stock freshness; this list is for merchant-authored edits,
 * which are rare and expected to appear at once.
 */
const PUBLIC_STOREFRONT_EVENTS = new Set<DomainEvent>([
  "storefront.catalog.changed",
  "catalog.changed",
]);

/**
 * Invalidate everything the given events dirty. Duplicate keys across composed events are collapsed,
 * so `invalidate(qc, "sale.posted", "stock.moved")` refetches each query once.
 *
 * Events in `PUBLIC_STOREFRONT_EVENTS` additionally expire the shop's server-rendered pages. That
 * call is fire-and-forget and is **not** part of the returned promise — it is a best-effort flush of
 * someone else's cache, not data this app is waiting on.
 *
 * Returns the promise so a caller that needs the refetch to have landed — a redirect, a print — can
 * await it. Most callers can fire and forget.
 */
export const invalidate = (qc: QueryClient, ...events: DomainEvent[]) => {
  const keys = new Map<string, QueryKey>();
  for (const event of events) {
    for (const key of EFFECTS[event]) keys.set(JSON.stringify(key), key);
  }

  if (events.some((event) => PUBLIC_STOREFRONT_EVENTS.has(event))) {
    void revalidateStorefront();
  }

  return Promise.all(
    [...keys.values()].map((queryKey) => qc.invalidateQueries({ queryKey })),
  );
};
