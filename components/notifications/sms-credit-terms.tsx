"use client";
// coding-standard: maintained
import { useLocale, useTranslations } from "next-intl";
import type { NotificationSettings } from "@/types/api";
import type { AppLocale } from "@/i18n/config";

/**
 * The rate and the purchase terms, on the merchant's own SMS credit card.
 *
 * **The wording is not written here.** It arrives from Mission Control on every
 * credit push, carrying the `version` that gets stamped on the invoice — so the
 * merchant reads exactly what an admin reads out to them over the phone, and
 * exactly what a chargeback would be decided on. A paragraph hardcoded in this
 * repo would be edited on its own schedule and the copy that drifted would be
 * the one the buyer was actually shown.
 *
 * The whole block is therefore absent until MC has pushed at least once. That
 * is deliberate: a price the product invented is worse than no price.
 *
 * Both languages come down together and the merchant's own locale leads, with
 * the other tucked into a `<details>`. BD consumer-protection practice expects
 * material terms in a language the buyer reads, and "top of the card, in their
 * language" is the difference between disclosed and technically-available.
 */

/** Taka, always — MC denominates the price in BDT regardless of org currency. */
const formatRate = (bdt: number) =>
  `৳${bdt.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function SmsCreditTerms({
  terms,
}: {
  terms: NonNullable<NotificationSettings["sms"]["terms"]>;
}) {
  const t = useTranslations("settings.notifications.sms");
  const locale = useLocale() as AppLocale;

  const isBangla = locale === "bn";
  const primary = isBangla ? terms.bn : terms.en;
  const secondary = isBangla ? terms.en : terms.bn;

  return (
    <div className="space-y-2 rounded-md border bg-muted/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          {t("rate", { price: formatRate(terms.pricePerSegmentBdt) })}
        </p>
        {/* Small, but present. It is what makes "you agreed to this" answerable
            a year later, and support quotes it when a merchant disputes. */}
        <span className="text-[10px] text-muted-foreground">
          {t("termsVersion", { version: terms.version })}
        </span>
      </div>

      <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
        {primary}
      </p>

      <details>
        <summary className="cursor-pointer text-xs text-muted-foreground">
          {isBangla ? "English" : "বাংলা"}
        </summary>
        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
          {secondary}
        </p>
      </details>
    </div>
  );
}
