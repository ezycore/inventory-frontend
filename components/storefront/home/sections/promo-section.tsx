"use client";
// coding-standard: maintained

import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { HeroCtaLink, wrap, type SectionProps } from "@/components/storefront/home/home-shared";

/**
 * The two promo tiles that close the hero-split home page — a filled primary
 * tile and a bordered one.
 *
 * Copy is owner-written (`promoTiles`) with **per-slot** fallback to the
 * built-in localized text, so a merchant who fills in only the first tile keeps
 * a sensible second one. Links go through `HeroCtaLink`, so the same rules as
 * hero buttons apply: a full URL opens a new tab, a store path rides `base`,
 * and blank means the products collection.
 */
export function PromoSection({ base, t, promoTiles }: SectionProps) {
  const previewTiles = useSfPreview((s) => s.promoTiles);
  const saved = previewTiles ?? promoTiles ?? [];
  const defaults = [
    { label: t.eidSale, title: t.promo1 },
    { label: t.toolsClear, title: t.promo2 },
  ];
  const tiles = defaults.map((d, i) => ({
    label: saved[i]?.label?.trim() || d.label,
    title: saved[i]?.title?.trim() || d.title,
    link: saved[i]?.link,
  }));

  return (
    <div style={{ ...wrap, padding: "8px var(--pad) 14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "var(--promocols)", gap: "var(--gap)" }}>
        <HeroCtaLink
          base={base}
          link={tiles[0].link}
          style={{ borderRadius: 14, background: "var(--primary)", color: "var(--on-primary)", padding: "clamp(20px,3vw,32px)", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, letterSpacing: "0.04em" }}>{tiles[0].label}</span>
          <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15, margin: "6px 0 12px", maxWidth: 260 }}>{tiles[0].title}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{t.shopNow} →</span>
        </HeroCtaLink>
        <HeroCtaLink
          base={base}
          link={tiles[1].link}
          style={{ borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)", padding: "clamp(20px,3vw,32px)", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, letterSpacing: "0.04em" }}>{tiles[1].label}</span>
          <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15, margin: "6px 0 12px", maxWidth: 260, color: "var(--text)" }}>{tiles[1].title}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{t.shopNow} →</span>
        </HeroCtaLink>
      </div>
    </div>
  );
}
