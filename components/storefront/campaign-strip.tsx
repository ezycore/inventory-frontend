"use client";
// coding-standard: maintained

import Link from "next/link";
import type { StoreCampaign } from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
import { useStoreCampaigns } from "@/services/storefront/hooks";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * Promo strip under the header — surfaces the currently-running campaign so
 * shoppers know a sale is on (the backend only serves campaigns whose window
 * contains now). Storewide campaigns win the slot; the CTA links to the
 * campaign's scope (category → that category, otherwise all products).
 */
export function CampaignStrip({
  slug,
  base,
  currency,
  initialCampaigns,
}: {
  slug: string;
  base: string;
  currency?: string;
  initialCampaigns?: StoreCampaign[];
}) {
  const { t } = useStorefrontUI();
  const { data: campaigns } = useStoreCampaigns(slug, initialCampaigns);
  if (!campaigns?.length) return null;

  const campaign =
    campaigns.find((c) => c.scope === "storewide") ?? campaigns[0];
  const amount =
    campaign.type === "percentage"
      ? `${campaign.value}%`
      : money(campaign.value, currency);
  const href =
    campaign.scope === "category" && campaign.targets?.[0]
      ? storeHref(base, `/products?categoryId=${campaign.targets[0]}`)
      : storeHref(base, "/products");
  const ends = campaign.endsAt
    ? new Date(campaign.endsAt).toLocaleDateString(t.langCode, {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <Link
      href={href}
      className="sf-noprint"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        flexWrap: "wrap",
        background: "var(--primary-soft)",
        color: "var(--primary)",
        padding: "8px 16px",
        fontSize: 13,
        textAlign: "center",
      }}
    >
      <Icon name="tag" size={15} />
      <span style={{ fontWeight: 700 }}>{campaign.name}</span>
      <span style={{ fontWeight: 600 }}>
        — {amount} {t.campaignOff}
      </span>
      {ends ? (
        <span style={{ opacity: 0.75 }}>
          · {t.campaignEnds} {ends}
        </span>
      ) : null}
      <span style={{ fontWeight: 700, textDecoration: "underline" }}>
        {t.shopNow} →
      </span>
    </Link>
  );
}
