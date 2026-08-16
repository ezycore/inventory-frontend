"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { HeaderSearchBar } from "@/components/storefront/header-search";
import { useStoreImageFit } from "@/services/storefront/use-image-fit";
import {
  campaignBadge,
  heroBtns,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";

/**
 * The hero family. A page uses exactly one of these, and which one is the
 * single biggest reason two shops read as different businesses — a grocery
 * shopper wants a search box above the fold where a fashion shopper wants a
 * full-bleed photograph.
 *
 * The first three are the pre-2026-08-12 Classic / Hero Split / Minimal heroes,
 * lifted out of their template components with their markup intact. **One
 * deliberate change:** their hardcoded corner radii now read `--radius-lg` /
 * `--radius-sm`, so a store on the Sharp or Round setting finally gets it up
 * here too. On the default (Soft) setting that moves the hero card from 14px to
 * 16px — the only visual difference the registry refactor introduces, and it is
 * a fix rather than drift.
 *
 * `heroSlides` short-circuits every static hero: an owner who built a carousel
 * gets it, whatever the section chose. That rule predates the registry and is
 * kept per-section rather than hoisted — `hero-fullbleed` deliberately uses the
 * slides differently (see below).
 */

/** Classic — bordered hero card, copy left, photo right. */
export function HeroCard(props: SectionProps) {
  const { base, t, banner, heroSlides, heroBanner: hb } = props;
  const imageFit = useStoreImageFit();
  if (heroSlides?.length) return <HeroCarousel slides={heroSlides} base={base} />;
  return (
    <div style={{ ...wrap, padding: "var(--pad)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "var(--herocols)",
          gap: 26,
          alignItems: "center",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "clamp(20px,4vw,40px)",
          overflow: "hidden",
        }}
      >
        <div>
          {/* The ACCENT, not the brand. A hero badge is the storefront's most
              purely informational chip — "Week 33 · harvest in", a campaign
              name — sitting directly above the buttons that are the brand
              colour. Painting both in `--primary` was the loudest reason a shop
              read as one hue rather than a palette. Falls back to the brand pair
              when the merchant has set no accent, so nothing changes for them. */}
          <span
            style={{
              display: "inline-block",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              fontSize: 11.5,
              fontWeight: 600,
              padding: "5px 11px",
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            {/* Owner copy wins; else the live campaign; else template copy. */}
            {hb?.badge || campaignBadge(props) || t.eidBadge}
          </span>
          <h1
            style={{
              fontSize: "var(--h1)",
              lineHeight: 1.08,
              fontWeight: 700,
              margin: "0 0 14px",
              letterSpacing: "-0.03em",
              whiteSpace: "pre-line",
            }}
          >
            {hb?.title || t.heroAt}
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 22px", maxWidth: 420 }}>
            {hb?.subtitle || t.heroAs}
          </p>
          {heroBtns(base, t, t.shopNow, hb)}
          <div style={{ display: "flex", gap: 18, marginTop: 24, flexWrap: "wrap" }}>
            {[t.genuine, t.fastDelivery, t.codBadge].map((label) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>
                <Icon name="check" size={15} /> {label}
              </div>
            ))}
          </div>
        </div>
        <Media src={banner} alt="" label="hero banner" ratio="4 / 3" fit={imageFit} />
      </div>
    </div>
  );
}

/** Hero Split — copy panel beside a full-height lifestyle shot. */
export function HeroSplit({ base, t, banner, heroSlides, heroBanner: hb }: SectionProps) {
  if (heroSlides?.length) return <HeroCarousel slides={heroSlides} base={base} />;
  return (
    <div style={{ ...wrap, padding: "var(--pad)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "var(--splitcols)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--card)",
        }}
      >
        <div style={{ padding: "clamp(26px,4vw,52px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: 11.5, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
            {/* The owner's banner "badge" renders as this section's kicker. */}
            {hb?.badge || t.weeklyEdit}
          </span>
          <h1 style={{ fontSize: "var(--h1)", lineHeight: 1.06, fontWeight: 700, margin: "12px 0 16px", letterSpacing: "-0.03em", whiteSpace: "pre-line" }}>
            {hb?.title || t.heroBt}
          </h1>
          <p style={{ fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 400 }}>
            {hb?.subtitle || t.heroBs}
          </p>
          {heroBtns(base, t, t.shopWeekly, hb)}
        </div>
        <Media
          src={banner}
          alt=""
          label="lifestyle shot"
          ratio="auto"
          radius={0}
          style={{ minHeight: "var(--splith)", aspectRatio: "auto" }}
        />
      </div>
    </div>
  );
}

/**
 * Open — the copy sits on the PAGE, with the picture in a tinted panel beside
 * it. No card, no border, no frame of any kind.
 *
 * **This exists because every other hero is a card**, and that turned out to be
 * the single loudest defect in a themed shop: a full-width `--card` block is the
 * first screen, so a store that chose a tinted ground showed near-white exactly
 * where its ground was supposed to introduce itself. Sampling the rendered
 * pixels of a designed page against ours is what caught it — the top strip of
 * the design read `#f5ead8` all the way across, ours read `#f9f4ed`, and every
 * DOM-level check had missed it because the gutters beside the card were right.
 *
 * So the shape is the point, not the decoration: `hero-card` frames the hero,
 * `hero-split` frames it and adds a picture, and this one refuses to frame it at
 * all. Choose it whenever the page's own colour is meant to be seen.
 */
export function HeroOpen(props: SectionProps) {
  const { base, t, banner, heroSlides, heroBanner: hb } = props;
  const imageFit = useStoreImageFit();
  if (heroSlides?.length) return <HeroCarousel slides={heroSlides} base={base} />;
  return (
    <div style={{ ...wrap, padding: "clamp(28px,5vw,64px) var(--pad) clamp(20px,3vw,40px)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "var(--herocols)",
          gap: "clamp(24px,4vw,48px)",
          alignItems: "center",
        }}
      >
        <div>
          {/* The accent, like every other informational chip — see the note on
              `HeroCard`'s badge. */}
          <span
            style={{
              display: "inline-block",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: 999,
              marginBottom: 18,
            }}
          >
            {hb?.badge || campaignBadge(props) || t.eidBadge}
          </span>
          <h1
            style={{
              fontSize: "var(--h1m)",
              lineHeight: 1.02,
              fontWeight: 700,
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
              whiteSpace: "pre-line",
            }}
          >
            {hb?.title || t.heroBt}
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "var(--muted)",
              lineHeight: 1.55,
              margin: "0 0 26px",
              maxWidth: "46ch",
            }}
          >
            {hb?.subtitle || t.heroBs}
          </p>
          {heroBtns(base, t, t.shopNow, hb)}
        </div>
        {/* A tinted panel rather than a bare photo: the picture needs an edge to
            sit against once there is no card providing one, and `--accent-soft`
            gives it one without introducing a second near-white surface beside
            the page. */}
        <div
          style={{
            background: "var(--accent-soft)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            padding: "clamp(14px,2vw,26px)",
          }}
        >
          <Media
            src={banner}
            alt=""
            label="lifestyle shot"
            ratio="4 / 3"
            fit={imageFit}
            radius={0}
            style={{ borderRadius: "var(--radius-md)" }}
          />
        </div>
      </div>
    </div>
  );
}

/** Minimal — centred manifesto, no image at all. */
export function HeroManifesto({ base, t }: SectionProps) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(48px,9vw,110px) var(--pad) clamp(36px,6vw,64px)", textAlign: "center" }}>
      <span style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500 }}>
        {t.minimalKicker}
      </span>
      <h1 style={{ fontSize: "var(--h1m)", lineHeight: 1.05, fontWeight: 700, margin: "18px 0 20px", letterSpacing: "-0.035em", whiteSpace: "pre-line" }}>
        {t.heroCt}
      </h1>
      <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, margin: "0 auto 28px", maxWidth: 460 }}>
        {t.heroCs}
      </p>
      <Link
        href={storeHref(base, "/products")}
        style={{ display: "inline-block", background: "var(--text)", color: "var(--card)", padding: "14px 32px", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 600 }}
      >
        {t.startShopping}
      </Link>
    </div>
  );
}

/**
 * Full-bleed — edge-to-edge photograph with the type laid over it.
 *
 * The editorial hero, and structurally unlike the other three: no card, no
 * border, no max-width, and the image is a background rather than a sibling of
 * the copy. It ignores `heroSlides` for the carousel and instead takes the FIRST
 * slide's image as its backdrop — a carousel inside a full-bleed hero fights the
 * one thing this section is for, which is a single confident picture.
 */
export function HeroFullBleed({ base, t, banner, heroSlides, heroBanner: hb }: SectionProps) {
  const slide = heroSlides?.[0];
  const image = slide?.image?.url || slide?.image?.mediumUrl || banner;
  return (
    <section
      style={{
        position: "relative",
        minHeight: "clamp(380px, 62vh, 640px)",
        display: "flex",
        alignItems: "flex-end",
        overflow: "hidden",
        background: image ? "var(--surface-2)" : "var(--surface)",
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      {/* Scrim, not a tint: type over an unknown photograph is unreadable
          without one, and the merchant's photo is genuinely unknown. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.62) 100%)",
        }}
      />
      <div style={{ ...wrap, position: "relative", padding: "clamp(28px,6vw,64px) var(--pad)" }}>
        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.82)", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 }}>
          {hb?.badge || slide?.badge || t.weeklyEdit}
        </span>
        <h1
          style={{
            fontSize: "var(--h1m)",
            lineHeight: 1.02,
            fontWeight: 700,
            color: "#fff",
            margin: "14px 0 18px",
            letterSpacing: "-0.035em",
            maxWidth: 620,
            whiteSpace: "pre-line",
          }}
        >
          {hb?.title || slide?.title || t.heroCt}
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", lineHeight: 1.55, margin: "0 0 26px", maxWidth: 460 }}>
          {hb?.subtitle || slide?.subtitle || t.heroCs}
        </p>
        <Link
          href={storeHref(base, "/products")}
          style={{
            display: "inline-block",
            background: "#fff",
            color: "#111",
            padding: "14px 34px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {hb?.primaryLabel || slide?.buttonLabel || t.startShopping}
        </Link>
      </div>
    </section>
  );
}

/**
 * Search-first — a dominant search box and the shop's delivery promise.
 *
 * The quick-commerce pattern: someone buying paracetamol or rice types a name,
 * they do not browse a lookbook. Reuses `HeaderSearch` so there is one search
 * implementation, not a second one that drifts.
 */
export function SearchHero({ t, store, categories }: SectionProps) {
  // Filter on TEXT, not array length. The merchant's three badge slots are all
  // persisted even when blank (`trimBadges` keeps the positions so they survive
  // a reload), so a store that never wrote one still arrives with three empty
  // rows — and `promises.length` was truthy for it, printing three bare ticks
  // with no words beside them.
  const promises = (store.trustBadges ?? []).filter((b) => b.text?.trim()).slice(0, 3);
  return (
    <section style={{ background: "var(--primary-soft)", padding: "clamp(26px,5vw,52px) 0" }}>
      <div style={{ ...wrap, padding: "0 var(--pad)", textAlign: "center" }}>
        <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
          {store.name}
        </h1>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <HeaderSearchBar categories={categories} />
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
          {(promises.length
            ? promises.map((b) => b.text)
            : [t.fastDelivery, t.genuine, t.codBadge]
          ).map((label) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>
              <Icon name="check" size={15} /> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
