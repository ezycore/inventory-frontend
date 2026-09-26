"use client";
// coding-standard: maintained

import { formatMoney } from "@/components/storefront/format";
import type { CourierMoneySummary } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Card } from "@/ui/components/card";
import { cn } from "@/ui/lib/utils";

type PayoutHistory = CourierMoneySummary["payouts"];

/**
 * What the couriers have kept, by kind, across the period — plus the two counts worth acting
 * on: payouts still `pending` (recorded, not yet in the books) and payouts that did not add up.
 *
 * The deduction kinds stay separate here for the same reason they do everywhere else: a
 * disbursement fee is not a delivery cost, and adding them together makes shipping look more
 * expensive than it is.
 */
export function PayoutHistorySummary({ data }: { data?: PayoutHistory }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const money = (n: number) => formatMoney(n, currency);
  const summary = data?.summary;

  if (!summary || summary.payouts === 0) {
    return (
      <Card className="p-5 shadow-none">
        <h3 className="text-sm font-semibold">Payouts in this period</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No remittances recorded yet.
        </p>
      </Card>
    );
  }

  const rows: { label: string; amount: number }[] = [
    { label: "Delivery", amount: summary.delivery },
    { label: "COD fee", amount: summary.codFee },
    { label: "Return charge", amount: summary.returnCharge },
    { label: "Payment charge", amount: summary.paymentCharge },
    { label: "Adjustment", amount: summary.adjustment },
    { label: "Extra courier charges", amount: summary.extraCharges ?? 0 },
  ].filter((row) => row.amount !== 0);

  return (
    <Card className="p-5 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Payouts in this period</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {summary.payouts} statement{summary.payouts === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums">{money(summary.net)}</p>
          <p className="text-xs text-muted-foreground">
            from {money(summary.gross)} collected
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">
              −{money(row.amount)}
            </span>
          </div>
        ))}
      </div>

      {(summary.pending > 0 || summary.unreconciled > 0) && (
        <div className="mt-4 flex flex-wrap gap-4 border-t pt-3 text-sm">
          {summary.pending > 0 && (
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{summary.pending}</span>{" "}
              awaiting confirmation
            </p>
          )}
          {summary.unreconciled > 0 && (
            <p className={cn("text-amber-700 dark:text-amber-500")}>
              <span className="font-semibold">{summary.unreconciled}</span> did not add up
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
