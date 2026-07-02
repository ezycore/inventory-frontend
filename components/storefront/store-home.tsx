"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import { storeHref } from "@/lib/storefront-links";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { ProductCard } from "@/components/storefront/product-card";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { Media, SectionTitle } from "@/components/storefront/sf-bits";
import { money } from "@/components/storefront/format";

const wrap: CSSProperties = { maxWidth: "var(--maxw)", margin: "0 auto", width: "100%" };

type TplName = "classic" | "hero-split" | "minimal";
const HOME_VARIANTS: readonly string[] = ["classic", "hero-split", "minimal"];

/**
 * Storefront homepage — renders one of three admin-selectable templates
 * (Classic / Hero Split / Minimal) from `templates.home`, server-rendered for
 * SEO. Live brand-colour preview is handled globally by the shell (it reads the
 * preview store), so the whole page — not just this content — repaints.
 */
export function StoreHome({
  store,
  base,
  featured,
  latest,
  categories,
  campaigns,
}: {
  store: StorefrontStore;
  base: string;
  featured: CatalogProduct[];
  latest: CatalogProduct[];
  categories: CatalogCategory[];
  campaigns: StoreCampaign[];
}) {
  const { t } = useStorefrontUI();
  const currency = store.currency;
  // Live draft from the admin Customize editor (only set under ?preview=1) wins,
  // so picking Classic/Hero-Split/Minimal repaints the homepage instantly.
  const previewHome = useSfPreview((s) => s.home);
  const tpl = HOME_VARIANTS.includes(previewHome ?? "")
    ? (previewHome as TplName)
    : resolveTemplates(store).home;

  const banner = store.banner?.mediumUrl || store.banner?.url;
  const shared = { base, currency, featured, latest, categories, campaigns, t, banner };

  if (tpl === "hero-split") return <HeroSplit {...shared} />;
  if (tpl === "minimal") return <Minimal {...shared} />;
  return <Classic {...shared} />;
}

interface TplProps {
  base: string;
  currency?: string;
  featured: CatalogProduct[];
  latest: CatalogProduct[];
  categories: CatalogCategory[];
  campaigns: StoreCampaign[];
  t: ReturnType<typeof useStorefrontUI>["t"];
  banner?: string;
}

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
      {label} →
    </Link>
  );
}

function Grid({
  products,
  currency,
  variant,
}: {
  products: CatalogProduct[];
  currency?: string;
  variant?: "full" | "compact";
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(var(--cols), minmax(0,1fr))",
        gap: "var(--gap)",
      }}
    >
      {products.map((p) => (
        <ProductCard key={p._id} product={p} currency={currency} variant={variant} />
      ))}
    </div>
  );
}

function heroBtns(base: string, t: TplProps["t"], primaryLabel: string) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Link
        href={storeHref(base, "/products")}
        style={{
          background: "var(--primary)",
          color: "var(--on-primary)",
          padding: "12px 24px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {primaryLabel}
      </Link>
      <Link
        href={storeHref(base, "/products")}
        style={{
          color: "var(--text)",
          border: "1px solid var(--border-strong)",
          padding: "12px 22px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {t.browseCats}
      </Link>
    </div>
  );
}

/* ---------------- Template A: Classic ---------------- */
function Classic({ base, currency, featured, latest, categories, t, banner }: TplProps) {
  return (
    <div>
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
              {t.eidBadge}
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
              {t.heroAt}
            </h1>
            <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 22px", maxWidth: 420 }}>
              {t.heroAs}
            </p>
            {heroBtns(base, t, t.shopNow)}
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

      {categories.length > 0 ? (
        <div style={{ ...wrap, padding: "0 var(--pad) 8px" }}>
          <div style={{ display: "flex", gap: 11, overflowX: "auto", paddingBottom: 6 }}>
            {categories.map((c) => (
              <Link
                key={c._id}
                href={storeHref(base, `/products?categoryId=${c._id}`)}
                style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 84 }}
              >
                <Media label="" ratio="1 / 1" radius={11} style={{ width: 60, height: 60 }} />
                <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--text)", textAlign: "center", lineHeight: 1.2 }}>
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
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

/* ---------------- Template B: Hero Split ---------------- */
function HeroSplit({ base, currency, featured, t, banner }: TplProps) {
  const trust: { icon: IconName; t1: string; t2: string }[] = [
    { icon: "truck", t1: t.trust1t, t2: t.trust1s },
    { icon: "shield", t1: t.trust2t, t2: t.trust2s },
    { icon: "tag", t1: t.trust3t, t2: t.trust3s },
  ];
  return (
    <div>
      <div style={{ ...wrap, padding: "var(--pad)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "var(--splitcols)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--card)",
          }}
        >
          <div style={{ padding: "clamp(26px,4vw,52px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: 11.5, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
              {t.weeklyEdit}
            </span>
            <h1 style={{ fontSize: "var(--h1)", lineHeight: 1.06, fontWeight: 700, margin: "12px 0 16px", letterSpacing: "-0.03em", whiteSpace: "pre-line" }}>
              {t.heroBt}
            </h1>
            <p style={{ fontSize: 15.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 400 }}>
              {t.heroBs}
            </p>
            {heroBtns(base, t, t.shopWeekly)}
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

      <div style={{ ...wrap, padding: "0 var(--pad) 4px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--trustcols), minmax(0,1fr))", gap: "var(--gap)" }}>
          {trust.map((tr) => (
            <div key={tr.t1} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 11, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: "var(--primary)" }}>
                <Icon name={tr.icon} size={22} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{tr.t1}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{tr.t2}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {featured.length > 0 ? (
        <div style={{ ...wrap, padding: "22px var(--pad)" }}>
          <SectionTitle action={<ViewAll href={storeHref(base, "/products")} label={t.viewAll} />}>
            {t.weeklyPicks}
          </SectionTitle>
          <Grid products={featured} currency={currency} variant="compact" />
        </div>
      ) : null}

      <div style={{ ...wrap, padding: "8px var(--pad) 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "var(--promocols)", gap: "var(--gap)" }}>
          <Link href={storeHref(base, "/products")} style={{ borderRadius: 14, background: "var(--primary)", color: "var(--on-primary)", padding: "clamp(20px,3vw,32px)", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, letterSpacing: "0.04em" }}>{t.eidSale}</span>
            <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15, margin: "6px 0 12px", maxWidth: 260 }}>{t.promo1}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.shopNow} →</span>
          </Link>
          <Link href={storeHref(base, "/products")} style={{ borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)", padding: "clamp(20px,3vw,32px)", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, letterSpacing: "0.04em" }}>{t.toolsClear}</span>
            <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15, margin: "6px 0 12px", maxWidth: 260, color: "var(--text)" }}>{t.promo2}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{t.shopNow} →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Template C: Minimal ---------------- */
function Minimal({ base, currency, featured, categories, t }: TplProps) {
  const picks = featured.slice(0, 6);
  return (
    <div>
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
          style={{ display: "inline-block", background: "var(--text)", color: "var(--card)", padding: "14px 32px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}
        >
          {t.startShopping}
        </Link>
      </div>

      {categories.length > 0 ? (
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 var(--pad) clamp(40px,6vw,64px)" }}>
          <div style={{ display: "flex", gap: 26, justifyContent: "center", flexWrap: "wrap", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "18px 0" }}>
            {categories.map((c) => (
              <Link key={c._id} href={storeHref(base, `/products?categoryId=${c._id}`)} style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", whiteSpace: "nowrap" }}>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 var(--pad) clamp(48px,7vw,80px)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{t.selected}</h2>
          <ViewAll href={storeHref(base, "/products")} label={t.viewAll} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--mincols), minmax(0,1fr))", gap: "clamp(20px,3vw,40px)" }}>
          {picks.map((p) => (
            <Link key={p._id} href={storeHref(base, `/products/${p.slug}`)} style={{ display: "flex", flexDirection: "column" }}>
              <Media src={p.images?.[0]?.thumbnailUrl || p.images?.[0]?.url} alt={p.name} label="product" radius={12} style={{ marginBottom: 14 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.35, marginBottom: 4 }}>{p.name}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{money(p.price, currency)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
