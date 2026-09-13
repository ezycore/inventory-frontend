"use client";
// coding-standard: maintained

import { RefreshCw } from "lucide-react";

import { formatMoney } from "@/components/storefront/format";
import { providerLabel } from "@/components/ecommerce/payouts/helpers";
import { useHasPermission } from "@/hooks/use-has-permission";
import {
  useRefreshCourierCharges,
  type AdminStorefrontOrder,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { cn } from "@/ui/lib/utils";
import { longDate } from "./order-detail-helpers";

/**
 * What the courier charged for this parcel, and where its money is.
 *
 * Two facts the order page could not tell a merchant before, and the pair is the whole point of
 * the remittance work:
 *
 * 1. **The delivery cost was the dispatch quote**, taken before the courier weighed anything
 *    and with no COD fee in it at all. On a measured live order the quote was ৳70 and the
 *    courier billed ৳186.35 — so the order's margin was reported ৳116 better than it was.
 * 2. **COD sat in the books as cash** the moment it was collected, days before the courier
 *    handed it over.
 *
 * `source` is the provenance, ranked `quote < manual < webhook < api < payout`: a stronger
 * source overwrites a weaker one and never the other way round, which is why the history is
 * worth showing rather than just the latest figure.
 *
 * `supported: false` from a refresh is an answer, not a failure — Steadfast publishes no charge
 * anywhere in its API, and an invented number would be worse than an unknown one.
 */
const SOURCE_LABELS: Record<string, string> = {
  quote: "dispatch quote",
  manual: "entered by hand",
  webhook: "courier webhook",
  api: "courier API",
  payout: "payout statement",
};

export function OrderCourierMoney({ order }: { order: AdminStorefrontOrder }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const canManage = useHasPermission("storefront.orders.manage");
  const refresh = useRefreshCourierCharges();

  const courier = order.courier;
  const charges = courier?.charges;
  const remittance = courier?.remittance;
  // Nothing to say about a parcel that never went to a courier.
  if (!courier || (!charges && !remittance)) return null;

  const money = (n: number) => formatMoney(n, currency);
  const actual = charges?.actual;
  const quoted = charges?.quoted;
  const variance =
    actual?.totalFee !== undefined && quoted !== undefined
      ? Math.round((actual.totalFee - quoted) * 100) / 100
      : undefined;
  const history = charges?.history ?? [];
  // An api-level figure is the courier's own and cannot be improved by asking again.
  const canRefresh =
    canManage && courier.integration === "api" && charges?.source !== "payout";

  return (
    <Card className="p-5 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Courier charges</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {providerLabel(courier.provider)}
            {charges?.source ? ` · ${SOURCE_LABELS[charges.source] ?? charges.source}` : ""}
          </p>
        </div>
        {canRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh.mutate({ id: order._id })}
            disabled={refresh.isPending}
          >
            <RefreshCw
              className={cn("mr-2 h-3.5 w-3.5", refresh.isPending && "animate-spin")}
            />
            {refresh.isPending ? "Asking…" : "Ask the courier"}
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-1.5 text-sm">
        {quoted !== undefined && (
          <Row label="Quoted at dispatch" value={money(quoted)} muted />
        )}
        {actual ? (
          <>
            <Row label="Delivery fee" value={money(actual.deliveryFee)} muted />
            {/* Absent, not zero: a courier that itemises no COD fee has not said it was
                free — so the row is dropped rather than printed as 0. */}
            {actual.codFee !== undefined && (
              <Row label="COD fee" value={money(actual.codFee)} muted />
            )}
            {actual.additionalCharge !== undefined && (
              <Row label="Additional" value={money(actual.additionalCharge)} muted />
            )}
            {actual.discount !== undefined && actual.discount !== 0 && (
              <Row label="Discount" value={`−${money(actual.discount)}`} muted />
            )}
            <div className="flex items-center justify-between border-t pt-2 font-semibold">
              <span>Actually billed</span>
              <span className="tabular-nums">{money(actual.totalFee)}</span>
            </div>
            {actual.weightKg !== undefined && (
              <p className="text-xs text-muted-foreground">
                Billed on {actual.weightKg} kg.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            The courier has not published a charge for this parcel. The dispatch quote stands
            until a payout settles it.
          </p>
        )}

        {variance !== undefined && variance !== 0 && (
          <p
            className={cn(
              "pt-1 text-xs",
              variance > 0
                ? "text-amber-700 dark:text-amber-500"
                : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {variance > 0
              ? `${money(variance)} more than quoted.`
              : `${money(Math.abs(variance))} less than quoted.`}
          </p>
        )}
      </div>

      {/* Every figure this parcel has carried, with where it came from. Append-only on the
          backend, so it is a record of what was believed and when — not an edit log. */}
      {history.length > 1 && (
        <div className="mt-4 space-y-1 border-t pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            How this figure changed
          </p>
          {history.map((entry, index) => (
            <div
              key={`${entry.at ?? index}-${entry.source}`}
              className="flex items-center justify-between text-xs text-muted-foreground"
            >
              <span>
                {SOURCE_LABELS[entry.source] ?? entry.source}
                {entry.at ? ` · ${longDate(entry.at)}` : ""}
              </span>
              <span className="tabular-nums">{money(entry.totalFee)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Where this parcel's COD is. `not_collected` says nothing — the payment panel
          already covers an order nobody has collected against. */}
      {remittance && remittance.status !== "not_collected" && (
        <div className="mt-4 border-t pt-3 text-sm">
          {remittance.status === "with_courier" ? (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {money(remittance.clearingAmount ?? 0)}
              </span>{" "}
              is with {providerLabel(courier.provider)} — collected, not yet paid over.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Remitted
              {remittance.remittedAt ? ` on ${longDate(remittance.remittedAt)}` : ""}
              {remittance.payoutRef ? ` in ${remittance.payoutRef}` : ""}.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn(muted && "text-muted-foreground")}>{label}</span>
      <span className={cn("tabular-nums", muted && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}
