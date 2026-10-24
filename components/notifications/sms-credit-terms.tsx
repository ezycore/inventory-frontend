"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { CreditTermsBlock } from "@/components/shared/credit-terms-block";
import type { NotificationSettings } from "@/types/api";

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
 * Both languages come down together and the merchant's own locale leads
 * (`CreditTermsBlock`, shared with the inbox's AI credit card).
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
  return (
    <CreditTermsBlock
      headline={t("rate", { price: formatRate(terms.pricePerSegmentBdt) })}
      versionLabel={t("termsVersion", { version: terms.version })}
      en={terms.en}
      bn={terms.bn}
    />
  );
}
