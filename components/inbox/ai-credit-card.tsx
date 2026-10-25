"use client";
// coding-standard: maintained

import { CreditTermsBlock } from "@/components/shared/credit-terms-block";
import { useOrgCalendar } from "@/hooks/use-org-calendar";
import { formatDate } from "@/lib/format";
import { useInboxAiCredit, type InboxAiCredit } from "@/services/api";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { AlertTriangle, Wallet } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { useLocale, useTranslations } from "next-intl";

/**
 * AI credit on Inbox → Settings (backend plan §12 Phase 1b): the balance AI replies are charged
 * against, separate from SMS credit. Stored as whole paisa and shown the way a shop owner thinks
 * about it — ৳ and "≈ N replies left" (owner, 2026-10-24).
 *
 * Three states stop the AI, each with its own fix, so each is said plainly rather than folded into
 * one "unavailable": no price from Mission Control yet (talk to us), credit used up (top up), credit
 * expired (top up — a top-up extends the whole balance).
 */

/** Whole paisa → "৳12.34". Always Taka: Mission Control sells AI credit in BDT. */
export const formatPaisa = (paisa: number) => `৳${(paisa / 100).toFixed(2)}`;

type Problem = "no_rates" | "expired" | "empty" | null;

export const aiCreditProblem = (credit: InboxAiCredit): Problem => {
  if (!credit.rates) return "no_rates";
  if (credit.expired) return "expired";
  if (credit.paisa <= 0) return "empty";
  return null;
};

export function AiCreditCard() {
  const t = useTranslations("inbox.settings.credit");
  const locale = useLocale() as AppLocale;
  const { timezone } = useOrgCalendar();
  const { data: credit, isLoading } = useInboxAiCredit();

  if (isLoading || !credit) return <Skeleton className="h-28 w-full" />;
  const problem = aiCreditProblem(credit);

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">{t("title")}</h2>
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
        <div>
          <div className="text-3xl font-semibold">{formatPaisa(credit.paisa)}</div>
          {credit.expiresAt && !credit.expired && (
            <p className="text-xs text-muted-foreground">
              {t("validUntil", { date: formatDate(credit.expiresAt, "dd MMM yyyy", locale, timezone) })}
            </p>
          )}
        </div>
        {credit.repliesLeft !== null && problem === null && (
          <div>
            <div className="text-lg font-medium">{t("repliesLeft", { count: credit.repliesLeft })}</div>
            <p className="text-xs text-muted-foreground">{t("repliesLeftHint")}</p>
          </div>
        )}
      </div>

      {problem && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>{t(`problem.${problem}`)}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("topUp")}</p>

      {/* A range, never one number: a quick answer and an order step differ by 2× (owner 2026-10-25). */}
      {credit.terms && credit.replyPaisaRange && (
        <CreditTermsBlock
          headline={t("rate", { low: credit.replyPaisaRange.low, high: credit.replyPaisaRange.high })}
          versionLabel={t("termsVersion", { version: credit.terms.version })}
          en={credit.terms.en}
          bn={credit.terms.bn}
        />
      )}
    </Card>
  );
}
