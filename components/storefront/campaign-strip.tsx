"use client";
// coding-standard: maintained

import Link from "next/link";
import type { StoreCampaign } from "@/lib/storefront-client";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { useStoreCampaigns, useStoreCategories, useStoreTags } from "@/services/storefront/hooks";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * Promo strip under the header — surfaces the currently-running campaign so
 * shoppers know a sale is on (the backend only serves campaigns whose window
 * contains now). Storewide campaigns win the slot; the CTA links to whatever the
 * campaign is scoped to — a category or sub-category page, a tag facet, or the
 * full listing.
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
  // Both levels of the tree, flattened: a campaign's target may be either.
  const { data: categories } = useStoreCategories(slug);
  const { data: tags } = useStoreTags(slug);
  if (!campaigns?.length) return null;

  const campaign =
    campaigns.find((c) => c.scope === "storewide") ?? campaigns[0];
  const amount =
    campaign.type === "percentage"
      ? `${campaign.value}%`
      : money(campaign.value, currency);
  // The campaign carries target IDs; the CTA needs a public URL, so each is
  // looked up in the live facet lists. An unresolvable target (hidden category,
  // retired tag) falls back to the full listing rather than a dead link.
  const targetId = campaign.targets?.[0];
  const allCategories = (categories ?? []).flatMap((c) => [c, ...(c.children ?? [])]);
  const href =
    (campaign.scope === "category" || campaign.scope === "subcategory") && targetId
      ? collectionHref(base, allCategories.find((c) => c._id === targetId))
      : campaign.scope === "tag" && targetId
        ? (() => {
            const tag = (tags ?? []).find((x) => x._id === targetId);
            return tag
              ? storeHref(base, `/products?tags=${encodeURIComponent(tag.slug)}`)
              : storeHref(base, "/products");
          })()
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
