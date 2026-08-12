"use client";
// coding-standard: maintained

import Link from "next/link";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import { Media } from "@/components/storefront/sf-bits";
import { money } from "@/components/storefront/format";
import { useStoreImageFit } from "@/services/storefront/use-image-fit";
import {
  ViewAll,
  type TplProps,
} from "@/components/storefront/home/home-shared";

/** Homepage template C: Minimal — centered manifesto, category strip, picks. */
export function Minimal({ base, currency, featured, categories, t }: TplProps) {
  const picks = featured.slice(0, 6);
  const imageFit = useStoreImageFit();
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
              <Link key={c._id} href={collectionHref(base, c)} style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", whiteSpace: "nowrap" }}>
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
              <Media src={cardImageUrl(p.images?.[0])} alt={p.name} label="product" radius={12} fit={imageFit} style={{ marginBottom: 14 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.35, marginBottom: 4 }}>{p.name}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{money(p.price, currency)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
