// coding-standard: maintained
import {
  Inbox,
  PackageCheck,
  Truck,
  Store,
  CircleAlert,
  Wallet,
} from "lucide-react";
import type { StatData } from "@/ui/components/StatsCard";
import type { OrderStats } from "@/services/api";
import { formatMoney } from "@/components/storefront/format";

/**
 * The order-list stat cards (Phase 4). Six headline buckets of the COD cash cycle — each shows
 * money (`value`, currency-formatted) with the order count as the subtitle. The money buckets are
 * NET of any recorded advance server-side, so "In transit" etc. read as cash still owed, not gross
 * order value. `deliveredUncollected` is styled `danger` — cash the merchant delivered but has not
 * yet collected. See the backend `orderStatsDto` for the exact semantics.
 */
const orders = (n: number) => `${n} order${n === 1 ? "" : "s"}`;

export const getOrderStats = (
  stats: OrderStats | undefined,
  currency?: string,
): StatData[] => {
  const money = (n: number | undefined) => formatMoney(n ?? 0, currency);
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
    {
      label: "Awaiting pickup",
      value: money(stats?.awaitingPickup.value),
      description: orders(stats?.awaitingPickup.count ?? 0),
      icon: Store,
      variant: "info",
    },
    {
      label: "Delivered · uncollected",
      value: money(stats?.deliveredUncollected.value),
      description: orders(stats?.deliveredUncollected.count ?? 0),
      icon: CircleAlert,
      variant: "danger",
    },
    {
      label: "Collected today",
      value: money(stats?.collectedToday.value),
      description: orders(stats?.collectedToday.count ?? 0),
      icon: Wallet,
      variant: "success",
    },
  ];
};
