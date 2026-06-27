"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { money, discountPct } from "@/components/storefront/format";
import { Media } from "@/components/storefront/sf-bits";

/**
 * Storefront product card. `full` shows a wide Add-to-cart button (featured /
 * collection grids); `compact` shows a small "+" (dense new-arrivals rows).
 * Reads slug/base from context; links to the PDP and adds to the cart store.
 */
export function ProductCard({
  product,
  currency,
  variant = "full",
}: {
  product: CatalogProduct;
  currency?: string;
  variant?: "full" | "compact";
}) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const addItem = useCartStore((s) => s.addItem);

  const price = product.price ?? 0;
  const pct = discountPct(product.price, product.compareAtPrice);
  const outOfStock = product.availableQuantity <= 0;
  const thumb = product.images?.[0]?.thumbnailUrl || product.images?.[0]?.url;
  const href = storeHref(base, `/products/${product.slug}`);

  const add = () => {
    addItem(slug, {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price,
      image: product.images?.[0]?.thumbnailUrl,
      maxQty: product.availableQuantity,
    });
    toast.success(t.added);
  };

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Link href={href} style={{ position: "relative", display: "block" }}>
        <Media src={thumb} alt={product.name} label="product" radius={0} />
        {pct > 0 ? (
          <span
            style={{
              position: "absolute",
              top: 9,
              left: 9,
              background: "var(--discount-soft)",
              color: "var(--discount)",
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 7px",
              borderRadius: 999,
            }}
          >
            -{pct}%
          </span>
        ) : null}
      </Link>
      <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
        <Link
          href={href}
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: "var(--text)",
            lineHeight: 1.3,
            margin: "0 0 8px",
            minHeight: 35,
          }}
        >
          {product.name}
        </Link>

        {variant === "compact" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {money(price, currency)}
              </span>
            </span>
            <button
              type="button"
              disabled={outOfStock}
              onClick={add}
              aria-label={t.addToCart}
              style={{
                background: "var(--primary-soft)",
                color: "var(--primary)",
                border: "1px solid var(--primary)",
                width: 32,
                height: 32,
                borderRadius: 7,
                fontSize: 18,
                fontWeight: 600,
                cursor: outOfStock ? "not-allowed" : "pointer",
                lineHeight: 1,
                opacity: outOfStock ? 0.5 : 1,
              }}
            >
              +
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 11 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>
                {money(price, currency)}
              </span>
              {pct > 0 ? (
                <span style={{ fontSize: 12, color: "var(--faint)", textDecoration: "line-through" }}>
                  {money(product.compareAtPrice, currency)}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              disabled={outOfStock}
              onClick={add}
              style={{
                marginTop: "auto",
                background: "var(--primary)",
                color: "var(--on-primary)",
                border: "none",
                padding: 9,
                borderRadius: 7,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: outOfStock ? "not-allowed" : "pointer",
                opacity: outOfStock ? 0.55 : 1,
              }}
            >
              {outOfStock ? t.outOfStock : t.addToCart}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
