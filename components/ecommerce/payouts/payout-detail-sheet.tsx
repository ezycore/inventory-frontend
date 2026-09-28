"use client";
// coding-standard: maintained

import Link from "next/link";
import { AlertTriangle, PackageX } from "lucide-react";

import { formatMoney } from "@/components/storefront/format";
import { useCourierPayout } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Skeleton } from "@/ui/components/skeleton";
import { StatusBadge } from "@/ui/components/status-badge";
import { cn } from "@/ui/lib/utils";
import {
  isUnmatchedLine,
  payoutShortfall,
  presentDeductions,
  providerLabel,
} from "./helpers";

/**
 * One payment received from a courier, parcel by parcel. New payments are recorded by hand
 * and posted at once; a `pending` row is legacy — the retired automatic ingest — and has no
 * action here (backend `courier-settlement-manual.md` D2).
 *
 * What this sheet is for is reading a statement against reality, so two shapes that look like
 * errors are rendered as ordinary facts:
 *
 * - a line with **no matching order** — merchants ship from the courier's own panel too, and
 *   the backend records such a line rather than rejecting the payout;
 * - a **return leg at zero collected** still carrying its full delivery fee — an RTO costs
 *   money and brings none in.
 *
 * `residual` and `unrecordedGross` are the server's own reconciliation against the clearing
 * balances. They are shown with the sentence that explains them, never recomputed here.
 */
export function PayoutDetailSheet({
  payoutId,
  onClose,
}: {
  payoutId: string | null;
  onClose: () => void;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { data: payout, isLoading } = useCourierPayout(payoutId ?? "");
  const money = (n: number) => formatMoney(n, currency);
  const { open: shortfallOpen, badge: shortfallBadge } = payout
    ? payoutShortfall(payout)
    : { open: 0, badge: undefined };

  return (
    <Sheet open={!!payoutId} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="flex h-full w-full flex-col gap-0 sm:max-w-[620px]">
        <SheetHeader>
          <SheetTitle>{payout ? payout.statementRef : "Payout"}</SheetTitle>
          <SheetDescription>
            {payout
              ? `${payout.courierName || providerLabel(payout.provider)}${payout.paymentMode ? ` · ${payout.paymentMode}` : ""}`
              : "Loading the statement…"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6">
          {isLoading || !payout ? (
            <div className="space-y-3 pt-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <StatusBadge
                  status={payout.status === "posted" ? "completed" : "pending"}
                  label={payout.status === "posted" ? "Posted" : "Pending"}
                />
                {shortfallBadge && (
                  <StatusBadge
                    status={
                      shortfallBadge === "Unreconciled"
                        ? "warning"
                        : "completed"
                    }
                    label={shortfallBadge}
                  />
                )}
              </div>

              {/* The money, in the order the statement reads. */}
              <div className="space-y-1.5 rounded-lg border p-4 text-sm">
                <Row label="Collected (gross)" value={money(payout.gross)} />
                {presentDeductions(payout.deductions).map((row) => (
                  <Row
                    key={row.key}
                    label={row.label}
                    value={`−${money(row.amount)}`}
                    muted
                  />
                ))}
                {!!payout.extraCharges && (
                  <Row
                    label="Extra courier charges"
                    value={`−${money(payout.extraCharges)}`}
                    muted
                  />
                )}
                {payout.expected !== undefined && (
                  <Row label="Expected" value={money(payout.expected)} muted />
                )}
                <div className="flex items-center justify-between border-t pt-2 font-semibold">
                  <span>Received</span>
                  <span className="tabular-nums">{money(payout.net)}</span>
                </div>
                {payout.note && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    {payout.note}
                  </p>
                )}
              </div>

              {/* Where the statement and this workspace disagree. Both figures are the
                  server's, and both are left visible rather than absorbed. */}
              {payout.residual > 0 && shortfallOpen === 0 && (
                <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                  Came up {money(payout.residual)} short — since{" "}
                  {shortfallBadge === "Written off"
                    ? "written off"
                    : "paid by a later payment"}
                  .
                  {payout.writeOffNote ? ` Reason: ${payout.writeOffNote}` : ""}
                </p>
              )}
              {(shortfallOpen > 0 || payout.unrecordedGross > 0) && (
                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                  <div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    Left to account for
                  </div>
                  {shortfallOpen > 0 && (
                    <p className="text-amber-900/90 dark:text-amber-200/90">
                      Short by {money(payout.residual)}, {money(shortfallOpen)}{" "}
                      still owed by this courier.
                      {(payout.residualSettled ?? 0) > 0
                        ? ` ${money(payout.residualSettled ?? 0)} of it has since been ${
                            (payout.residualWrittenOff ?? 0) > 0
                              ? "paid or written off"
                              : "paid"
                          }.`
                        : " It stays on their card until a later payment covers it or you write it off."}
                    </p>
                  )}
                  {payout.unrecordedGross > 0 && (
                    <p className="text-amber-900/90 dark:text-amber-200/90">
                      {money(payout.unrecordedGross)} more than the ticked
                      parcels — usually parcels shipped outside this workspace,
                      booked as an adjustment.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  Parcels ({payout.lines?.length ?? 0})
                </h4>
                <div className="divide-y rounded-lg border">
                  {(payout.lines ?? []).length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground">
                      No parcels were ticked on this payment — only the totals
                      above.
                    </p>
                  )}
                  {(payout.lines ?? []).map((line, index) => (
                    <div
                      key={`${line.consignmentRef ?? line.trackingCode ?? index}`}
                      className="flex items-start justify-between gap-3 p-3 text-sm"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {line.orderId && line.orderNumber ? (
                            <Link
                              href={`/ecommerce/orders/${line.orderId}`}
                              className="font-medium hover:underline"
                            >
                              {line.orderNumber}
                            </Link>
                          ) : (
                            <span className="flex items-center gap-1 font-medium text-muted-foreground">
                              <PackageX className="h-3.5 w-3.5" />
                              Not one of ours
                            </span>
                          )}
                          {line.legType === "return" && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Return
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {line.consignmentRef ?? line.trackingCode ?? "—"}
                          {isUnmatchedLine(line) &&
                            " · shipped from the courier's own panel"}
                        </p>
                        {line.note && (
                          <p className="text-xs text-muted-foreground">
                            {line.note}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 space-y-0.5 text-right">
                        <p className="tabular-nums">{money(line.collected)}</p>
                        {/* Absent is not zero: a courier that itemises no COD fee has not
                            told us it was free. */}
                        {line.deliveryFee !== undefined && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            delivery −{money(line.deliveryFee)}
                          </p>
                        )}
                        {line.codFee !== undefined && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            COD fee −{money(line.codFee)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
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
