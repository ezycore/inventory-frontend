"use client";
// coding-standard: maintained

import { Suspense, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useStore, useStoreProducts } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore } from "@/services/stores/use-cart-store";
import { resolveTemplates } from "@/lib/storefront-templates";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { ProductCard } from "@/components/storefront/product-card";
import { SkeletonCard } from "@/components/storefront/sf-skeleton";
import type { CatalogProduct } from "@/lib/storefront-client";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

function SearchInner() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const initialQ = useSearchParams().get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  // Debounced copy of `q` drives the API query — one request per pause in
  // typing instead of one per keystroke.
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data: store } = useStore(slug);
  const { data, isLoading } = useStoreProducts(slug, {
    q: debouncedQ || undefined,
    limit: 24,
  });

  const currency = store?.currency;
  const variant = resolveTemplates(store).search;
  const items = data?.items ?? [];

  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--card)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "13px 16px", marginBottom: 18, color: "var(--text)" }}>
        <Icon name="search" size={18} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPh}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--text)", fontSize: 15, fontWeight: 500, fontFamily: "inherit" }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--searchcols), minmax(0,1fr))", gap: "var(--gap)" }}>
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "60px 30px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, color: "var(--faint)" }}>
            <Icon name="search" size={40} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>{t.noResults}</h3>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 auto 20px", maxWidth: 360 }}>{t.noResultsMsg}</p>
          <Link href={storeHref(base, "/products")} style={{ display: "inline-block", background: "var(--primary)", color: "var(--on-primary)", padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>
            {t.viewAllProducts}
          </Link>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            {items.length} {t.results}
            {q ? ` · "${q}"` : ""}
          </div>
          {variant === "list" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((p) => (
                <SearchRow key={p._id} product={p} currency={currency} base={base} slug={slug} addedLabel={t.added} addLabel={t.addToCart} outLabel={t.outOfStock} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--searchcols), minmax(0,1fr))", gap: "var(--gap)" }}>
              {items.map((p) => (
                <ProductCard key={p._id} product={p} currency={currency} variant="compact" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchRow({
  product,
  currency,
  base,
  slug,
  addLabel,
  addedLabel,
  outLabel,
}: {
  product: CatalogProduct;
  currency?: string;
  base: string;
  slug: string;
  addLabel: string;
  addedLabel: string;
  outLabel: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const thumb = product.images?.[0]?.thumbnailUrl || product.images?.[0]?.url;
  const pdp = storeHref(base, `/products/${product.slug}`);
  const outOfStock = product.availableQuantity <= 0;
  return (
    <div style={{ display: "flex", gap: 14, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, alignItems: "center" }}>
      <Link href={storeHref(base, `/products/${product.slug}`)} style={{ width: 84, height: 84, flex: "none" }}>
        <Media src={thumb} alt={product.name} radius={9} />
      </Link>
      <Link href={storeHref(base, `/products/${product.slug}`)} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3, margin: "0 0 6px" }}>{product.name}</div>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{money(product.price, currency)}</span>
      </Link>
      <button
        type="button"
        disabled={outOfStock}
        onClick={() => {
          // Variable products need a variant picked on the PDP first.
          if (product.hasVariants) {
            router.push(pdp);
            return;
          }
          addItem(slug, {
            productId: product._id,
            slug: product.slug,
            name: product.name,
            price: product.price ?? 0,
            image: thumb,
            maxQty: product.availableQuantity,
          });
          toast.success(addedLabel);
        }}
        style={{ flex: "none", background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "10px 18px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: outOfStock ? "not-allowed" : "pointer", opacity: outOfStock ? 0.55 : 1 }}
      >
        {outOfStock ? outLabel : addLabel}
      </button>
    </div>
  );
}

export default function SearchPage() {
  const { t } = useStorefrontUI();
  return (
    <Suspense fallback={<p style={{ padding: 24, fontSize: 13, color: "var(--muted)" }}>{t.loading}</p>}>
      <SearchInner />
    </Suspense>
  );
}
