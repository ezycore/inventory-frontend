"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { thumbImageUrl } from "@/lib/storefront-image";
import { wrap, type SectionProps } from "@/components/storefront/home/home-shared";

/**
 * The homepage category row: image chips (classic) or a bordered text strip
 * (minimal). Hero-split never rendered categories, so if an owner adds the
 * section to that page it inherits the chips — the richer of the two.
 */
export function CategoriesSection({ base, categories, variant }: SectionProps) {
  if (categories.length === 0) return null;
  return variant === "minimal" ? (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 var(--pad) clamp(40px,6vw,64px)" }}>
      <div style={{ display: "flex", gap: 26, justifyContent: "center", flexWrap: "wrap", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "18px 0" }}>
        {categories.map((c) => (
          <Link key={c._id} href={storeHref(base, `/products?categoryId=${c._id}`)} style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  ) : (
    <div style={{ ...wrap, padding: "0 var(--pad) 8px" }}>
      <div style={{ display: "flex", gap: 11, overflowX: "auto", paddingBottom: 6 }}>
        {categories.map((c) => {
          const imgSrc = thumbImageUrl(c.image);
          return (
            <Link
              key={c._id}
              href={storeHref(base, `/products?categoryId=${c._id}`)}
              style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 84 }}
            >
              {/* Category image when the merchant set one; initial chip is the fallback. */}
              {imgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgSrc}
                  alt={c.name}
                  style={{ width: 60, height: 60, borderRadius: "var(--r-md)", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "var(--r-md)",
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {c.name.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--text)", textAlign: "center", lineHeight: 1.2 }}>
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
