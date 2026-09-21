"use client";
// coding-standard: maintained

import type { StoreCampaign } from "@/lib/storefront-client";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { DealStripView } from "@/components/storefront/home/deal-strip";

/**
 * The offer strip on a builder page. The storefront's own `DealStripView`, with
 * its interface wording in the shopper's chosen language — the heading too when
 * the section keeps the classic home's "Current offers" (`headingWord`) and the
 * merchant typed none. Loaded only through the island map.
 */
export function CampaignOffersIsland({
  base,
  campaigns,
  currency,
  heading,
  subheading,
  headingWord,
}: {
  base: string;
  campaigns: StoreCampaign[];
  currency?: string;
  heading?: string;
  subheading?: string;
  headingWord?: "campaignOffers";
}) {
  const { t } = useStorefrontUI();
  return (
    <DealStripView
      base={base}
      campaigns={campaigns}
      currency={currency}
      t={t}
      heading={heading ?? (headingWord ? t[headingWord] : undefined)}
      subheading={subheading}
    />
  );
}
