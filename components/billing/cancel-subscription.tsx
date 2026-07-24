"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarX } from "lucide-react";
import { useCancelSubscription } from "@/services/api";
import { useFormatters } from "@/hooks/use-formatters";
import { getScheduledCancellation } from "@/lib/subscription-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/components/alert-dialog";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import type { Entitlement } from "@/types";

/** Whether this entitlement is on a live plan the user could cancel. */
export function isCancelable(entitlement: Entitlement): boolean {
  const sub = entitlement.subscriptionStatus ?? entitlement.status;
  return sub === "active" || sub === "trialing";
}

/**
 * Standing at-period-end cancellation notice + a one-click Resume. Renders
 * nothing until a cancel is actually scheduled. Kept separate from the plan-change
 * banner: a cancel ends the subscription, it does not move to another plan.
 */
export function ScheduledCancellationBanner({
  entitlement,
}: {
  entitlement: Entitlement;
}) {
  const t = useTranslations("settings.billing.cancel");
  const { formatDate } = useFormatters();
  const resume = useCancelSubscription();
  const scheduled = getScheduledCancellation(entitlement);
  if (!scheduled) return null;

  const onResume = () =>
    resume.mutate(
      { resume: true },
      { onSuccess: () => toast.success(t("toasts.resumed")) },
    );

  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CalendarX className="mt-0.5 size-5 flex-shrink-0 text-red-600 dark:text-red-500" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-900 dark:text-red-300">
              {t("bannerTitle")}
            </p>
            <p className="text-sm text-red-800 dark:text-red-400">
              {t("bannerBody", { date: formatDate(scheduled.effectiveAt) })}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="shrink-0"
          disabled={resume.isPending}
          onClick={onResume}
        >
          {t("resumeButton")}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * "Cancel subscription" control for the plan card. Confirms in an AlertDialog
 * (the outcome is destructive: access is lost at period end), then schedules the
 * at-period-end cancel. Renders nothing when the plan can't be cancelled or a
 * cancel is already scheduled (the banner owns Resume in that state).
 */
export function CancelSubscriptionButton({
  entitlement,
}: {
  entitlement: Entitlement;
}) {
  const t = useTranslations("settings.billing.cancel");
  const { formatDate } = useFormatters();
  const cancel = useCancelSubscription();

  if (!isCancelable(entitlement)) return null;
  if (getScheduledCancellation(entitlement)) return null;

  const periodEnd = entitlement.currentPeriodEnd
    ? formatDate(entitlement.currentPeriodEnd)
    : null;

  const onConfirm = () =>
    cancel.mutate(
      {},
      {
        onSuccess: (res) => {
          if (res.data?.mode !== "scheduled") return;
          const at = res.data.cancelAt ?? entitlement.currentPeriodEnd;
          toast.success(
            t("toasts.scheduled", { date: at ? formatDate(at) : "—" }),
          );
        },
      },
    );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={cancel.isPending}
        >
          {t("button")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {periodEnd
              ? t("confirmBody", { date: periodEnd })
              : t("confirmBodyNoDate")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("keep")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {t("confirmAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
