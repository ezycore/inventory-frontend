"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { thumbImageUrl } from "@/lib/storefront-image";
import { Media, SectionTitle } from "@/components/storefront/sf-bits";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { ProductCard } from "@/components/storefront/product-card";
import {
  ViewAll,
  heroBtns,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

/**
 * Blocks for the **Superstore** template — general retail and electronics.
 *
 * The shape of the whole look comes from one observation about how these shops
 * are actually used: shoppers arrive knowing roughly what department they want,
 * and they compare on price. So the hero shares its row with department
 * shortcuts instead of taking the full width, discounts get their own rail
 * above everything else, and the reassurance strip is one thin band rather than
 * three large cards — every vertical pixel here is competing with product.
 */

/**
 * Departments a shopper can jump straight into, beside the promo.
 *
 * One bordered panel with rows inside, not a grid of separate boxes. A shop
 * with two categories and a grid leaves most of the column empty and the row
 * reads as a layout bug; a single panel that is simply shorter than the promo
 * beside it reads as deliberate at any count.
 */
function ShortcutPanel({ base, categories, t }: SectionProps) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        alignSelf: "start",
      }}
    >
      <p
        style={{
          margin: 0,
          padding: "9px 12px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--muted)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {t.browseCats}
      </p>
      {categories.slice(0, 6).map((c) => (
        <Link
          key={c._id}
          href={storeHref(base, `/products?categoryId=${c._id}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "9px 12px",
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text)",
            lineHeight: 1.2,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              flex: "none",
              borderRadius: "var(--r-sm)",
              background: "var(--primary-soft)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              overflow: "hidden",
            }}
          >
            {thumbImageUrl(c.image) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbImageUrl(c.image)}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              c.name.trim().charAt(0).toUpperCase()
            )}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {c.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

/**
 * Promo on the left, department shortcuts on the right. Owner slides still win
 * — a merchant who built a carousel gets it full-width, because that is what
 * they were promised everywhere else.
 */
export function SuperstoreHero(props: SectionProps) {
  if (props.heroSlides?.length) {
    return <HeroCarousel slides={props.heroSlides} base={props.base} />;
  }
  const { base, t, banner, heroBanner: hb, categories } = props;
  const hasShortcuts = categories.length > 0;
  return (
    <div style={{ ...wrap, padding: "var(--pad)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: hasShortcuts ? "var(--herocols)" : "1fr",
          gap: "var(--gap)",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            position: "relative",
            borderRadius: "var(--r-md)",
            overflow: "hidden",
            background: "var(--card)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            minHeight: 240,
          }}
        >
          <Media
            src={banner}
            alt=""
            label="promotion"
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
          {/* Scrim so the copy stays readable over any uploaded artwork. */}
          <div
            style={{
              position: "relative",
              padding: "clamp(16px,3vw,28px)",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.15) 70%, transparent)",
              color: "#fff",
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: "var(--primary)",
                color: "var(--on-primary)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.03em",
                padding: "3px 9px",
                borderRadius: 999,
                marginBottom: 10,
              }}
            >
              {hb?.badge || t.eidBadge}
            </span>
            <h1
              style={{
                fontSize: "var(--h1)",
                lineHeight: 1.05,
                fontWeight: 700,
                margin: "0 0 8px",
                letterSpacing: "-0.025em",
                whiteSpace: "pre-line",
                maxWidth: 520,
              }}
            >
              {hb?.title || t.heroAt}
            </h1>
            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.45,
                margin: "0 0 14px",
                maxWidth: 440,
                opacity: 0.92,
              }}
            >
              {hb?.subtitle || t.heroAs}
            </p>
            {heroBtns(base, t, t.shopNow, hb)}
          </div>
        </div>
        {hasShortcuts && <ShortcutPanel {...props} />}
      </div>
    </div>
  );
}

/**
 * Discounted products only, price-forward. Renders nothing when nothing is on
 * offer — an empty "Deals" rail is worse than no rail, because it teaches
 * shoppers the shop never has any.
 */
export function DealsRail({ base, currency, featured, latest, t }: SectionProps) {
  const seen = new Set<string>();
  const deals = [...featured, ...latest].filter((p) => {
    if (seen.has(p._id)) return false;
    seen.add(p._id);
    return (
      typeof p.compareAtPrice === "number" &&
      typeof p.price === "number" &&
      p.compareAtPrice > p.price
    );
  });
  if (deals.length === 0) return null;
  return (
    <div style={{ ...wrap, padding: "14px var(--pad)" }}>
      <SectionTitle
        action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}
      >
        {t.deals}
      </SectionTitle>
      {/* Wraps rather than sitting in a fixed grid: a shop with one live
          discount would otherwise get a lone card beside four empty columns,
          which reads as a broken row instead of a short one. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--gap)" }}>
        {deals.slice(0, 10).map((p) => (
          <div key={p._id} style={{ flex: "1 1 160px", maxWidth: 240 }}>
            <ProductCard product={p} currency={currency} variant="compact" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Department tiles that wrap, rather than a strip that scrolls out of sight. */
export function DepartmentGrid({ base, categories, t }: SectionProps) {
  if (categories.length === 0) return null;
  return (
    <div style={{ ...wrap, padding: "10px var(--pad)" }}>
      <SectionTitle
        action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}
      >
        {t.browseCats}
      </SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(var(--bandcols), minmax(0,1fr))",
          gap: "var(--gap)",
        }}
      >
        {categories.map((c) => (
          <Link
            key={c._id}
            href={storeHref(base, `/products?categoryId=${c._id}`)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              padding: "14px 10px",
              textAlign: "center",
            }}
          >
            <Media
              src={thumbImageUrl(c.image)}
              alt={c.name}
              label={c.name}
              ratio="1 / 1"
              radius="var(--r-sm)"
              style={{ width: 64 }}
            />
            <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * One thin reassurance band. Shares `trustBadges` with the footer and the
 * three-card row, with the same per-slot fallback — a merchant writes their
 * promises once and every template that shows them uses those words.
 */
export function TrustStrip({ t, trustBadges }: SectionProps) {
  const previewBadges = useSfPreview((s) => s.badges);
  const saved = previewBadges ?? trustBadges ?? [];
  const defaults = [
    { icon: "truck" as IconName, title: t.trust1t },
    { icon: "shield" as IconName, title: t.trust2t },
    { icon: "tag" as IconName, title: t.trust3t },
  ];
  const items = defaults.map((d, i) => ({
    icon: (saved[i]?.icon as IconName) || d.icon,
    title: saved[i]?.text?.trim() || d.title,
  }));
  return (
    <div style={{ ...wrap, padding: "4px var(--pad) 10px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px 26px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
          padding: "10px 14px",
        }}
      >
        {items.map((it) => (
          <span
            key={it.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--muted)",
            }}
          >
            <span style={{ color: "var(--primary)", display: "flex" }}>
              <Icon name={it.icon} size={16} />
            </span>
            {it.title}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Dense arrivals rail — same card as everywhere, tighter. */
export function SuperstoreLatest({ base, currency, latest, t }: SectionProps) {
  if (latest.length === 0) return null;
  return (
    <div style={{ ...wrap, padding: "14px var(--pad) 20px" }}>
      <SectionTitle
        action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}
      >
        {t.newArrivals}
      </SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(var(--cols), minmax(0,1fr))",
          gap: "var(--gap)",
        }}
      >
        {latest.map((p) => (
          <ProductCard key={p._id} product={p} currency={currency} variant="compact" />
        ))}
      </div>
    </div>
  );
}
