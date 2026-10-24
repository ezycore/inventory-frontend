"use client";
// coding-standard: maintained
import { useLocale } from "next-intl";
import type { AppLocale } from "@/i18n/config";

/**
 * A prepaid credit's rate and purchase terms, as Mission Control sent them — shared by the SMS
 * credit card and the inbox's AI credit card.
 *
 * **The wording is never written in this repo.** It arrives from Mission Control with the
 * `version` stamped on the sale, so the merchant reads exactly what an admin reads out to them and
 * what a dispute would be decided on. Both languages come down together; the merchant's own
 * locale leads and the other is tucked into a `<details>` — BD consumer-protection practice
 * expects material terms in a language the buyer reads.
 */
export function CreditTermsBlock({
  headline,
  versionLabel,
  en,
  bn,
}: {
  /** The rate line, already translated ("৳0.45 per SMS"). */
  headline: string;
  /** "Terms 2026-08-02.1" — small, but it is what support quotes in a dispute. */
  versionLabel: string;
  en: string;
  bn: string;
}) {
  const isBangla = (useLocale() as AppLocale) === "bn";
  return (
    <div className="space-y-2 rounded-md border bg-muted/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{headline}</p>
        <span className="text-[10px] text-muted-foreground">{versionLabel}</span>
      </div>
      <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
        {isBangla ? bn : en}
      </p>
      <details>
        <summary className="cursor-pointer text-xs text-muted-foreground">
          {isBangla ? "English" : "বাংলা"}
        </summary>
        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
          {isBangla ? en : bn}
        </p>
      </details>
    </div>
  );
}
