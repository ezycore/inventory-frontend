"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
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
import { CalendarClock, CreditCard, ShieldCheck } from "lucide-react";
import type { AvailablePlan } from "@/types";

/**
 * Explains what a free trial actually involves before it starts — how long it
 * runs, what happens on the day it ends, and that no card is taken now.
 *
 * Shown only when the workspace is still trial-eligible; the trial is one-time
 * per workspace (`entitlement.trialUsed`), so once it is spent the caller offers
 * the paid plan directly instead of opening this. Controlled: a non-null `plan`
 * opens it.
 *
 * The "what happens at the end" line is the load-bearing one. A trial that ends
 * unpaid does not delete anything and does not silently keep working — the
 * workspace is confined to the billing page until a plan is paid for, which is
 * exactly the sort of thing a customer should learn before starting, not after.
 */
export function TrialInfoModal({
  plan,
  price,
  endsOn,
  onConfirm,
  onOpenChange,
}: {
  plan: AvailablePlan | null;
  price: string;
  /**
   * ISO date the trial would end, stamped by the caller when it opens this.
   * Passed in rather than derived here on purpose: reading the clock during
   * render is impure, and stamping it in the click handler that opens the
   * dialog both satisfies that and keeps the date steady while it is on screen.
   */
  endsOn: string | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("settings.billing.trialInfo");
  const { formatDate } = useFormatters();

  const days = plan?.trialDays ?? 0;

  return (
    <AlertDialog open={!!plan} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title", { days })}</AlertDialogTitle>
          <AlertDialogDescription>
            {plan ? t("body", { planName: plan.name, days }) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="space-y-3 text-sm">
          {endsOn && (
            <li className="flex gap-3">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>{t("endsOn", { date: formatDate(endsOn) })}</span>
            </li>
          )}
          <li className="flex gap-3">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>{t("noCard", { price })}</span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>{t("afterTrial")}</span>
          </li>
        </ul>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t("confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
