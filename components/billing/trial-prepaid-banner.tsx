"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatCurrency } from "@/lib/currency";
import { isTrialPrepaid } from "@/lib/subscription-utils";
import { Card, CardContent } from "@/ui/components/card";
import type { Entitlement } from "@/types";

/**
 * "We have your money, and you keep your trial."
 *
 * A merchant who pays during their trial is in a state that looks, from every
 * other signal on this page, identical to one who has not paid: the
 * subscription is still `trialing`, the trial end date is unchanged, and no
 * invoice is outstanding. That is deliberate — paying early must not cost them
 * the days they already have — but it leaves the page silent about a payment
 * they just made, which is the one thing they came to check.
 *
 * So this says three things explicitly: the payment arrived, the trial still
 * runs to its original end date, and nothing further is due until then.
 *
 * Rendered from `trialPrepaid` on the entitlement, which Mission Control sets
 * while a settled prepayment is parked and clears when it is spent on the first
 * invoice — at which point the subscription is simply `active` and this banner
 * has nothing left to explain.
 */
export function TrialPrepaidBanner({ entitlement }: { entitlement: Entitlement }) {
  const t = useTranslations("settings.billing.trialPrepaid");
  const { formatDate } = useFormatters();
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  if (!isTrialPrepaid(entitlement)) return null;

  const amount =
    entitlement.amount != null
      ? formatCurrency(entitlement.amount, currency)
      : null;
  const plan = entitlement.planName ?? entitlement.planSlug ?? "";
  // Absent only on a mirror written before the field existed; the trial end is
  // the subject of the sentence, so fall back to the shorter copy rather than
  // printing a dash where a date belongs.
  const endsAt = entitlement.trialEndsAt
    ? formatDate(entitlement.trialEndsAt)
    : null;

  const bodyKey = !endsAt
    ? "bodyNoDate"
    : amount
      ? "body"
      : "bodyNoAmount";

  return (
    <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
      <CardContent className="flex items-start gap-3 py-4">
        <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0 text-emerald-600 dark:text-emerald-500" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
            {t("title")}
          </p>
          <p className="text-sm text-emerald-800 dark:text-emerald-400">
            {t(bodyKey, { amount: amount ?? "", plan, date: endsAt ?? "" })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
