"use client";
// coding-standard: maintained

import { useState } from "react";
import Link from "next/link";
import type { StoreCampaign, StoreCampaignStrip } from "@/lib/storefront-client";
import { campaignHref } from "@/lib/storefront-links";
import { pageOf } from "@/lib/storefront-contact-message";
import { campaignEndsLabel } from "@/lib/storefront-campaign-date";
import {
  campaignStripAllowedOn,
  resolveCampaignStrip,
  stripPaddingInline,
  STRIP_FONT_SIZE,
  STRIP_PADDING_BLOCK,
} from "@/lib/storefront-strip-display";
import { useHydrated } from "@/hooks/use-hydrated";
import { useStoreCampaigns } from "@/services/storefront/hooks";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * Promo strip under the header — surfaces the currently-running campaign so
 * shoppers know a sale is on. Storewide campaigns win the slot; the CTA links to
 * whatever the campaign is scoped to — a category or sub-category page, a tag
 * facet, or the full listing.
 *
 * **Two independent gates, and they are not interchangeable:**
 *
 * 1. *Is a campaign running?* — decided entirely server-side by the campaign's
 *    own start/end window. The backend only serves campaigns whose window
 *    contains now, so an empty list means "no sale on" and the strip renders
 *    nothing. Checked FIRST, and no merchant setting can reach past it: a
 *    finished sale cannot be re-surfaced from the look-and-feel editor.
 * 2. *How and where does it show?* — the merchant's `nav.campaignStrip`
 *    (Customize → Campaign strip): on/off, which pages, which breakpoints,
 *    colours, size, spacing, dismissible. Presentation only.
 *
 * Defaults reproduce the hard-coded strip that shipped before those settings
 * existed, so a store that never opens the editor looks exactly as it did.
 */
export function CampaignStrip({
  slug,
  base,
  currency,
  config,
  initialCampaigns,
}: {
  slug: string;
  base: string;
  currency?: string;
  /** Saved `nav.campaignStrip`; the Customize draft overrides it below. */
  config?: StoreCampaignStrip;
  initialCampaigns?: StoreCampaign[];
}) {
  const { t } = useStorefrontUI();
  const pathname = useStorePathname();
  const hydrated = useHydrated();
  const { data: campaigns } = useStoreCampaigns(slug, initialCampaigns);
  // Live draft from the Customize editor wins so the strip repaints as it is
  // edited. `undefined` means "nothing drafted" — unlike the contact launcher
  // there is no meaningful `null` here, because switching the strip off is a
  // field on the draft rather than the absence of one.
  const draft = useSfPreview((s) => s.campaignStrip);
  const previewActive = useSfPreview((s) => s.active);
  const [dismissed, setDismissed] = useState(false);

  const strip = draft ?? config;
  // GATE 1 — the campaign's own schedule. Nothing below can override it.
  const campaign =
    campaigns?.find((c) => c.scope === "storewide") ?? campaigns?.[0];

  // Per-campaign key: a new or rescheduled sale re-shows a dismissed strip,
  // rather than staying hidden because the shopper closed a different one.
  const storageKey = `sf-camp-${slug}`;
  const msgKey = campaign ? `${campaign._id}|${campaign.endsAt ?? ""}` : "";
  // Same "store previous value" pattern as the announcement bar: re-checked
  // when the campaign changes, never looping, and only on the client (SSR has
  // no localStorage).
  const evalKey =
    hydrated && strip?.dismissible && msgKey ? `${storageKey} ${msgKey}` : null;
  const [lastEvalKey, setLastEvalKey] = useState<string | null>(null);
  if (evalKey !== lastEvalKey) {
    setLastEvalKey(evalKey);
    let next = false;
    if (evalKey) {
      try {
        next = localStorage.getItem(storageKey) === msgKey;
      } catch {
        /* storage disabled (private mode) — treat as not dismissed */
      }
    }
    setDismissed(next);
  }

  if (!campaign) return null;
  /* GATE 2 — merchant presentation: enabled, and which pages it runs on.
     These DO hide the strip inside the Customize preview, and should: the
     merchant is editing exactly these switches, so the preview has to show what
     turning one off actually does. Only the DISMISSED state below ignores the
     preview — that is a shopper's own action, not a setting, and letting it
     persist would leave the owner staring at a strip they cannot get back. */
  if (!campaignStripAllowedOn(strip, pageOf(pathname, base) === "home")) {
    return null;
  }
  if (strip?.dismissible && dismissed && !previewActive) return null;

  const { background, color, visibilityClass, dismissible, attrs } =
    resolveCampaignStrip(strip);

  const amount =
    campaign.type === "percentage"
      ? `${campaign.value}%`
      : money(campaign.value, currency);
  // The CTA goes to the campaign's OWN page, whatever it is scoped to.
  //
  // It used to resolve the first target id against the live facet lists — a
  // collection path for a category, a tag facet for a tag — and fall back to the
  // whole catalogue for everything else. That left the two scopes a real sale
  // most often uses, `product` and `storewide`, pointing at `/products`: the
  // shopper was told a sale was on and handed the entire shop to search through.
  // `/campaigns/<slug>` lists exactly what the campaign discounts, for every
  // scope, and only a campaign with no slug yet still falls back
  // (`campaignHref`).
  const href = campaignHref(base, campaign);
  // After hydration only: the label is printed in the SHOPPER's zone, which the
  // server (UTC) cannot know — rendering it there would mismatch the hydrating
  // client for every shopper outside UTC.
  const ends = hydrated ? campaignEndsLabel(campaign.endsAt, t) : null;

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, msgKey);
    } catch {
      /* ignore — the strip simply reappears next visit */
    }
    setDismissed(true);
  };

  return (
    <div
      className={["sf-noprint", visibilityClass].filter(Boolean).join(" ")}
      data-sf-campaign-strip=""
      {...attrs}
      style={{ position: "relative", background, color }}
    >
      <Link
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          flexWrap: "wrap",
          color: "inherit",
          // Tokens, not numbers — the stylesheet scales them per breakpoint.
          paddingBlock: STRIP_PADDING_BLOCK,
          paddingInline: stripPaddingInline(dismissible),
          fontSize: STRIP_FONT_SIZE,
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
            · {ends}
          </span>
        ) : null}
        <span style={{ fontWeight: 700, textDecoration: "underline" }}>
          {t.shopNow} →
        </span>
      </Link>

      {/* Outside the Link, not inside it: a <button> nested in an <a> is
          invalid HTML, and the browser's fix-up puts the dismiss control
          outside the anchor anyway — with its click still navigating. */}
      {dismissible ? (
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.dismiss}
          style={{
            position: "absolute",
            top: "50%",
            right: 8,
            transform: "translateY(-50%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            color: "inherit",
            opacity: 0.75,
            background: "transparent",
            border: 0,
            cursor: "pointer",
          }}
        >
          <Icon name="close" size={15} />
        </button>
      ) : null}
    </div>
  );
}
