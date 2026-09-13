// coding-standard: maintained
import {
  Inbox,
  PackageCheck,
  PackageX,
  RotateCcw,
  Truck,
  Store,
  CircleAlert,
  Wallet,
} from "lucide-react";
import type { StatData } from "@/ui/components/StatsCard";
import type { AdminStorefrontOrder, OrderStats } from "@/services/api";
import { formatMoney } from "@/components/storefront/format";

/**
 * Which of the selected orders each bulk action may actually act on.
 *
 * Pure and shared, because the row menu and the bulk bar have to agree. They did
 * not at first: the row offered Delete on any closed order while the bulk bar
 * applied the server's full precondition list, so a rejected order holding a
 * prepayment showed a Delete item that could only ever fail, and was silently
 * absent from the count next to it.
 *
 * All of this is a HINT, never the gate. The server re-checks every rule and the
 * rows here may be a minute old — what these buy is a merchant who is not offered
 * an action that will be refused.
 */

/**
 * The buyer's record beside their name — `5 orders · 3 rejected`.
 *
 * Returns nothing for a first-time buyer: "1 order · 0 rejected" on every new
 * order is noise, and a chip that appears on every row stops being read. It is
 * the REPEAT that carries information, in both directions — a number with three
 * rejections behind it is the fraud signal this exists for, and one with seven
 * clean orders is a customer worth recognising.
 */
export const buyerHistoryLabel = (h?: {
  orders: number;
  rejected: number;
}): string | undefined =>
  !h || h.orders < 2
    ? undefined
    : `${h.orders} orders · ${h.rejected} rejected`;

/** Whether that history should read as a warning rather than a fact. */
export const buyerHistoryIsWarning = (h?: {
  orders: number;
  rejected: number;
}): boolean => !!h && h.orders >= 2 && h.rejected >= 2;

/**
 * How long an order has been sitting, as a merchant reads it.
 *
 * The column printed a calendar date, and a date is the wrong unit for this
 * screen: a COD order goes cold in hours, so what a merchant needs off a pending
 * row is "waiting since when", not "placed on the 8th". Relative up to four
 * weeks, then the date — past a month the age has stopped being actionable and
 * the date is the more useful fact.
 *
 * `now` is injectable so the tests are not tied to the wall clock.
 */
export const orderAge = (iso: string, now: Date = new Date()): string => {
  const then = new Date(iso);
  const mins = Math.floor((now.getTime() - then.getTime()) / 60000);
  // A clock skew between server and browser must not print "-3m".
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 28) return `${days}d`;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(then.getDate())}-${p(then.getMonth() + 1)}-${then.getFullYear()}`;
};

/** The full timestamp, for the row's `title` — the age never hides the date. */
export const orderPlacedAt = (iso: string): string =>
  new Date(iso).toLocaleString();

/** Total units on the order, which the row shows so a merchant need not open it. */
export const orderItemCount = (items: { quantity: number }[]): number =>
  items.reduce((sum, i) => sum + i.quantity, 0);

/**
 * Why an order was turned away, in the merchant's words.
 *
 * The values are the server's enum (`REJECTION_REASONS`); the labels are what a
 * merchant would actually say out loud, which is the test the list has to pass —
 * a bucket nobody recognises gets answered at random and the counts built on it
 * mean nothing.
 */
/**
 * Taken from the generated spec, not retyped — the same rule `OrderListPeriod`
 * follows in `types/api.ts`. A bucket renamed on the backend would otherwise
 * reach a merchant as a select that posts a value the server 400s, with nothing
 * failing to compile in between.
 */
export type RejectionReason = NonNullable<
  AdminStorefrontOrder["rejectionReason"]
>;

/**
 * The order the options are offered in, which the type alone cannot carry.
 *
 * `satisfies` catches a value this list has and the server does not. The other
 * direction — the server growing a bucket this list has not heard of — is caught
 * by `REJECTION_REASON_LABELS` below, whose `Record<RejectionReason, string>`
 * cannot compile with a key missing. Between them the drift is closed both ways.
 */
export const REJECTION_REASONS = [
  "fake_number",
  "no_answer",
  "out_of_stock",
  "price_dispute",
  "duplicate",
  "other",
] as const satisfies readonly RejectionReason[];

const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  fake_number: "Fake number",
  no_answer: "No answer",
  out_of_stock: "Out of stock",
  price_dispute: "Price dispute",
  duplicate: "Duplicate order",
  other: "Other",
};

export const REJECTION_REASON_OPTIONS = REJECTION_REASONS.map((value) => ({
  value,
  label: REJECTION_REASON_LABELS[value],
}));

/** Unmapped values fall through readable — an older order, or a new server bucket. */
export const rejectionReasonLabel = (reason?: string): string | undefined =>
  reason
    ? (REJECTION_REASON_LABELS[reason as RejectionReason] ??
      reason.replace(/_/g, " "))
    : undefined;

/**
 * How a payment method is spelled to the merchant.
 *
 * Shared because the two places that printed it disagreed, and CSS was doing the
 * work in both: the list row used `capitalize` and produced **"Cod"**, the detail
 * panel used `uppercase` and produced **"BANK"**. Neither is a word. COD is an
 * initialism and the others are ordinary nouns, which is a distinction no
 * text-transform can make — it needs a lookup.
 *
 * ⚠ Methods are MERCHANT data now, so a lookup table cannot know them. Pass the
 * order's `paymentMethodTitle` snapshot and the store's definitions and the
 * merchant sees their own words — "bKash payment", not "Manual". Called with
 * neither it still degrades to something readable, which is what the order list
 * does before settings have loaded.
 *
 * Re-exported from `lib/storefront-payment-methods` so the storefront and the
 * back office cannot drift apart again.
 */
export { adminPaymentMethodLabel as paymentMethodLabel } from "@/lib/storefront-payment-methods";

/**
 * Which statuses each tab stands for — a mirror of the server's `ORDER_TABS`,
 * kept for **one** job: highlighting the right tab when a deep link carries a raw
 * status. The ecommerce dashboard's "Returned today" tile links to
 * `?status=returned`, and with the terminal states folded into `Closed` that left
 * the list correctly filtered under a strip with nothing selected — a merchant
 * looking at eight rows and an unhighlighted "All".
 *
 * **The tab COUNTS are not computed from this.** They come from the server, which
 * emits a total per tab precisely so the client is not a second definition of the
 * grouping. This copy answers a question about the URL, not about the data, and
 * `satisfies` ties it to the generated status union — so a status renamed on the
 * backend is a compile error here rather than a tab that stops highlighting.
 */
const TAB_STATUSES = {
  pending: ["pending"],
  confirmed: ["confirmed"],
  processing: ["processing"],
  shipped: ["shipped", "ready_for_pickup"],
  delivered: ["delivered", "picked_up", "partially_returned"],
  closed: ["returned", "cancelled", "rejected"],
} as const satisfies Record<string, readonly AdminStorefrontOrder["status"][]>;

/**
 * Whether a tab should render as the current one.
 *
 * Not just `status === tab`: the filter may hold a raw status that is a MEMBER of
 * a tab rather than the tab itself. The narrower filter is kept rather than
 * widened — the returns tile counted returns and only returns; clicking `Closed`
 * from there widens it deliberately.
 */
export const isTabActive = (tabValue: string, status: string): boolean => {
  if (status === tabValue) return true;
  const members = TAB_STATUSES[tabValue as keyof typeof TAB_STATUSES];
  return !!members && (members as readonly string[]).includes(status);
};

/** Confirm applies to a pending order, and only a pending one. */
export const confirmableOrders = (
  items: AdminStorefrontOrder[],
  selected: Set<string>,
): AdminStorefrontOrder[] =>
  items.filter((o) => selected.has(o._id) && o.status === "pending");

/**
 * Reject is confirm's set minus anything holding money.
 *
 * `OrderCancelDialog` asks refund-or-keep whenever a prepayment exists; the bulk
 * bar has no room for that question, and answering it silently would move real
 * cash. Those orders are rejected one at a time from the row, where the question
 * still gets asked.
 */
export const rejectableOrders = (
  items: AdminStorefrontOrder[],
  selected: Set<string>,
): AdminStorefrontOrder[] =>
  confirmableOrders(items, selected).filter((o) => !o.prepaidAmount);

/**
 * Mirrors the four server preconditions in `storefront-order-delete.service.ts`.
 *
 * `returned` is a closed status and deliberately absent: a return only exists
 * against a Sale, so it is already excluded by `saleId` — offering it here would
 * only ever produce the wrong error message.
 *
 * The courier test reads `name` as well as `consignmentId` because a MANUAL
 * dispatch records only a carrier name, and a check on the id alone would offer
 * to delete a parcel that had already left the building.
 */
export const isDeletableOrder = (order: AdminStorefrontOrder): boolean =>
  (order.status === "rejected" || order.status === "cancelled") &&
  !order.saleId &&
  !order.prepaidAmount &&
  !order.paidAt &&
  order.paymentStatus !== "paid" &&
  order.paymentStatus !== "refunded" &&
  !order.courier?.consignmentId &&
  !order.courier?.name;

export const deletableOrders = (
  items: AdminStorefrontOrder[],
  selected: Set<string>,
): AdminStorefrontOrder[] =>
  items.filter((o) => selected.has(o._id) && isDeletableOrder(o));

/**
 * The order-list stat cards. Two groups on one row: four live pipeline balances (where the money
 * is sitting right now) and today's door outcomes (what actually happened at the doorstep).
 *
 * Every money bucket is NET server-side — of the recorded prepayment, of goods refused at the
 * door, and of any discount conceded to close the sale — so they read as cash, not as gross order
 * value. See the backend `orderStatsDto`; do not re-derive any of this client-side.
 *
 * Today's three settle against each other: what the courier was asked for = collected + returned
 * + conceded. That is the whole reason the two return tiles are here — without them "Collected
 * today" looked like a shortfall rather than a settlement, and it was in fact reporting the
 * expected figure instead of the collected one.
 */
const orders = (n: number) => `${n} order${n === 1 ? "" : "s"}`;

export const getOrderStats = (
  stats: OrderStats | undefined,
  currency?: string,
): StatData[] => {
  const money = (n: number | undefined) => formatMoney(n ?? 0, currency);
  /**
   * Pickup is a per-store choice, not a stage every merchant passes through. A delivery-only shop
   * had a permanent ৳0 tile taking a slot on the row — a zero that means "not applicable", which
   * is a different thing from the returns tiles' zero ("nothing came back today", real news).
   * Shown once the store has any pickup order at all, so it does not appear and vanish daily.
   */
  const hasPickup = stats?.byFulfillment.some(
    (row) => row.type === "pickup" && row.count > 0,
  );
  return [
    {
      label: "Pending",
      value: money(stats?.pending.value),
      description: orders(stats?.pending.count ?? 0),
      icon: Inbox,
      variant: "warning",
    },
    {
      label: "Awaiting dispatch",
      value: money(stats?.confirmedProcessing.value),
      description: orders(stats?.confirmedProcessing.count ?? 0),
      icon: PackageCheck,
      variant: "default",
    },
    {
      label: "In transit (COD)",
      value: money(stats?.inTransitCod.value),
      description: orders(stats?.inTransitCod.count ?? 0),
      icon: Truck,
      variant: "info",
    },
    ...(hasPickup
      ? ([
          {
            label: "Awaiting pickup",
            value: money(stats?.awaitingPickup.value),
            description: orders(stats?.awaitingPickup.count ?? 0),
            icon: Store,
            variant: "info",
          },
        ] as StatData[])
      : []),
    {
      label: "Delivered · uncollected",
      value: money(stats?.deliveredUncollected.value),
      description: orders(stats?.deliveredUncollected.count ?? 0),
      icon: CircleAlert,
      // Red only when there is actually money out there. A ৳0 tile in alarm
      // colours trains the merchant to ignore the one tile that should stop them.
      variant: stats?.deliveredUncollected.value ? "danger" : "default",
    },
    {
      label: "Collected today",
      value: money(stats?.collectedToday.value),
      description: orders(stats?.collectedToday.count ?? 0),
      icon: Wallet,
      variant: "success",
    },
    /**
     * The two halves of "what came back", kept apart because the merchant does
     * different things about them. A full RTO is a dead parcel — the courier
     * leg is spent and nothing was sold, so a rising number here is a targeting
     * or a confirm-call problem. A partial return is a kept sale that shrank,
     * which is a product or a size problem.
     *
     * Both are today's returns, matching "Collected today" — an order shipped
     * last week and refused this morning belongs to this morning.
     */
    {
      label: "Returned today",
      value: money(stats?.fullyReturnedToday.value),
      description: orders(stats?.fullyReturnedToday.count ?? 0),
      icon: PackageX,
      variant: stats?.fullyReturnedToday.value ? "danger" : "default",
    },
    {
      label: "Partly returned today",
      value: money(stats?.partlyReturnedToday.value),
      description: orders(stats?.partlyReturnedToday.count ?? 0),
      icon: RotateCcw,
      variant: stats?.partlyReturnedToday.value ? "warning" : "default",
    },
  ];
};

/**
 * The admin route for one order.
 *
 * Three tables point at it — the order list, its row menu, and a customer's
 * order history — so the path lives here rather than as a template literal
 * repeated at each call site, where a rename would only half-land.
 */
export const orderDetailHref = (orderId: string) => `/ecommerce/orders/${orderId}`;
