"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { money } from "@/components/storefront/format";
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

/** Icon fallbacks when a merchant left a trust badge's icon unset. */
const TRUST_ICONS: IconName[] = ["truck", "shield", "tag"];

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
        <div className="sf-trust-list">
          {badges.map((b, i) => (
            <div key={`${i}:${b.text}`} className="sf-trust-row">
              {/* The icon gets a solid disc so it survives the tint — an
                  `--accent` glyph on an `--accent-soft` ground is the one
                  pairing in the palette with almost no contrast. */}
              <span
                style={{
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "var(--accent)",
                  color: "var(--on-accent)",
                }}
              >
                <Icon name={(b.icon as IconName) || TRUST_ICONS[i % TRUST_ICONS.length]} size={17} />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: "var(--text)" }}>
                {b.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Live-campaign strip — loud, and only when a campaign is actually running.
 *
 * The urgency row every grocery app opens with. It is deliberately campaign-fed
 * rather than merchant-typed: a permanent "SALE!" banner is the fastest way for
 * a shop to stop being believed, so this disappears the day the campaign ends
 * without anyone having to remember to take it down.
 */
export function DealStrip(props: SectionProps) {
  const { base, campaigns, currency, t } = props;
  const live = campaigns.filter((c) => c.name);
  if (!live.length) return null;
  return (
    <div style={{ ...wrap, padding: "clamp(12px,2vw,20px) var(--pad)" }}>
      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(248px, 1fr)",
          gap: "var(--gap)",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: 6,
        }}
      >
        {live.map((c) => (
          <DealCard key={c._id ?? c.name} campaign={c} base={base} currency={currency} t={t} />
        ))}
      </div>
    </div>
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
}: {
  campaign: SectionProps["campaigns"][number];
  base: string;
  currency?: string;
  t: SectionProps["t"];
}) {
  const amount =
    c.type === "percentage" ? `${c.value}%` : money(c.value, currency);
  // Same formatting as `CampaignStrip`, so the two never disagree about when a
  // campaign ends. `toLocaleDateString(t.langCode)` localizes the numerals too,
  // which a hand-built "2d 4h" countdown could not do without inventing Bengali
  // unit abbreviations that are not in the glossary.
  const ends = c.endsAt
    ? new Date(c.endsAt).toLocaleDateString(t.langCode, {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <Link
      href={storeHref(base, "/products")}
      style={{
        scrollSnapAlign: "start",
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
            {t.campaignEnds} {ends}
          </span>
        ) : null}
      </span>
    </Link>
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
  const badge = campaignBadge(props);
  return (
    <div style={{ ...wrap, padding: "clamp(28px,5vw,56px) var(--pad)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "var(--splitcols)", gap: "clamp(20px,4vw,52px)", alignItems: "center" }}>
        <Media
          src={banner}
          alt=""
          label="lifestyle shot"
          ratio="4 / 5"
          radius={0}
          style={{ borderRadius: "var(--radius-lg)" }}
          {...bannerPhoto(hb)}
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
