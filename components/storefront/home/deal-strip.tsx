"use client";
// coding-standard: maintained

import Link from "next/link";
import { useCallback, useId, useRef, useState, type CSSProperties } from "react";
import type { StoreCampaign } from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";
import { storeHref } from "@/lib/storefront-links";
import { campaignEndsLabel } from "@/lib/storefront-campaign-date";
import { useHydrated } from "@/hooks/use-hydrated";
import { offerCampaigns } from "@/lib/storefront-builder/store-lists";
import { Icon } from "@/components/storefront/sf-icons";
import { money } from "@/components/storefront/format";

/**
 * Live-campaign strip — loud, and only when a campaign is actually running.
 *
 * The urgency row every grocery app opens with. It is deliberately campaign-fed
 * rather than merchant-typed: a permanent "SALE!" banner is the fastest way for
 * a shop to stop being believed, so this disappears the day the campaign ends
 * without anyone having to remember to take it down.
 *
 * Shared by the home page's `DealStrip` and the Storefront Builder's campaign
 * offers island. The heading is optional: a builder page shows the merchant's
 * own or none, and the carousel then takes its accessible name from `t`.
 */
export function DealStripView({
  base,
  campaigns,
  currency,
  t,
  heading,
  subheading,
  style,
}: {
  base: string;
  campaigns: readonly StoreCampaign[];
  currency?: string;
  t: Dict;
  heading?: string;
  /** A line under the heading, from a builder section. The classic home passes none. */
  subheading?: string;
  style?: CSSProperties;
}) {
  const live = offerCampaigns(campaigns);
  const scroller = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const [current, setCurrent] = useState(0);
  const go = useCallback((index: number) => {
    const el = scroller.current;
    if (!el) return;
    const next = Math.max(0, Math.min(index, live.length - 1));
    const card = el.children[next] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
    setCurrent(next);
  }, [live.length]);
  const syncCurrent = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const nearest = cards.reduce(
      (best, card, index) => {
        const distance = Math.abs(card.offsetLeft - el.offsetLeft - el.scrollLeft);
        return distance < best.distance ? { index, distance } : best;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    );
    setCurrent(nearest.index);
  }, []);
  if (!live.length) return null;
  const named = heading
    ? { "aria-labelledby": headingId }
    : { "aria-label": t.campaignOffers };
  return (
    <section className="sf-deals" {...named} style={style}>
      {heading || live.length > 1 ? (
        <div className="sf-deals-heading">
          {heading ? (
            <div>
              <h2 id={headingId}>{heading}</h2>
              {subheading ? (
                <p style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.6, margin: "6px 0 0", whiteSpace: "pre-line" }}>
                  {subheading}
                </p>
              ) : null}
            </div>
          ) : null}
          {live.length > 1 ? (
            <span className="sf-deals-position" aria-live="polite">
              {current + 1} / {live.length}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        ref={scroller}
        className="sf-deals-track"
        role="region"
        aria-roledescription="carousel"
        {...named}
        tabIndex={live.length > 1 ? 0 : undefined}
        onScroll={syncCurrent}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); go(current - 1); }
          if (event.key === "ArrowRight") { event.preventDefault(); go(current + 1); }
        }}
      >
        {live.map((c, index) => (
          <DealCard key={c._id ?? c.name} campaign={c} base={base} currency={currency} t={t} index={index} total={live.length} />
        ))}
      </div>
      {live.length > 1 ? (
        <div className="sf-deals-controls">
          <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label={t.previousOffer}>
            <Icon name="back" size={17} />
          </button>
          <div className="sf-deals-dots" aria-hidden="true">
            {live.map((c, index) => <span key={c._id ?? `${c.name}-${index}`} data-active={index === current} />)}
          </div>
          <button type="button" onClick={() => go(current + 1)} disabled={current === live.length - 1} aria-label={t.nextOffer}>
            <Icon name="chevR" size={17} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

/**
 * One live campaign, as a card: the discount as a medallion, the campaign name,
 * and its end date when the merchant set one.
 *
 * The medallion is the redesign. The old card stacked three lines of text at
 * three weights inside a flat block, so the number a shopper is actually
 * scanning for — "30%" — carried no more visual weight than the word "off".
 *
 * **There is deliberately no struck-through price here.** A campaign is a rule
 * ("20% off Rice"), not a priced item — it has no before-and-after to strike.
 * The struck compare-at price lives where the prices do, on `ProductCard`, and
 * a shop that wants a row of them puts a product grid under this strip.
 */
function DealCard({
  campaign: c,
  base,
  currency,
  t,
  index,
  total,
}: {
  campaign: StoreCampaign;
  base: string;
  currency?: string;
  t: Dict;
  index: number;
  total: number;
}) {
  const amount =
    c.type === "percentage" ? `${c.value}%` : money(c.value, currency);
  // Shared with `CampaignStrip`, so the two never disagree about when the same
  // campaign ends — including whether the year is worth showing. After
  // hydration only: it is printed in the shopper's zone, which the server cannot
  // know (see `campaignEndsLabel`).
  const hydrated = useHydrated();
  const ends = hydrated ? campaignEndsLabel(c.endsAt, t) : null;

  return (
    <Link
      href={storeHref(base, "/products")}
      className="sf-deal-card"
      aria-label={`${index + 1} / ${total}: ${c.name}, ${amount} ${t.campaignOff}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "var(--discount-soft)",
        color: "var(--discount)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
        minHeight: 88,
      }}
    >
      <span
        style={{
          flex: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 58,
          height: 58,
          padding: "0 8px",
          borderRadius: 999,
          background: "var(--discount)",
          color: "var(--on-primary)",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.05 }}>{amount}</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.9 }}>
          {t.campaignOff}
        </span>
      </span>
      <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{c.name}</span>
        {ends ? (
          <span
            style={{
              alignSelf: "flex-start",
              fontSize: 11,
              fontWeight: 600,
              background: "var(--card)",
              borderRadius: 999,
              padding: "3px 9px",
            }}
          >
            {ends}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
