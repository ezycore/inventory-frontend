"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { Media, SectionTitle } from "@/components/storefront/sf-bits";
import {
  Grid,
  ViewAll,
  heroBtns,
  wrap,
  type TplProps,
} from "@/components/storefront/home/home-shared";

/** Homepage template B: Hero Split — split hero, trust row, picks, promo tiles. */
export function HeroSplit({ base, currency, featured, t, banner }: TplProps) {
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
