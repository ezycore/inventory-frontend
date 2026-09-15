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
import type { StorefrontCacheScope } from "@/lib/storefront-cache-tags";
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

  /**
   * An order's Meta ad-reporting flag was flipped (docs/plan/meta-pixel-capi.md D19).
   *
   * Touches no stock and no money — it is a reporting label, exactly like `channel`. Two
   * resources all the same: the order detail renders the flag, and the events log gains a
   * `skipped(excluded)` row the next time the order transitions.
   */
  "order.metaExclusionChanged": [
    k.storefrontOrders.all(),
    k.metaEvents.all(),
  ],

  /** A queued Meta event was requeued by hand. Nothing but the events log changes. */
  "meta.eventRetried": [k.metaEvents.all()],

  /** A storefront order changed state without touching stock or money (status, courier, tracking). */
  "order.changed": [
    k.storefrontOrders.all(),
    k.storefrontDashboard.all(),
    ...DERIVED,
  ],

  /**
   * An order was walked BACKWARD through its pipeline, releasing the stock hold it
   * was carrying (`processing`/`confirmed` → `pending`).
   *
   * It spreads `STOCK` for the same reason `order.confirmed` does, in the opposite
   * direction: `reservedQuantity` drops, so every screen that shows sellable stock
   * — inventory, products, variants, the location stock report — is now wrong.
   * Missing that is exactly the bug this file exists to prevent, and the status
   * endpoint used to be stock-neutral, so `order.changed` was the honest event for
   * it right up until reversal was added.
   *
   * No `MONEY`: a reversal is a correction, not a refund. Cancelling with a refund
   * is `order.returned`; the prepayment paths are `order.settled`.
   */
  "order.reversed": union(
    [k.storefrontOrders.all(), k.storefrontDashboard.all()],
    STOCK,
  ),

  /**
   * An order's CONTENT was edited before dispatch — lines, address, or agreed price.
   *
   * Spreads `STOCK` because editing the lines of a **confirmed** order adjusts its
   * hold in the same transaction that writes the order. Declared unconditionally
   * rather than only when the order was holding stock: the alternative is the
   * mutation re-deriving a backend rule, and the cost of being wrong (a stock
   * screen that disagrees with reality) is far higher than one refetch of pages the
   * merchant is not currently looking at.
   */
  "order.edited": union(
    [k.storefrontOrders.all(), k.storefrontDashboard.all(), k.storefrontCustomers.all()],
    STOCK,
  ),

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

  /** Money moved on an order: prepayment, mark-paid, courier cost, refund. Mark-paid posts a Sale. */
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

  /**
   * A courier's remittance statement was FILED — recorded, not posted.
   *
   * No money has moved: `recordPayout` writes the statement, stamps the parcels it covers
   * with their `payoutRef`, and stops there, because the destination account is the
   * merchant's to choose and the deductions are theirs to agree to first. So this event
   * deliberately carries **no `MONEY`** — flushing the whole ledger on a filing that touched
   * none of it is the wasted refetch this file exists to prevent.
   */
  "payout.recorded": [
    k.courierPayouts.all(),
    k.storefrontOrders.all(),
  ],

  /**
   * A payout was POSTED: the net transferred out of the courier's clearing account and each
   * deduction booked as an expense against it.
   *
   * This is where the money moves, and it moves a lot of it — the clearing balance, the
   * destination account, several expense rows, and the delivery expense that dispatch
   * deferred while the courier still held the cash. Hence the full `MONEY` spread, which
   * carries `DERIVED` (dashboard + reports) with it: the cash report and the position report
   * both split with-courier out of cash, so both are wrong the instant this lands.
   */
  "payout.posted": union(
    [
      k.courierPayouts.all(),
      k.storefrontOrders.all(),
      k.storefrontDashboard.all(),
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

  /**
   * A storefront content PAGE changed (About, FAQ, a policy) — created, edited,
   * published or deleted.
   *
   * Its own event rather than a line inside `storefront.catalog.changed`: pages
   * are merchant-authored content, and nothing a campaign or a listing flag does
   * dirties them. It was folded into that event once, which is how creating a
   * page left the admin list showing the previous set until a reload — the event
   * fired, and none of the keys it carries was the one the page list reads.
   *
   * In `PUBLIC_STOREFRONT_EVENTS` too, because publishing a page has to reach the
   * shop's rendered routes and its footer.
   */
  "storefront.content.changed": [k.contentPages.all()],

  /**
   * A Storefront Builder page's DRAFT changed — created, duplicated, autosaved,
   * discarded or restored from a revision. Shoppers see none of it, so it stays
   * out of `PUBLIC_STOREFRONT_EVENTS`.
   *
   * Lists only, on purpose. The hooks that change a draft write the returned page
   * into its detail cache themselves: refetching the page under an open editor on
   * every autosave would race the merchant's next keystroke and hand the editor a
   * `draftVersion` it did not save.
   */
  "storefront.page.drafted": [k.storefrontPages.lists()],

  /**
   * What shoppers see changed — a page published, unpublished, renamed, re-titled
   * or deleted. In `PUBLIC_STOREFRONT_EVENTS`, so the shop's page HTML is flushed.
   */
  "storefront.page.published": [k.storefrontPages.all()],

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
 * second cache no `QueryClient` can reach: Next's Data Cache + Full Route Cache, tagged by
 * `lib/storefront-server.ts`. Those entries are shared by every shopper and live in the server, so a
 * merchant cannot clear one by reloading — before this list existed, an edit took up to five minutes
 * to appear on the shop.
 *
 * Each event names the cache scope it dirties (`lib/storefront-cache-tags.ts`). A product edit
 * expires the catalogue and every page built from it, and leaves the store payload — and a landing
 * page that shows no products — cached.
 *
 * Declared here rather than at each `onSuccess` for the reason this whole file exists: thirteen
 * mutation authors each remembering a second flush is exactly the graph nobody keeps in their head.
 *
 * **`stock.moved` is deliberately absent.** Stock levels do show on the storefront, but stock moves
 * on every sale — flushing per movement would leave the cache empty in a busy shop. The catalogue
 * routes' own 60s `revalidate` covers stock freshness; this list is for merchant-authored edits,
 * which are rare and expected to appear at once.
 */
const PUBLIC_STOREFRONT_EVENTS: Partial<Record<DomainEvent, StorefrontCacheScope>> = {
  "storefront.catalog.changed": "catalog",
  "storefront.content.changed": "content",
  "storefront.page.published": "content",
  "catalog.changed": "catalog",
};

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

  const scopes = new Set<StorefrontCacheScope>();
  for (const event of events) {
    const scope = PUBLIC_STOREFRONT_EVENTS[event];
    if (scope) scopes.add(scope);
  }
  if (scopes.size > 0) void revalidateStorefront([...scopes]);

  return Promise.all(
    [...keys.values()].map((queryKey) => qc.invalidateQueries({ queryKey })),
  );
};
