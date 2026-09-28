"use client";
// coding-standard: maintained

import { Truck } from "lucide-react";

import { formatMoney } from "@/components/storefront/format";
import type { CourierBalances } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { cn } from "@/ui/lib/utils";
import { PaymentRecordDialog } from "./payment-record-dialog";
import { ShortfallWriteOffDialog } from "./shortfall-write-off-dialog";

/**
 * "Courier owes you" — one card per courier (backend `courier-settlement-manual.md` §4.3 C).
 *
 * `owed = Σ(collected − charge) + shortfall`, straight from the server. Negative means the
 * merchant owes the courier (returned parcels' charges). Each card carries its own **Record
 * payment received** button, pre-filled with that courier, because a payment always comes from
 * one courier. A card stacks full-width on a phone and tiles on wider screens.
 */
export function CourierBalanceCards({
  data,
  canManage,
}: {
  data?: CourierBalances;
  canManage: boolean;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const money = (n: number) => formatMoney(n, currency);
  const couriers = data?.couriers ?? [];

  if (!data || couriers.length === 0) {
    return (
      <Card className="p-5 shadow-none">
        <h3 className="text-sm font-semibold">Courier owes you</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing open with any courier. Delivered parcels appear here until you record the
          payment that covers them.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {couriers.map((balance) => {
        const parcels = data.parcels.filter((p) => p.courierKey === balance.courierKey);
        return (
          <Card key={balance.courierKey} className="gap-0 p-4 shadow-none">
            <div className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{balance.label}</span>
              </span>
              {/* A courier normally pays in 2–7 days; older than that is worth a call. */}
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  balance.oldestDays > 7
                    ? "font-medium text-amber-700 dark:text-amber-500"
                    : "text-muted-foreground",
                )}
              >
                oldest {balance.oldestDays} d
              </span>
            </div>

            <p
              className={cn(
                "mt-2 text-2xl font-bold tabular-nums",
                balance.owed < 0 && "text-amber-700 dark:text-amber-500",
              )}
            >
              {money(balance.owed)}
            </p>
            <p className="text-xs text-muted-foreground">
              {balance.owed < 0 ? "you owe the courier · " : "owed to you · "}
              {balance.parcels} parcel{balance.parcels === 1 ? "" : "s"}
            </p>

            <div className="mt-3 space-y-1 text-sm">
              <Line label="Collected" value={money(balance.collected)} />
              <Line label="Their charges" value={`−${money(balance.charges)}`} />
              {balance.shortfall > 0 && (
                <Line
                  label="Short from earlier payments"
                  value={money(balance.shortfall)}
                  warn
                />
              )}
            </div>

            {canManage && (
              <div className="mt-4 flex flex-col gap-2">
                <PaymentRecordDialog
                  balance={balance}
                  parcels={parcels}
                  trigger={<Button className="w-full">Record payment received</Button>}
                />
                {balance.shortfall > 0 && (
                  <ShortfallWriteOffDialog balance={balance} />
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function Line({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        warn ? "text-amber-700 dark:text-amber-500" : "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
