"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { cardImageUrl, thumbImageUrl } from "@/lib/storefront-image";
import { Media } from "@/components/storefront/sf-bits";
import { money } from "@/components/storefront/format";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import {
  HeroCtaLink,
  ViewAll,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

/**
 * Blocks for the **Boutique** template — fashion and anything else sold on how
 * it looks rather than what it costs.
 *
 * The governing idea is the opposite of Superstore's: these shoppers are
 * browsing for something they did not know they wanted, so the page is paced
 * like a lookbook. Images run edge to edge, products are large and few, and
 * price is present but never shouted. There are deliberately no Add-to-cart
 * buttons on the home page — the decision happens on the product page, and
 * buttons on every tile would turn a lookbook back into a catalogue.
 */

/** Full-bleed opening image with the copy set over it. */
export function LookbookHero(props: SectionProps) {
  if (props.heroSlides?.length) {
    return <HeroCarousel slides={props.heroSlides} base={props.base} />;
  }
  const { base, t, banner, heroBanner: hb } = props;
  return (
    <div
      style={{
        position: "relative",
        minHeight: "clamp(420px, 62vh, 680px)",
        display: "flex",
        alignItems: "flex-end",
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      <Media
        src={banner}
        alt=""
        label=""
        ratio="auto"
        radius={0}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          aspectRatio: "auto",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          padding: "clamp(28px,6vw,72px) var(--pad)",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.66), rgba(0,0,0,0.12) 62%, transparent)",
          color: "#fff",
        }}
      >
        <div style={{ ...wrap, maxWidth: 720 }}>
          <span
            style={{
              fontSize: 11.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 500,
              opacity: 0.9,
            }}
          >
            {hb?.badge || t.weeklyEdit}
          </span>
          <h1
            style={{
              fontSize: "var(--h1m)",
              lineHeight: 1.02,
              fontWeight: 700,
              margin: "14px 0 14px",
              letterSpacing: "-0.03em",
              whiteSpace: "pre-line",
            }}
          >
            {hb?.title || t.heroCt}
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              margin: "0 0 26px",
              maxWidth: 460,
              opacity: 0.92,
            }}
          >
            {hb?.subtitle || t.heroCs}
          </p>
          <HeroCtaLink
            base={base}
            link={hb?.primaryLink}
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#111",
              padding: "13px 34px",
              borderRadius: "var(--r-sm)",
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {hb?.primaryLabel || t.startShopping}
          </HeroCtaLink>
        </div>
      </div>
    </div>
  );
}

/**
 * Collections as large image panels rather than chips. In a boutique the
 * category IS merchandising — "Sarees", "Outerwear" — so it gets the same
 * visual weight as a product.
 */
export function CollectionPanels({ base, categories, t }: SectionProps) {
  if (categories.length === 0) return null;
  return (
    <div style={{ ...wrap, padding: "clamp(40px,6vw,72px) var(--pad) 0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: "var(--gap)",
        }}
      >
        {categories.slice(0, 3).map((c) => (
          <Link
            key={c._id}
            href={storeHref(base, `/products?categoryId=${c._id}`)}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-end",
              minHeight: 300,
              borderRadius: "var(--r-md)",
              overflow: "hidden",
              background: "var(--surface)",
            }}
          >
            <Media
              src={thumbImageUrl(c.image)}
              alt={c.name}
              label=""
              ratio="auto"
              radius={0}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                aspectRatio: "auto",
              }}
            />
            <span
              style={{
                position: "relative",
                width: "100%",
                padding: "18px 20px",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.62), transparent)",
                color: "#fff",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
                {c.name}
              </span>
              <span style={{ fontSize: 12, opacity: 0.85, whiteSpace: "nowrap" }}>
                {t.viewAll} →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Large, quiet product tiles: picture, name, price. No badges and no buttons —
 * see the file header. Six is the cap because a lookbook that scrolls forever
 * stops being edited.
 */
function EditorialTiles({
  base,
  currency,
  products,
  heading,
  t,
}: Pick<SectionProps, "base" | "currency" | "t"> & {
  products: SectionProps["featured"];
  heading: string;
}) {
  if (products.length === 0) return null;
  return (
    <div style={{ ...wrap, padding: "clamp(40px,6vw,72px) var(--pad) 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "clamp(20px,3vw,32px)",
        }}
      >
        <h2
          style={{
            fontSize: "var(--h2)",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {heading}
        </h2>
        <ViewAll href={storeHref(base, "/products")} label={t.viewAll} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(var(--mincols), minmax(0,1fr))",
          gap: "clamp(18px,3vw,36px)",
        }}
      >
        {products.slice(0, 6).map((p) => (
          <Link
            key={p._id}
            href={storeHref(base, `/products/${p.slug}`)}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <Media
              src={cardImageUrl(p.images?.[0])}
              alt={p.name}
              label="product"
              ratio="3 / 4"
              radius="var(--r-sm)"
              style={{ marginBottom: 14 }}
            />
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 500,
                lineHeight: 1.35,
                marginBottom: 4,
              }}
            >
              {p.name}
            </span>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              {money(p.price, currency)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BoutiqueFeatured(props: SectionProps) {
  return (
    <EditorialTiles {...props} products={props.featured} heading={props.t.selected} />
  );
}

export function BoutiqueLatest(props: SectionProps) {
  return (
    <EditorialTiles {...props} products={props.latest} heading={props.t.newArrivals} />
  );
}

/**
 * The promises as one quiet centred line. A boutique that shouts about cash on
 * delivery in three bordered cards stops looking like a boutique — but the
 * information still has to be somewhere, so it is here, small.
 */
export function BoutiqueAssurance({ t, trustBadges }: SectionProps) {
  const previewBadges = useSfPreview((s) => s.badges);
  const saved = previewBadges ?? trustBadges ?? [];
  const defaults = [t.trust1t, t.trust2t, t.trust3t];
  const items = defaults.map((d, i) => saved[i]?.text?.trim() || d);
  return (
    <div style={{ ...wrap, padding: "clamp(48px,7vw,88px) var(--pad) clamp(20px,3vw,32px)" }}>
      <p
        style={{
          margin: 0,
          textAlign: "center",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 18px",
        }}
      >
        {items.map((it, i) => (
          <span key={it} style={{ display: "flex", gap: "8px 18px" }}>
            {i > 0 && <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>}
            {it}
          </span>
        ))}
      </p>
    </div>
  );
}
