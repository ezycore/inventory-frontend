"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import {
  campaignBadge,
  heroBtns,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";

/**
 * The three hero blocks, each exported on its own so a template can name the
 * one it wants (`templates/*.ts`) instead of a dispatcher branching on a
 * variant string. That branching is what would not have survived three more
 * designs — six `if`s inside one component, times six sections.
 *
 * `CardHero` and `SplitHero` yield to the owner's slide carousel when there is
 * one; `ManifestoHero` deliberately does not, and renders dictionary copy. That
 * is how the Minimal look shipped, and the Theme part warns before a template
 * that uses it hides a merchant's slides.
 */

export function CardHero(props: SectionProps) {
  if (props.heroSlides?.length) {
    return <HeroCarousel slides={props.heroSlides} base={props.base} />;
  }
  const { base, t, banner, heroBanner: hb } = props;
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
          borderRadius: "var(--r-lg)",
          padding: "clamp(20px,4vw,40px)",
          overflow: "hidden",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              background: "var(--primary-soft)",
              color: "var(--primary)",
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
        <Media src={banner} alt="" label="hero banner" ratio="4 / 3" />
      </div>
    </div>
  );
}

export function SplitHero(props: SectionProps) {
  if (props.heroSlides?.length) {
    return <HeroCarousel slides={props.heroSlides} base={props.base} />;
  }
  const { base, t, banner, heroBanner: hb } = props;
  return (
    <div style={{ ...wrap, padding: "var(--pad)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "var(--splitcols)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          background: "var(--card)",
        }}
      >
        <div style={{ padding: "clamp(26px,4vw,52px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: 11.5, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
            {/* The owner's banner "badge" renders as this template's kicker. */}
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

export function ManifestoHero({ base, t }: SectionProps) {
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
        style={{ display: "inline-block", background: "var(--text)", color: "var(--card)", padding: "14px 32px", borderRadius: "var(--r-sm)", fontSize: 14, fontWeight: 600 }}
      >
        {t.startShopping}
      </Link>
    </div>
  );
}
