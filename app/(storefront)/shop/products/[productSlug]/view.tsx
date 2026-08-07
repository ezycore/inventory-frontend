"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import {
  useStore,
  useStoreCategories,
  useStoreProduct,
  useStoreProducts,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useWishlistStore } from "@/services/stores/use-wishlist-store";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { storeHref } from "@/lib/storefront-links";
import { cardImageUrl, thumbImageUrl } from "@/lib/storefront-image";
import { cartLineCap } from "@/lib/storefront-cart-qty";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductTagChips } from "@/components/storefront/product-tag-chips";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { productCrumbs } from "@/lib/storefront-breadcrumb";
import {
  VariantSelector,
  defaultSelection,
  matchVariant,
} from "@/components/storefront/variant-selector";
import { LoadingSplash } from "@/components/storefront/loading-splash";
import type { CatalogProduct } from "@/lib/storefront-client";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

/** `initialProduct` is server-fetched in `page.tsx` so this page's content is in
 *  the SSR HTML — see the note there. */
export default function ProductDetailPage({
  initialProduct,
}: {
  initialProduct?: CatalogProduct;
}) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const productSlug = String(useParams().productSlug);

  const { data: store } = useStore(slug);
  // Seeded by shop/layout.tsx through the shell, so the breadcrumb's category
  // rungs are in the SSR HTML. That seeding was added because of this line: the
  // query had no `initialData` at all, so the visible trail server-rendered as
  // "Store › All products › Product" while the page's JSON-LD — built server-side
  // from the same helper — already carried the real category trail. Two claims,
  // one page, disagreeing until hydration.
  const { data: categories } = useStoreCategories(slug);
  const {
    data: product,
    isLoading,
    isError,
  } = useStoreProduct(slug, productSlug, initialProduct);
  // Related picks: same category when the product has one, latest otherwise.
  const { data: relatedData } = useStoreProducts(
    slug,
    product?.categoryId
      ? { categoryId: product.categoryId, limit: 8 }
      : { limit: 8 },
  );
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const toggleWish = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore(
    (s) =>
      s.storeSlug === slug &&
      s.items.some((i) => i.productId === product?._id),
  );
  const [qty, setQty] = useState(1);
  // Gallery image the shopper tapped (clamped later — variant switches can
  // swap in a shorter image list).
  const [imgIdx, setImgIdx] = useState(0);
  // Variant chip selection (variable products) — empty until the shopper picks,
  // in which case the first in-stock variant acts as the default.
  const [picked, setPicked] = useState<Record<string, string>>({});

  // The component survives PDP→PDP navigation (related products), so shopper
  // state resets per product — render-time adjust, per react.dev's
  // "adjusting state when a prop changes" guidance (no effect, no extra pass).
  const [prevSlug, setPrevSlug] = useState(productSlug);
  if (prevSlug !== productSlug) {
    setPrevSlug(productSlug);
    setQty(1);
    setPicked({});
    setImgIdx(0);
  }

  // Read above the early returns — it is a hook, and the loading/error branches
  // below would otherwise make the call order conditional.
  const variant = useStoreTemplate(store, "product");

  if (isLoading) return <div style={wrap}><LoadingSplash /></div>;
  if (isError || !product) {
    return (
      <div style={{ ...wrap }}>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>{t.productNotFound}</p>
        <Link href={storeHref(base, "/products")} style={{ fontSize: 13, color: "var(--primary)" }}>
          ← {t.allProducts}
        </Link>
      </div>
    );
  }

  const currency = store?.currency;
  const galleryTop = variant !== "left";
  const sticky = variant === "sticky";

  const variable = product.productType === "variable";
  const variants = product.variants ?? [];

  // Selected variant: shopper's picks win, else default to first in-stock.
  const selection = Object.keys(picked).length
    ? picked
    : defaultSelection(variants);
  const selectedVariant = variable
    ? matchVariant(variants, selection)
    : undefined;

  // Variable products price/stock/gallery from the selected variant; a variant
  // with images swaps the gallery, otherwise the parent images stay.
  const price = (variable ? selectedVariant?.price : product.price) ?? 0;
  const compareAt = variable
    ? selectedVariant?.compareAtPrice
    : product.compareAtPrice;
  const hasOld = !!compareAt && compareAt > price;
  const availableQty = variable
    ? (selectedVariant?.availableQuantity ?? 0)
    : product.availableQuantity;
  const outOfStock = availableQty <= 0;
  // Backorder products stay buyable past zero stock; only "show"/"hide" products
  // are truly sold out. `soldOut` gates the buy buttons + the red stock badge.
  const canBackorder = product.outOfStockBehavior === "backorder";
  const soldOut = outOfStock && !canBackorder;
  const images = variable && selectedVariant?.images?.length
    ? selectedVariant.images
    : (product.images ?? []);

  const related = (relatedData?.items ?? [])
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  const add = (notify = true) => {
    if (variable && !selectedVariant) return;
    addItem(
      slug,
      {
        productId: product._id,
        variantId: selectedVariant?._id,
        variantLabel: selectedVariant?.label,
        slug: product.slug,
        name: product.name,
        price,
        image: thumbImageUrl(images[0] ?? product.images?.[0]),
        maxQty: cartLineCap(availableQty, canBackorder),
      },
      qty,
    );
    if (notify) toast.success(t.added);
  };
  const buyNow = () => {
    // Straight to checkout, matching the card's Buy now — "Buy now" has to mean
    // the same thing on both surfaces or it means nothing. (It opened the cart
    // drawer until 2026-08-01; /cart is still reachable from the cart icon.)
    // No toast: the screen change is the confirmation.
    add(false);
    router.push(storeHref(base, "/checkout"));
  };

  const onWish = () =>
    toggleWish(slug, {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      // The wishlist renders this at card size, not as a row thumb.
      image: cardImageUrl(product.images?.[0]),
      hasVariants: variable,
      availableQuantity: product.availableQuantity,
      outOfStockBehavior: product.outOfStockBehavior,
    });

  return (
    <div style={wrap}>
      {/* Same crumbs as the page's BreadcrumbList JSON-LD — one builder, so the
          visible trail and the structured data cannot disagree. */}
      <Breadcrumb
        base={base}
        crumbs={productCrumbs({
          storeName: store?.name ?? "",
          productName: product.name,
          productSlug,
          categories: categories ?? [],
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId,
          allProductsLabel: t.allProducts,
        })}
      />
      <div style={{ display: "grid", gridTemplateColumns: galleryTop ? "1fr" : "var(--pdpgrid)", gap: "clamp(22px,3vw,44px)", alignItems: "start" }}>
        <ProductGallery
          images={images}
          alt={product.name}
          layout={galleryTop ? "top" : "side"}
          index={imgIdx}
          onSelect={setImgIdx}
        />

        {/* Info */}
        <div>
          <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
            {product.name}
          </h1>
          {/* Stock state and the merchant's labels share one badge row directly
              under the title — the labels are what the merchant is merchandising
              on ("Eid sale", "Organic"), so burying them below the fold would
              make the tags page look like it does nothing. Wraps, because a
              product can carry several and the column is narrow on a phone. */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <span
              style={{
                fontSize: 12,
                color: soldOut ? "var(--discount)" : "var(--primary)",
                fontWeight: 600,
                background: soldOut ? "var(--discount-soft)" : "var(--primary-soft)",
                padding: "3px 9px",
                borderRadius: 999,
              }}
            >
              {soldOut ? t.outOfStock : outOfStock ? t.backorder : t.inStock}
            </span>
            {/* Each chip is a link into the tag facet, so a shopper who likes a
                label can see the rest of it — a chip that only decorates is a
                wasted exit. */}
            <ProductTagChips tags={product.tags} base={base} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 11, marginBottom: 18 }}>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{money(price, currency)}</span>
            {hasOld ? (
              <span style={{ fontSize: 15, color: "var(--faint)", textDecoration: "line-through" }}>
                {money(compareAt, currency)}
              </span>
            ) : null}
          </div>
          {product.description ? (
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 20px", whiteSpace: "pre-line" }}>
              {product.description}
            </p>
          ) : null}

          {variable && variants.length === 0 ? (
            // Variable product without purchasable variants — fall back to
            // the call-to-order card instead of an empty selector.
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
              {variable ? (
                <VariantSelector
                  variants={variants}
                  selection={selection}
                  onSelect={(next) => {
                    setPicked(next);
                    setQty(1);
                    setImgIdx(0);
                  }}
                />
              ) : null}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t.quantity}</span>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-strong)", borderRadius: 8, overflow: "hidden" }}>
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} style={qtyBtn}>−</button>
                  <span className="sf-mono" style={{ fontSize: 14, fontWeight: 700, minWidth: 36, textAlign: "center" }}>{qty}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQty((q) =>
                        !canBackorder && availableQty > 0
                          ? Math.min(availableQty, q + 1)
                          : q + 1,
                      )
                    }
                    style={qtyBtn}
                  >
                    +
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 11, flexWrap: "wrap", marginBottom: 20 }}>
                <button type="button" disabled={soldOut} onClick={() => add()} style={{ flex: 1, minWidth: 150, background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "14px 22px", borderRadius: 9, fontFamily: "inherit", fontSize: 14.5, fontWeight: 700, cursor: soldOut ? "not-allowed" : "pointer", opacity: soldOut ? 0.55 : 1 }}>
                  {soldOut ? t.outOfStock : t.addToCartFull}
                </button>
                <button type="button" disabled={soldOut} onClick={buyNow} style={{ flex: 1, minWidth: 130, background: "transparent", color: "var(--text)", border: "1px solid var(--border-strong)", padding: "14px 22px", borderRadius: 9, fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, cursor: soldOut ? "not-allowed" : "pointer", opacity: soldOut ? 0.55 : 1 }}>
                  {t.buyNow}
                </button>
                {/* Wishlist heart — saved items appear in Account → Wishlist. */}
                <button
                  type="button"
                  onClick={onWish}
                  aria-label={t.tabWishlist}
                  aria-pressed={wished}
                  style={{
                    flex: "none",
                    width: 52,
                    background: wished ? "var(--primary-soft)" : "transparent",
                    color: wished ? "var(--primary)" : "var(--muted)",
                    border: "1px solid var(--border-strong)",
                    padding: 14,
                    borderRadius: 9,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={wished ? "heartFill" : "heart"} size={20} />
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

      {sticky && (!variable || variants.length > 0) ? (
        <div
          style={{
            position: "sticky",
            bottom: "var(--sf-bottom-nav-h, 0px)",
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
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {product.name}
              {selectedVariant ? ` — ${selectedVariant.label}` : ""}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{money(price, currency)}</div>
          </div>
          <button type="button" disabled={soldOut} onClick={() => add()} style={{ flex: "none", background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "13px 26px", borderRadius: 9, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: soldOut ? "not-allowed" : "pointer", opacity: soldOut ? 0.55 : 1 }}>
            {soldOut ? t.outOfStock : t.addToCartFull}
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
  width: 44,
  height: 44,
  fontSize: 17,
  cursor: "pointer",
};
