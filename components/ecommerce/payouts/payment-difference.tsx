"use client";
// coding-standard: maintained

import { formatMoney } from "@/components/storefront/format";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Label } from "@/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@/ui/components/radio-group";
import { cn } from "@/ui/lib/utils";

export type ShortReason = "still_owed" | "courier_charges";

/**
 * Expected / received / difference for a courier payment, and — when it is short — why
 * (backend `courier-settlement-manual.md` D3). A difference never blocks saving.
 *
 * "Extra courier charges" books the gap on the payment as a delivery charge; it is never
 * split across the parcels, because nothing says which parcel it belongs to. If the
 * merchant does know (a statement listing each parcel's fee), fixing that order's courier
 * cost first is the precise route and makes the payment match outright.
 */
export function PaymentDifference({
  expected,
  received,
  parcelCount,
  shortfall,
  reason,
  onReasonChange,
}: {
  expected: number;
  received: number;
  parcelCount: number;
  /** The courier's existing shortfall — extra money recovers it first. */
  shortfall: number;
  reason: ShortReason;
  onReasonChange: (next: ShortReason) => void;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const money = (n: number) => formatMoney(n, currency);
  const difference = Math.round((received - expected) * 100) / 100;
  const matches = Math.abs(difference) < 0.01;
  const short = difference < 0;
  const recovers =
    !short && !matches && shortfall > 0 && difference <= shortfall + 0.005;

  return (
    <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
      <Row
        label={`Expected (${parcelCount} parcel${parcelCount === 1 ? "" : "s"})`}
        value={money(expected)}
      />
      <Row label="Received" value={money(received)} />
      <div
        className={cn(
          "flex items-center justify-between border-t pt-1.5 font-semibold",
          !matches && !recovers && "text-amber-700 dark:text-amber-500",
        )}
      >
        <span>
          {matches
            ? "Matches"
            : short
              ? "Short by"
              : recovers
                ? "Recovers earlier shortfall"
                : "More than expected"}
        </span>
        <span className="tabular-nums">{money(Math.abs(difference))}</span>
      </div>

      {short && !matches && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium">
            What is the {money(-difference)}?
          </p>
          <RadioGroup
            value={reason}
            onValueChange={(v) => onReasonChange(v as ShortReason)}
            className="gap-2"
          >
            <div className="flex items-start gap-2">
              <RadioGroupItem
                value="courier_charges"
                id="short-charges"
                className="mt-0.5"
              />
              <Label
                htmlFor="short-charges"
                className="font-normal leading-snug"
              >
                Extra courier charges — they took more than the parcels&apos;
                charges (COD fee, re-weighing). Booked as delivery cost on this
                payment.
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem
                value="still_owed"
                id="short-owed"
                className="mt-0.5"
              />
              <Label htmlFor="short-owed" className="font-normal leading-snug">
                Still owed — the courier will pay it later. Stays on their card
                until paid or written off.
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
      {!short && !matches && (
        <p className="pt-1 text-xs text-muted-foreground">
          {recovers
            ? `Counted against the earlier shortfall (${money(shortfall)}).`
            : shortfall > 0
              ? `Covers the earlier shortfall (${money(shortfall)}) first; anything beyond is booked as an adjustment.`
              : "Saved anyway, booked as an adjustment — usually parcels shipped from the courier's own panel."}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
