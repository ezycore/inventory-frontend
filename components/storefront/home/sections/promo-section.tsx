"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { wrap, type SectionProps } from "@/components/storefront/home/home-shared";

/**
 * The two promo tiles that closed the hero-split page — a filled primary tile
 * and a bordered one, both linking to the full collection.
 *
 * The copy is dictionary text; there is no owner control behind it yet, so the
 * tiles say the same thing in every store that renders them.
 */
export function PromoSection({ base, t }: SectionProps) {
  return (
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
  );
}
