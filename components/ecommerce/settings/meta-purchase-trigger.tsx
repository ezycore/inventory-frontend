"use client";
// coding-standard: maintained

import { useState } from "react";
import { CheckCircle2, PackageCheck, Zap } from "lucide-react";
import type { MetaPurchaseTrigger } from "@/types/api";
import { OptionCard } from "@/ui/components/option-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/components/alert-dialog";

/**
 * When a `Purchase` is reported to Meta (backend `docs/plan/meta-pixel-capi.md` L2).
 *
 * **This is the one control on the page a merchant can get materially wrong**, and the cost is
 * invisible for weeks: Meta has no purchase-reversal event, so an order reported too early can
 * never be taken back. So the trade is stated on each option rather than hidden behind a
 * dropdown label, and changing it asks first.
 *
 * The confirm dialog is not ceremony. Switching the trigger is **not retroactive** — orders
 * already past the old trigger and not yet at the new one are never reported at all — and a
 * merchant who discovers that a month later has no way to recover those conversions.
 */

const OPTIONS: {
  value: MetaPurchaseTrigger;
  label: string;
  icon: typeof Zap;
  description: string;
}[] = [
  {
    value: "pending",
    label: "When the order is placed",
    icon: Zap,
    description:
      "Fastest signal, but counts orders you later reject or that come back undelivered. Good for prepaid stores.",
  },
  {
    value: "confirmed",
    label: "When you confirm the order",
    icon: CheckCircle2,
    description: "Counts orders you agreed to ship.",
  },
  {
    value: "delivered",
    label: "When the order is delivered",
    icon: PackageCheck,
    description:
      "Only counts orders that actually completed. Slowest, and the truest.",
  },
];

export function MetaPurchaseTriggerPicker({
  value,
  onChange,
}: {
  value: MetaPurchaseTrigger;
  onChange: (next: MetaPurchaseTrigger) => void;
}) {
  const [pending, setPending] = useState<MetaPurchaseTrigger | null>(null);

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            selected={value === option.value}
            // Selecting the current value is not a change, so it must not raise the dialog.
            onSelect={() =>
              value === option.value ? undefined : setPending(option.value)
            }
            label={option.label}
            description={option.description}
            icon={option.icon}
            // Its own element: two bare strings in the card's flex row merge into one
            // text node, and the gap between them disappears ("orderRecommended").
            badge={
              option.value === "confirmed" ? (
                <span className="font-normal text-muted-foreground">(Recommended)</span>
              ) : undefined
            }
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Applies to new orders only — changing this never re-reports or un-reports an order that
        already went through.
      </p>

      {value === "pending" ? (
        <p className="text-xs text-muted-foreground">
          On this setting a website order is reported during checkout, so{" "}
          <strong>Exclude from Meta</strong> only reliably applies to orders you create yourself.
        </p>
      ) : null}

      <AlertDialog open={pending !== null} onOpenChange={() => setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change when a purchase is counted?</AlertDialogTitle>
            <AlertDialogDescription>
              This applies to new orders only. Orders already in progress may not be reported to
              Meta at all under the new setting, and that cannot be corrected afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current setting</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) onChange(pending);
                setPending(null);
              }}
            >
              Change it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
