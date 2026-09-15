// coding-standard: maintained
import type { CatalogProduct } from "@/lib/storefront-client";
import { cartLineCap } from "@/lib/storefront-cart-qty";
import { thumbImageUrl } from "@/lib/storefront-image";
import type { CartItem } from "@/services/stores/use-cart-store";
import { defaultSelection, matchVariant } from "@/components/storefront/variant-selector";

/**
 * What a shopper's option picks resolve to on one product: the variant, its
 * price and stock, the photos to show, and the line to order.
 *
 * The product page, the quick-buy sheet and a landing page's order form all ask
 * this, and must answer alike — a price that differs between the sheet and the
 * page is exactly the "the price changed" report. A variable product prices,
 * stocks and illustrates itself from the chosen variant; a single one from
 * itself.
 *
 * An empty `picked` means the shopper has chosen nothing yet, and
 * `defaultSelection` stands in: the cheapest buyable variant, so the price shown
 * before a choice is never above the one the card advertised.
 *
 * Client-only: `variant-selector.tsx` is a `"use client"` module, so a server
 * view must not call this.
 */
export function resolveProductChoice(
  product: CatalogProduct | undefined,
  picked: Record<string, string>,
) {
  const variable = product?.productType === "variable";
  const variants = product?.variants ?? [];
  // Ahead of `selection`: the default highlight branches on it, as the chips
  // do — every option of a backorder product is buyable.
  const canBackorder = product?.outOfStockBehavior === "backorder";
  const selection = Object.keys(picked).length ? picked : defaultSelection(variants, canBackorder);
  const selected = variable ? matchVariant(variants, selection) : undefined;
  const price = (variable ? selected?.price : product?.price) ?? 0;
  const compareAt = variable ? selected?.compareAtPrice : product?.compareAtPrice;
  const availableQty = variable
    ? (selected?.availableQuantity ?? 0)
    : (product?.availableQuantity ?? 0);

  return {
    variable,
    variants,
    canBackorder,
    selection,
    selected,
    price,
    compareAt,
    hasOld: !!compareAt && compareAt > price,
    availableQty,
    /**
     * Only "show"/"hide" products sell out. A backorder product sells past zero
     * on purpose, and is presented as an ordinary available one.
     */
    soldOut: availableQty <= 0 && !canBackorder,
    /** A variable product with no variant matched cannot be ordered — which one would it be? */
    incomplete: variable && !selected,
    /** A variant with its own photos replaces the gallery; otherwise the product's stay. */
    images: variable && selected?.images?.length ? selected.images : (product?.images ?? []),
  };
}

export type ProductChoice = ReturnType<typeof resolveProductChoice>;

/** The line a choice orders — the shape the cart, quick buy and the order form all take. */
export function choiceLine(product: CatalogProduct, choice: ProductChoice, quantity: number): CartItem {
  return {
    productId: product._id,
    variantId: choice.selected?._id,
    variantLabel: choice.selected?.label,
    slug: product.slug,
    name: product.name,
    price: choice.price,
    image: thumbImageUrl(choice.images[0] ?? product.images?.[0]),
    maxQty: cartLineCap(choice.availableQty, choice.canBackorder),
    quantity,
  };
}
