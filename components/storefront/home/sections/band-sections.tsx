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

/** Three bordered promise cards — the Hero Split row, unchanged. */
export function TrustRow({ t }: SectionProps) {
  const trust: { icon: IconName; t1: string; t2: string }[] = [
    { icon: "truck", t1: t.trust1t, t2: t.trust1s },
    { icon: "shield", t1: t.trust2t, t2: t.trust2s },
    { icon: "tag", t1: t.trust3t, t2: t.trust3s },
  ];
  return (
    <div style={{ ...wrap, padding: "0 var(--pad) 4px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--trustcols), minmax(0,1fr))", gap: "var(--gap)" }}>
        {trust.map((tr) => (
          <div
            key={tr.t1}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* The ACCENT on a soft disc, not a bare `--primary` glyph. These
                are reassurances, and reassurance is exactly what a second colour
                is for — a shop whose promises are painted in the same hue as its
                buy button has one colour doing two jobs. Falls back to the brand
                pair for a merchant who has set no accent, so nothing changes for
                them. */}
            <div
              style={{
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: "var(--radius-sm)",
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <Icon name={tr.icon} size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{tr.t1}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{tr.t2}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full-width tinted authenticity band, in the merchant's OWN words.
 *
 * Where `TrustRow` prints the platform's three built-in promises, this one reads
 * `store.trustBadges` — because "we are a licensed pharmacy" is a claim only the
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--trustcols), minmax(0,1fr))", gap: "var(--gap)" }}>
          {badges.map((b, i) => (
            <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 13, justifyContent: "center" }}>
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
 * Two promo tiles closing the page — a filled one and a tinted one.
 *
 * **Both grounds are built from `--primary`, which is the whole reason these
 * suit every theme without branching.** The filled tile is a gradient rather
 * than a flat fill: a large flat rectangle of brand colour is the single thing
 * that made the first grocery theme look unfinished, and a 135° ramp into a
 * darker mix of the same hue costs nothing and reads as designed. The second
 * tile is `--primary-soft` rather than `--card`, so the pair is one object in
 * two weights instead of "a coloured box and a bordered box".
 */
export function PromoTiles({ base, t }: SectionProps) {
  return (
    <div style={{ ...wrap, padding: "8px var(--pad) 14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "var(--promocols)", gap: "var(--gap)" }}>
        <Link
          href={storeHref(base, "/products")}
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "var(--radius-lg)",
            background:
              "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 68%, #000))",
            color: "var(--on-primary)",
            padding: "clamp(18px,2.2vw,26px)",
            minHeight: 136,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* A soft light bloom off the top-right corner. Purely decorative and
              deliberately `pointer-events: none` — it exists so the gradient has
              somewhere to travel to, which is what stops a two-stop ramp reading
              as a flat panel at small sizes. */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: -60,
              right: -44,
              width: 180,
              height: 180,
              borderRadius: 999,
              background: "rgba(255,255,255,0.13)",
              pointerEvents: "none",
            }}
          />
          <span style={{ position: "relative", fontSize: 12, opacity: 0.85, fontWeight: 600, letterSpacing: "0.04em" }}>{t.eidSale}</span>
          <span style={{ position: "relative", fontSize: 20, fontWeight: 700, lineHeight: 1.15, margin: "5px 0 11px", maxWidth: 260 }}>{t.promo1}</span>
          <span style={{ position: "relative", fontSize: 13, fontWeight: 600 }}>{t.shopNow} →</span>
        </Link>
        <Link
          href={storeHref(base, "/products")}
          style={{
            borderRadius: "var(--radius-lg)",
            background: "var(--primary-soft)",
            // A hairline in the brand colour. Flat tint alone had no weight at
            // all beside the gradient tile — it read as empty space with words
            // in it rather than as the second half of a pair.
            border: "1px solid color-mix(in srgb, var(--primary) 22%, transparent)",
            padding: "clamp(18px,2.2vw,26px)",
            minHeight: 136,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, letterSpacing: "0.04em" }}>{t.toolsClear}</span>
          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.15, margin: "5px 0 11px", maxWidth: 260, color: "var(--text)" }}>{t.promo2}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{t.shopNow} →</span>
        </Link>
      </div>
    </div>
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
 * catalogue. Reuses the merchant's banner copy (`heroBanner`) so it costs them
 * no extra writing, and falls back to the live campaign for its kicker exactly
 * as the heroes do.
 */
export function EditorialSplit(props: SectionProps) {
  const { base, t, banner, heroBanner: hb } = props;
  const Heading = props.primaryHeading ? "h1" : "h2";
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
          <span style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 }}>
            {hb?.badge || campaignBadge(props) || t.weeklyEdit}
          </span>
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
            {hb?.title || t.heroBt}
          </Heading>
          <p style={{ fontSize: 15.5, color: "var(--muted)", lineHeight: 1.65, margin: "0 0 26px", maxWidth: 420 }}>
            {hb?.subtitle || t.heroBs}
          </p>
          {heroBtns(base, t, t.shopWeekly, hb)}
        </div>
      </div>
    </div>
  );
}
