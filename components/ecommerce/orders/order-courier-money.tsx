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
import { isFeatureOn } from "@/lib/feature-utils";
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
  payout: "payout statement (legacy)",
};

export function OrderCourierMoney({ order }: { order: AdminStorefrontOrder }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  // Who owes what is shown only to a merchant who records courier payments (business-modes D2):
  // with `accounts` off a delivered parcel would read "they owe it to you" forever.
  const tracksPayouts = isFeatureOn(
    useAuthStore((s) => s.user?.organization?.features),
    "accounts",
  );
  const canManage = useHasPermission("storefront.orders.manage");
  const refresh = useRefreshCourierCharges();

  const courier = order.courier;
  const charges = courier?.charges;
  const remittance = courier?.remittance;
  // A paid return (refused, delivery charge paid) is not a partial delivery, even when the courier
  // called it one — Steadfast reports it as `partial_delivered` (see backend `withDoorOutcome`).
  const paidReturn = !!courier?.paidReturn;
  const partialDelivery =
    !paidReturn && !!(courier?.partialDelivery || remittance?.partialDelivery);
  // Nothing to say about a parcel that never went to a courier.
  if (!courier || (!charges && !remittance && !partialDelivery && !paidReturn)) return null;

  const money = (n: number) => formatMoney(n, currency);
  const courierName = courier.name?.trim() || providerLabel(courier.provider);
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
            {courierName}
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
            until they do — it is the figure the courier balance subtracts meanwhile.
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

      {/* Where this parcel's money is, per backend courier-settlement-manual §2. Delivered
          COD is settled into the courier's account automatically; the courier owes it, less
          their charge, until the merchant records the payment that covers it. */}
      {/* A partial delivery: the customer kept some items, the rest come back. Shown until the
          refused items are recorded — "Return whole order" here would reverse the kept goods too. */}
      {/* Refused, but the customer paid at the door. Stated whether or not the shop keeps
          accounts: with accounts off it is the only place the money is written down. */}
      {paidReturn && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          The customer refused the parcel but paid{" "}
          {courier.collectedAmount !== undefined
            ? money(courier.collectedAmount)
            : "the delivery charge"}{" "}
          at the door. {courierName} holds it until they pay you.
        </p>
      )}
      {partialDelivery &&
        order.status !== "partially_returned" &&
        order.status !== "returned" && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            {courierName} reported a partial delivery
            {courier?.collectedAmount !== undefined
              ? ` and collected ${money(courier.collectedAmount)}`
              : ""}
            . The customer kept some items — record the ones that came back with{" "}
            <b>Return items</b>, not Return whole order.
          </p>
        )}
      {tracksPayouts && remittance?.status === "with_courier" && (
        <div className="mt-4 border-t pt-3 text-sm text-muted-foreground">
          {(remittance.clearingAmount ?? 0) > 0 ? (
            <p>
              <span className="font-medium text-foreground">
                {money(remittance.clearingAmount ?? 0)}
              </span>{" "}
              collected by {courierName} — they owe it to you, less their charge, until you
              record their payment.
            </p>
          ) : (
            <p>
              {courierName} will take its charge
              {actual ? ` (${money(actual.totalFee)})` : ""} out of a payment for this
              parcel.
            </p>
          )}
        </div>
      )}
      {tracksPayouts && remittance?.status === "remitted" && (
        <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">
          Covered by a payment from {courierName}
          {remittance.remittedAt ? ` on ${longDate(remittance.remittedAt)}` : ""}.
        </p>
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
