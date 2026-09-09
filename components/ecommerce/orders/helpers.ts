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
 * The three terminal states the `Closed` tab folds together. The server owns the
 * same list as `CLOSED_STATUSES`; this copy exists because the tab badge is a sum
 * of per-status counts and no order ever holds the value `closed`.
 */
export const CLOSED_STATUSES = ["returned", "cancelled", "rejected"];

/**
 * Whether a tab should render as the current one.
 *
 * Not just `status === tab`: a **deep link can carry a status that is no longer a
 * tab**. The ecommerce dashboard's "Returned today" tile links to
 * `?status=returned`, and once the three terminal states were folded into `Closed`
 * that left the list correctly filtered under a strip with nothing highlighted —
 * a merchant looking at eight rows and an unselected "All".
 *
 * The narrower filter is kept rather than widened, because the tile counted
 * returns and only returns; clicking `Closed` from there widens it deliberately.
 */
export const isTabActive = (tabValue: string, status: string): boolean =>
  tabValue === "closed"
    ? status === "closed" || CLOSED_STATUSES.includes(status)
    : status === tabValue;

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
