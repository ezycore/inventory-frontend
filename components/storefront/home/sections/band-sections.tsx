"use client";
// coding-standard: maintained

import { Media } from "@/components/storefront/sf-bits";
import { PromiseRows } from "@/components/storefront/home/promise-rows";
import { DealStripView } from "@/components/storefront/home/deal-strip";
import {
  bannerPhoto,
  campaignBadge,
  heroBtns,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";

/**
 * The full-width bands between product rows — the sections that carry a shop's
 * argument rather than its stock. What a shop puts here is most of what makes it
 * feel like a pharmacy rather than a boutique.
 */

/**
 * Full-width tinted authenticity band, in the merchant's OWN words.
 *
 * Reads `store.trustBadges` because "we are a licensed pharmacy" is a claim only the
 * merchant can make, and the sections that need it most (health, food) are
 * exactly the ones where a generic promise is worthless. Renders nothing when
 * they have written none.
 */
export function TrustBand({ store }: SectionProps) {
  const badges = (store.trustBadges ?? []).filter((b) => b.text?.trim());
  if (!badges.length) return null;
  return (
    // Tinted with `--accent-soft`, not `--surface`. A near-white band between
    // two near-white sections is a row of text with hairlines around it —
    // structurally a band, visually nothing. A tint is the cheapest way to make
    // it read as a deliberate stripe, and it works wherever the section is
    // placed: directly under the header (where it reads as a promise bar) or at
    // the foot of the page (where it reads as a sign-off).
    //
    // The ACCENT rather than the brand: these are promises, not calls to
    // action, and a full-width brand-tinted stripe under a header that is
    // already brand-coloured is how a two-colour design collapses back into
    // one. `--accent-soft` falls back to `--primary-soft` for a merchant who
    // has set no accent, so a shop that never picks one is unchanged.
    <section style={{ background: "var(--accent-soft)" }}>
      <div style={{ ...wrap, padding: "clamp(13px,1.8vw,19px) var(--pad)" }}>
        <PromiseRows promises={badges} />
      </div>
    </section>
  );
}

/**
 * Live-campaign strip — loud, and only when a campaign is actually running
 * (`DealStripView`, shared with the Storefront Builder).
 */
export function DealStrip({ base, campaigns, currency, t }: SectionProps) {
  return (
    <DealStripView
      base={base}
      campaigns={campaigns}
      currency={currency}
      t={t}
      heading={t.campaignOffers}
      style={{ ...wrap, padding: "clamp(12px,2vw,20px) var(--pad)" }}
    />
  );
}

/**
 * Editorial split — one large photograph beside a paragraph and a CTA.
 *
 * The magazine spread that makes a boutique read like a brand rather than a
 * catalogue. Shares the page's `banner` photo with the heroes (a focal-point
 * choice, not a copy one — see `bannerPhoto`), but its HEADLINE, SUBTITLE and
 * BUTTONS are its own (`t.editorialTitle`/`editorialSubtitle`), not
 * `heroBanner`'s. It used to fall back to the exact same `hb.title`/
 * `hb.subtitle`/CTA a hero on the same page was already showing, so a page
 * using both rendered one headline twice (QA-123). This section has no
 * per-merchant copy of its own yet — the fix is fixed, non-duplicating
 * copy rather than a second thing to write, which is the option this bug's
 * own writeup left open. The kicker still reads the live campaign, which is
 * data, not wording, so two sections agreeing on "Launch Sale" is not the
 * same failure.
 */
export function EditorialSplit(props: SectionProps) {
  const { base, t, banner, heroBanner: hb, store } = props;
  const Heading = props.primaryHeading ? "h1" : "h2";
  // QA-123: this section's badge is the live campaign, never `heroBanner`'s —
  // that is hero COPY. The photo below is shared on purpose (a focal choice).
  const badge = campaignBadge(props);
  const photo = bannerPhoto(hb);
  const bannerSrc = banner || photo.mobileSrc;
  return (
    <div style={{ ...wrap, padding: "clamp(28px,5vw,56px) var(--pad)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "var(--splitcols)", gap: "clamp(20px,4vw,52px)", alignItems: "center" }}>
        <Media
          src={bannerSrc}
          alt=""
          label="lifestyle shot"
          ratio="4 / 5"
          radius={0}
          style={{ borderRadius: "var(--radius-lg)" }}
          {...photo}
        />
        <div>
          {badge ? <span style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 }}>
            {badge}
          </span> : null}
          <Heading
            style={{
              fontSize: "var(--h1)",
              lineHeight: 1.08,
              fontWeight: 700,
              margin: "14px 0 16px",
              letterSpacing: "-0.03em",
              whiteSpace: "pre-line",
            }}
          >
            {t.editorialTitle || store.name}
          </Heading>
          <p style={{ fontSize: 15.5, color: "var(--muted)", lineHeight: 1.65, margin: "0 0 26px", maxWidth: 420 }}>
            {t.editorialSubtitle}
          </p>
          {heroBtns(base, t, t.shopNow)}
        </div>
      </div>
    </div>
  );
}
