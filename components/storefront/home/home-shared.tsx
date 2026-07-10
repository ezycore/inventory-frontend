"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
} from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";
import { storeHref } from "@/lib/storefront-links";
import { ProductCard } from "@/components/storefront/product-card";
import { money } from "@/components/storefront/format";

export const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
};

/** Data every homepage template receives from the `StoreHome` dispatcher. */
export interface TplProps {
  base: string;
  currency?: string;
  featured: CatalogProduct[];
  latest: CatalogProduct[];
  categories: CatalogCategory[];
  campaigns: StoreCampaign[];
  t: Dict;
  banner?: string;
}

/**
 * Hero badge text from the live campaign ("test · 2% off"), so the homepage
 * never claims a sale that isn't running; null falls back to template copy.
 */
export function campaignBadge(props: TplProps): string | null {
  const c =
    props.campaigns.find((x) => x.scope === "storewide") ?? props.campaigns[0];
  if (!c) return null;
  const amount =
    c.type === "percentage" ? `${c.value}%` : money(c.value, props.currency);
  return `${c.name} · ${amount} ${props.t.campaignOff}`;
}

export function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
      {label} →
    </Link>
  );
}

export function Grid({
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

export function heroBtns(base: string, t: Dict, primaryLabel: string) {
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
