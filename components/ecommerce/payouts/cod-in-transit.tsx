"use client";
// coding-standard: maintained

import { Truck } from "lucide-react";

import { formatMoney } from "@/components/storefront/format";
import type { CourierMoneySummary } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Card } from "@/ui/components/card";
import { cn } from "@/ui/lib/utils";
import { providerLabel } from "./helpers";

type CodInTransit = CourierMoneySummary["codInTransit"];

/**
 * What the couriers are holding, per courier, with how long they have held it.
 *
 * **Two answers, side by side, on purpose.** The per-courier rows are derived from the orders
 * (parcels collected and not yet remitted); the clearing accounts are the ledger's own balances.
 * They should agree. Where they do not, the disagreement IS the finding — a parcel collected but
 * never posted, or a payout posted against the wrong courier — so this component shows both and
 * reconciles neither. Summing them would produce a number that is true of nothing.
 *
 * Ageing is measured from the collection, not from the order: a parcel that sat unsold for a
 * week and was collected yesterday is one day old here.
 */
export function CodInTransit({ data }: { data?: CodInTransit }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const money = (n: number) => formatMoney(n, currency);

  const byCourier = data?.byCourier ?? [];
  const accounts = data?.clearingAccounts ?? [];
  const buckets = data?.ageingBuckets ?? [];

  if (!data || (byCourier.length === 0 && accounts.length === 0)) {
    return (
      <Card className="p-5 shadow-none">
        <h3 className="text-sm font-semibold">With the couriers</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No courier is holding money for you right now.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">With the couriers</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Collected at the door, not yet paid over. Ageing runs from the collection.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums">
            {money(data.summary.withCourier)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.summary.parcels} parcel{data.summary.parcels === 1 ? "" : "s"} ·{" "}
            {data.summary.courierCount} courier
            {data.summary.courierCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {byCourier.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Courier</th>
                <th className="py-2 pr-3 font-medium">Holding</th>
                <th className="py-2 pr-3 font-medium">Parcels</th>
                <th className="py-2 pr-3 font-medium">Oldest</th>
                {buckets.map((bucket) => (
                  <th key={bucket} className="py-2 pr-3 font-medium">
                    {bucket} d
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byCourier.map((row) => (
                <tr key={`${row.provider}-${row.label}`} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      {row.label || providerLabel(row.provider)}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-medium tabular-nums">
                    {money(row.amount)}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                    {row.parcels}
                  </td>
                  {/* The number that matters: a courier remits in 2–7 days, so anything
                      older than that is a conversation to have with them. */}
                  <td
                    className={cn(
                      "py-2 pr-3 tabular-nums",
                      row.oldestDays > 7
                        ? "font-medium text-amber-700 dark:text-amber-500"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.oldestDays} d
                  </td>
                  {buckets.map((bucket) => (
                    <td
                      key={bucket}
                      className="py-2 pr-3 tabular-nums text-muted-foreground"
                    >
                      {row.ageing?.[bucket]?.amount
                        ? money(row.ageing[bucket].amount)
                        : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Clearing accounts
          </p>
          {accounts.map((account) => (
            <div
              key={account.accountId}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate text-muted-foreground">{account.name}</span>
              <span className="tabular-nums">{money(account.balance)}</span>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">
            The ledger&apos;s own balances. They should match the parcels above — where they
            do not, one of the two has something the other is missing.
          </p>
        </div>
      )}
    </Card>
  );
}
