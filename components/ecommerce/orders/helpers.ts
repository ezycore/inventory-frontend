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
import type { OrderStats } from "@/services/api";
import { formatMoney } from "@/components/storefront/format";

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
