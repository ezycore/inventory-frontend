"use client";
// coding-standard: maintained

import { formatMoney } from "@/components/storefront/format";
import type { CourierMoneySummary } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Card } from "@/ui/components/card";
import { cn } from "@/ui/lib/utils";
import { providerLabel } from "./helpers";

type Variance = CourierMoneySummary["variance"];

/**
 * What delivery was quoted at dispatch against what the courier actually billed — and what
 * that leaves of the shipping the shopper paid.
 *
 * `withoutActual` is stated on its own line and never folded into the average. A parcel with no
 * courier figure yet is one we do not know about, which is not the same as one we got right; the
 * whole reason this report exists is that a quote was being treated as the truth.
 *
 * The list is the parcels that LOST the most (worst margin first, profitable ones left out) — it
 * was the biggest quote misses, which hid a returned parcel billed in full on a close quote.
 *
 * Margin is what customers PAID for delivery against the courier's real bill, so a negative
 * number here is real. A parcel that came back pays nothing (only a paid return's door
 * collection or a kept advance) — counting the fee printed on the order credited every returned
 * parcel with money nobody paid (live, UriiBaba ORD-20260930-00016).
 */
export function ChargeVariance({ data }: { data?: Variance }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const money = (n: number) => formatMoney(n, currency);
  const summary = data?.summary;
  const outliers = data?.outliers ?? [];

  if (!summary || summary.parcels === 0) {
    return (
      <Card className="p-5 shadow-none">
        <h3 className="text-sm font-semibold">Quoted vs actual</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No parcels sent by courier in this period.
        </p>
      </Card>
    );
  }

  const marginNegative = summary.margin < 0;

  return (
    <Card className="p-5 shadow-none">
      <h3 className="text-sm font-semibold">Quoted vs actual</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {summary.parcels} parcel{summary.parcels === 1 ? "" : "s"} dispatched
        {summary.withoutActual > 0 &&
          ` · ${summary.withoutActual} with no courier figure yet`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Figure label="Quoted" value={money(summary.quoted)} />
        <Figure label="Actually billed" value={money(summary.actual)} />
        <Figure
          label="Difference"
          value={money(summary.variance)}
          tone={summary.variance > 0 ? "bad" : undefined}
        />
        <Figure
          label="Delivery margin"
          value={money(summary.margin)}
          tone={marginNegative ? "bad" : "good"}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Customers paid {money(summary.shippingReceived)} for delivery
        {summary.shippingReceived !== summary.shippingCharged &&
          ` of the ${money(summary.shippingCharged)} on these orders`}
        . Margin is what they paid, less what the courier really billed.
        {summary.returned > 0 &&
          ` ${summary.returned} parcel${summary.returned === 1 ? "" : "s"} came back — the courier still billed ${summary.returned === 1 ? "it" : "them"}, but the customer paid only what was taken at the door or in advance.`}
      </p>

      {summary.withoutActual > 0 && (
        <p className="mt-2 rounded-md border border-dashed p-2.5 text-xs text-muted-foreground">
          {summary.withoutActual} parcel
          {summary.withoutActual === 1 ? " is" : "s are"} still waiting for the courier&apos;s
          real charge and carry only the dispatch quote — they are not counted as accurate
          above.
        </p>
      )}

      {outliers.length > 0 && (
        <div className="mt-4 overflow-x-auto border-t pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Biggest losses on delivery
          </p>
          <p className="mb-2 text-xs text-muted-foreground">
            The {outliers.length === 1 ? "parcel" : `${outliers.length} parcels`} where the courier
            billed most above what the customer paid, worst first.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Order</th>
                <th className="py-2 pr-3 font-medium">Courier</th>
                <th className="py-2 pr-3 font-medium">Quoted</th>
                <th className="py-2 pr-3 font-medium">Billed</th>
                <th className="py-2 pr-3 font-medium">Customer paid</th>
                <th className="py-2 pr-3 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {outliers.map((row) => (
                <tr key={row.orderNumber} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{row.orderNumber}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {providerLabel(row.provider)}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                    {money(row.quoted)}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{money(row.actual)}</td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                    {money(row.shippingReceived)}
                    {row.returned && (
                      <span className="ml-1.5 text-xs">(came back)</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "py-2 pr-3 tabular-nums",
                      row.margin < 0 && "font-medium text-destructive",
                    )}
                  >
                    {money(row.margin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-base font-semibold tabular-nums",
          tone === "bad" && "text-destructive",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}
