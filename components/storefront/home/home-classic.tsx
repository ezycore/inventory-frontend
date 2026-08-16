"use client";
// coding-standard: maintained

import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";
import { Media, SectionTitle } from "@/components/storefront/sf-bits";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { HomeCollections } from "@/components/storefront/home/home-collections";
import {
  Grid,
  ViewAll,
  campaignBadge,
  heroBtns,
  wrap,
  type TplProps,
} from "@/components/storefront/home/home-shared";

/** Homepage template A: Classic — hero card, category chips, featured + latest. */
export function Classic(props: TplProps) {
  const {
    base,
    currency,
    featured,
    latest,
    categories,
    t,
    banner,
    heroSlides,
    heroBanner: hb,
  } = props;
  return (
    <div>
      {heroSlides?.length ? (
        <HeroCarousel slides={heroSlides} base={base} />
      ) : (
      <div style={{ ...wrap, padding: "var(--pad)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "var(--herocols)",
            gap: 26,
            alignItems: "center",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
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
      )}

      {categories.length > 0 ? (
        <div style={{ ...wrap, padding: "0 var(--pad) 8px" }}>
          {/* Layout is the merchant's (Customize → Collections), so the row
              itself owns it — see `home-collections.tsx`. */}
          <HomeCollections base={base} categories={categories} />
        </div>
      ) : null}

      {featured.length > 0 ? (
        <div style={{ ...wrap, padding: "22px var(--pad)" }}>
          <SectionTitle action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}>
            {t.featured}
          </SectionTitle>
          <Grid products={featured} currency={currency} variant="full" />
        </div>
      ) : null}

      {latest.length > 0 ? (
        <div style={{ ...wrap, padding: "22px var(--pad) 10px" }}>
          <SectionTitle action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}>
            {t.newArrivals}
          </SectionTitle>
          <Grid products={latest} currency={currency} variant="compact" />
        </div>
      ) : null}
    </div>
  );
}
