"use client";
// coding-standard: maintained

import { storeHref } from "@/lib/storefront-links";
import { SectionTitle } from "@/components/storefront/sf-bits";
import {
  Grid,
  ViewAll,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";

/**
 * The "New arrivals" block. Only classic shipped with it, and it has one look —
 * the other variants simply leave it out of their default section order rather
 * than restyling it.
 */
export function LatestSection({ base, currency, latest, t }: SectionProps) {
  if (latest.length === 0) return null;
  return (
    <div style={{ ...wrap, padding: "22px var(--pad) 10px" }}>
      <SectionTitle action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}>
        {t.newArrivals}
      </SectionTitle>
      <Grid products={latest} currency={currency} variant="compact" />
    </div>
  );
}
