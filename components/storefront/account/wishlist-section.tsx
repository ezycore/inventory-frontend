"use client";
// coding-standard: maintained

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import { storeHref } from "@/lib/storefront-links";
import { cartLineCap } from "@/lib/storefront-cart-qty";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useWishlistStore } from "@/services/stores/use-wishlist-store";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";

/**
 * Wishlist section — products saved via the PDP heart. "Move to cart" adds and
 * removes in one tap (variable products go to the PDP to pick a variant first).
 */
export function WishlistSection() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const { data: store } = useStore(slug);
  const currency = store?.currency;

  const storeSlug = useWishlistStore((s) => s.storeSlug);
  const allItems = useWishlistStore((s) => s.items);
  const removeWish = useWishlistStore((s) => s.remove);
  const addToCart = useCartStore((s) => s.addItem);
  const items = storeSlug === slug ? allItems : [];

  if (items.length === 0) {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "56px 30px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, color: "var(--faint)" }}>
          <Icon name="heart" size={44} />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>{t.wishEmpty}</h3>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 auto 20px", maxWidth: 340, lineHeight: 1.55 }}>
          {t.wishEmptyMsg}
        </p>
        <Link
          href={storeHref(base, "/products")}
          style={{ display: "inline-block", background: "var(--primary)", color: "var(--on-primary)", padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600 }}
        >
          {t.viewAllProducts}
        </Link>
      </div>
    );
  }

  const moveToCart = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    if (item.hasVariants) {
      // Variant must be picked on the PDP before it can go in the cart.
      router.push(storeHref(base, `/products/${item.slug}`));
      return;
    }
    addToCart(slug, {
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      price: item.price ?? 0,
      image: item.image,
      maxQty: cartLineCap(
        item.availableQuantity,
        item.outOfStockBehavior === "backorder",
      ),
    });
    removeWish(productId);
    toast.success(t.added);
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px" }}>
        {items.length} {t.savedItems}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--cols), minmax(0,1fr))", gap: "var(--gap)" }}>
        {items.map((p) => {
          const pdp = storeHref(base, `/products/${p.slug}`);
          const hasOld = !!p.compareAtPrice && !!p.price && p.compareAtPrice > p.price;
          return (
            <div key={p.productId} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Link href={pdp} style={{ position: "relative", display: "block" }}>
                <Media src={p.image} alt={p.name} label="product" radius={0} fit="canvas" />
                <button
                  type="button"
                  aria-label={t.removeLabel}
                  onClick={(e) => {
                    e.preventDefault();
                    removeWish(p.productId);
                  }}
                  style={{ position: "absolute", top: 9, right: 9, width: 30, height: 30, borderRadius: "50%", background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--discount)", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
                >
                  <Icon name="heartFill" size={16} />
                </button>
              </Link>
              <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
                <Link href={pdp} style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)", lineHeight: 1.3, margin: "0 0 8px", minHeight: 35 }}>
                  {p.name}
                </Link>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 11 }}>
                  {p.hasVariants ? (
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{t.fromPrice}</span>
                  ) : null}
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{money(p.price, currency)}</span>
                  {hasOld ? (
                    <span style={{ fontSize: 12, color: "var(--faint)", textDecoration: "line-through" }}>
                      {money(p.compareAtPrice, currency)}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => moveToCart(p.productId)}
                  style={{ marginTop: "auto", background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: 9, borderRadius: 7, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  {p.hasVariants ? t.selectOptions : t.moveToCart}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
