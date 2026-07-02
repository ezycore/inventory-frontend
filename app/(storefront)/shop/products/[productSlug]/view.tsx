"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useStore,
  useStoreProduct,
  useStoreProducts,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useCartUI } from "@/services/stores/use-cart-ui-store";
import { resolveTemplates } from "@/lib/storefront-templates";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { Media, SectionTitle } from "@/components/storefront/sf-bits";
import { ProductCard } from "@/components/storefront/product-card";
import type { StorefrontImage } from "@/lib/storefront-client";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

function imgUrl(i?: StorefrontImage) {
  return i?.url || i?.mediumUrl || i?.thumbnailUrl;
}

export default function ProductDetailPage() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const productSlug = String(useParams().productSlug);

  const { data: store } = useStore(slug);
  const { data: product, isLoading, isError } = useStoreProduct(slug, productSlug);
  const { data: relatedData } = useStoreProducts(slug, { limit: 8 });
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartUI((s) => s.openCart);
  const router = useRouter();
  const [qty, setQty] = useState(1);

  if (isLoading) return <p style={{ ...wrap, fontSize: 13, color: "var(--muted)" }}>Loading…</p>;
  if (isError || !product) {
    return (
      <div style={{ ...wrap }}>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>{t.noResults}</p>
        <Link href={storeHref(base, "/products")} style={{ fontSize: 13, color: "var(--primary)" }}>
          ← {t.allProducts}
        </Link>
      </div>
    );
  }

  const currency = store?.currency;
  const variant = resolveTemplates(store).product;
  const galleryTop = variant !== "left";
  const sticky = variant === "sticky";

  const price = product.price ?? 0;
  const hasOld = !!product.compareAtPrice && product.compareAtPrice > price;
  const outOfStock = product.availableQuantity <= 0;
  const variable = product.productType === "variable";
  const images = product.images?.length ? product.images : [];
  const main = imgUrl(images[0]);
  const thumbs = images.slice(0, 4);

  const related = (relatedData?.items ?? [])
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  const add = () => {
    addItem(
      slug,
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        price,
        image: product.images?.[0]?.thumbnailUrl,
        maxQty: product.availableQuantity,
      },
      qty,
    );
    toast.success(t.added);
  };
  const buyNow = () => {
    add();
    // Honour the cart template: drawer opens the slide-over, page goes to /cart.
    if (resolveTemplates(store).cart === "drawer") openCart();
    else router.push(storeHref(base, "/cart"));
  };

  return (
    <div style={wrap}>
      <div style={{ display: "grid", gridTemplateColumns: galleryTop ? "1fr" : "var(--pdpgrid)", gap: "clamp(22px,3vw,44px)", alignItems: "start" }}>
        {/* Gallery */}
        {galleryTop ? (
          <div>
            <Media src={main} alt={product.name} label="product" ratio="16 / 11" radius={14} />
            {thumbs.length > 1 ? (
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {thumbs.map((th, i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <Media src={imgUrl(th)} alt="" radius={8} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 62, flex: "none" }}>
              {(thumbs.length ? thumbs : [undefined]).map((th, i) => (
                <Media key={i} src={imgUrl(th)} alt="" radius={8} />
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <Media src={main} alt={product.name} label="product" radius={14} />
            </div>
          </div>
        )}

        {/* Info */}
        <div>
          <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
            {product.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span
              style={{
                fontSize: 12,
                color: outOfStock ? "var(--discount)" : "var(--primary)",
                fontWeight: 600,
                background: outOfStock ? "var(--discount-soft)" : "var(--primary-soft)",
                padding: "3px 9px",
                borderRadius: 999,
              }}
            >
              {outOfStock ? t.outOfStock : t.inStock}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 11, marginBottom: 18 }}>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{money(price, currency)}</span>
            {hasOld ? (
              <span style={{ fontSize: 15, color: "var(--faint)", textDecoration: "line-through" }}>
                {money(product.compareAtPrice, currency)}
              </span>
            ) : null}
          </div>
          {product.description ? (
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 20px", whiteSpace: "pre-line" }}>
              {product.description}
            </p>
          ) : null}

          {variable ? (
            <div style={{ border: "1px solid var(--border-strong)", background: "var(--surface)", borderRadius: 12, padding: 18, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                <Icon name="mapPin" size={17} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{t.variableTitle}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>{t.variableMsg}</p>
              {store?.contact?.phone ? (
                <a
                  href={`tel:${store.contact.phone}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--text)", color: "var(--card)", padding: "11px 18px", borderRadius: 8, fontSize: 13.5, fontWeight: 600 }}
                >
                  <Icon name="phone" size={15} /> {t.callToOrder} · {store.contact.phone}
                </a>
              ) : null}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t.quantity}</span>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-strong)", borderRadius: 8, overflow: "hidden" }}>
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} style={qtyBtn}>−</button>
                  <span className="sf-mono" style={{ fontSize: 14, fontWeight: 700, minWidth: 36, textAlign: "center" }}>{qty}</span>
                  <button type="button" onClick={() => setQty((q) => q + 1)} style={qtyBtn}>+</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 11, flexWrap: "wrap", marginBottom: 20 }}>
                <button type="button" disabled={outOfStock} onClick={add} style={{ flex: 1, minWidth: 150, background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "14px 22px", borderRadius: 9, fontFamily: "inherit", fontSize: 14.5, fontWeight: 700, cursor: outOfStock ? "not-allowed" : "pointer", opacity: outOfStock ? 0.55 : 1 }}>
                  {outOfStock ? t.outOfStock : t.addToCartFull}
                </button>
                <button type="button" disabled={outOfStock} onClick={buyNow} style={{ flex: 1, minWidth: 130, background: "transparent", color: "var(--text)", border: "1px solid var(--border-strong)", padding: "14px 22px", borderRadius: 9, fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, cursor: outOfStock ? "not-allowed" : "pointer", opacity: outOfStock ? 0.55 : 1 }}>
                  {t.buyNow}
                </button>
              </div>
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--muted)" }}>
              <Icon name="truck" size={18} /> {t.deliveryEst}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <div style={{ marginTop: 44 }}>
          <SectionTitle>{t.relatedTitle}</SectionTitle>
          <div className="sf-grid-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} currency={currency} variant="compact" />
            ))}
          </div>
        </div>
      ) : null}

      {sticky && !variable ? (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            margin: "28px calc(-1 * var(--pad)) -40px",
            background: "var(--card)",
            borderTop: "1px solid var(--border)",
            padding: "12px var(--pad)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            boxShadow: "0 -8px 24px -16px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{money(price, currency)}</div>
          </div>
          <button type="button" disabled={outOfStock} onClick={add} style={{ flex: "none", background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "13px 26px", borderRadius: 9, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: outOfStock ? "not-allowed" : "pointer", opacity: outOfStock ? 0.55 : 1 }}>
            {outOfStock ? t.outOfStock : t.addToCartFull}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const qtyBtn: CSSProperties = {
  background: "var(--surface)",
  color: "var(--text)",
  border: "none",
  width: 36,
  height: 36,
  fontSize: 17,
  cursor: "pointer",
};
