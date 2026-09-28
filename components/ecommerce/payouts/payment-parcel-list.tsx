"use client";
// coding-standard: maintained

import { formatMoney } from "@/components/storefront/format";
import type { CourierParcel } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Checkbox } from "@/ui/components/checkbox";
import { cn } from "@/ui/lib/utils";

const KIND_LABEL: Record<CourierParcel["kind"], string> = {
  delivered: "Delivered",
  prepaid: "Prepaid",
  returned: "Returned",
};

/**
 * The open parcels a payment may cover — oldest first, one tappable row each (phone first:
 * the whole row is the hit target, not just the box). Each row shows what that parcel should
 * net: collected less the courier's charge, negative for a returned or prepaid parcel.
 */
export function PaymentParcelList({
  parcels,
  ticked,
  onToggle,
}: {
  parcels: CourierParcel[];
  ticked: string[];
  onToggle: (orderId: string, next: boolean) => void;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const money = (n: number) => formatMoney(n, currency);

  if (!parcels.length) {
    return (
      <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        No open parcels with this courier. Recording a payment now counts against any earlier
        shortfall first.
      </p>
    );
  }

  return (
    <ul className="max-h-64 divide-y overflow-y-auto rounded-md border">
      {parcels.map((parcel) => {
        const checked = ticked.includes(parcel.orderId);
        const id = `parcel-${parcel.orderId}`;
        return (
          <li key={parcel.orderId}>
            <label
              htmlFor={id}
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm"
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(v) => onToggle(parcel.orderId, v === true)}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{parcel.orderNumber}</span>
                <span className="block text-xs text-muted-foreground">
                  {KIND_LABEL[parcel.kind]} · {parcel.ageDays} d
                  {parcel.chargeSource === "quote" ? " · charge is an estimate" : ""}
                  {!parcel.settled ? " · will be settled" : ""}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 tabular-nums",
                  parcel.owed < 0 && "text-amber-700 dark:text-amber-500",
                )}
              >
                {money(parcel.owed)}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
