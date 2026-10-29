// coding-standard: maintained
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CatalogProduct } from "@/lib/storefront-client";
import { cardImageUrl } from "@/lib/storefront-image";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Client-side wishlist (Zustand + localStorage), one list per store. Items
 * snapshot the product's card data so the wishlist grid renders without a
 * round-trip. The browser is the editor; `WishlistSync` mirrors it to the server
 * and folds the server's live prices back in (backend docs/plan/wishlist.md).
 */
export interface WishItem {
  productId: string;
  slug: string;
  name: string;
  price: number | null;
  compareAtPrice?: number | null;
  image?: string;
  /** Variable products can't be moved to cart blindly — send to the PDP. */
  hasVariants?: boolean;
  /** Stock at save time — caps "Move to cart" (backend re-validates at order). */
  availableQuantity?: number;
  /**
   * Saved alongside the stock count because the two are only meaningful
   * together: a backorder product is buyable at zero stock, so without this
   * "Move to cart" would refuse exactly the products that are always in stock
   * for ordering purposes. Absent (older saved rows) reads as not-backorder.
   */
  outOfStockBehavior?: "hide" | "show" | "backorder";
}

interface WishlistState {
  /** Keyed by store slug. */
  lists: Record<string, WishItem[]>;
  toggle: (storeSlug: string, item: WishItem) => void;
  remove: (storeSlug: string, productId: string) => void;
  /**
   * Fold the server's answer to a sync back in (`WishlistSync`). Of the ids
   * that were SENT, the ones the server returned get its live price and stock,
   * and the rest — unlisted or deleted since — are dropped. Anything saved while
   * the request was in flight was not sent, so it is left alone.
   */
  refresh: (storeSlug: string, sentIds: string[], live: WishItem[]) => void;
  /** Replace the list outright — the merged result of signing in. */
  adopt: (storeSlug: string, items: WishItem[]) => void;
  /** Forget this store's list — signing out (the account keeps its copy). */
  clearStore: (storeSlug: string) => void;
}

/**
 * The shape before 2026-10-28: ONE list, wiped whenever the shopper saved on a
 * second store. Kept only to migrate it — the key is unchanged, because renaming
 * it would silently empty every shopper's saved list on deploy.
 */
interface WishlistStateV0 {
  storeSlug?: string | null;
  items?: WishItem[];
}

/** Stable empty list, so a selector for an unknown store doesn't re-render forever. */
const NONE: WishItem[] = [];

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      lists: {},

      toggle: (storeSlug, item) =>
        set((s) => {
          const list = s.lists[storeSlug] ?? NONE;
          const exists = list.some((i) => i.productId === item.productId);
          return {
            lists: {
              ...s.lists,
              [storeSlug]: exists
                ? list.filter((i) => i.productId !== item.productId)
                : [...list, item],
            },
          };
        }),

      remove: (storeSlug, productId) =>
        set((s) => ({
          lists: {
            ...s.lists,
            [storeSlug]: (s.lists[storeSlug] ?? NONE).filter(
              (i) => i.productId !== productId,
            ),
          },
        })),

      refresh: (storeSlug, sentIds, live) =>
        set((s) => {
          const sent = new Set(sentIds);
          const fresh = new Map(live.map((i) => [i.productId, i]));
          return {
            lists: {
              ...s.lists,
              [storeSlug]: (s.lists[storeSlug] ?? NONE).flatMap((item) => {
                if (!sent.has(item.productId)) return [item];
                const next = fresh.get(item.productId);
                return next ? [next] : [];
              }),
            },
          };
        }),

      adopt: (storeSlug, items) =>
        set((s) => ({ lists: { ...s.lists, [storeSlug]: items } })),

      clearStore: (storeSlug) =>
        set((s) => {
          const lists = { ...s.lists };
          delete lists[storeSlug];
          return { lists };
        }),
    }),
    {
      name: "easystock-wishlist",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lists: s.lists }),
      migrate: (persisted, version) => {
        if (version >= 1) return persisted as WishlistState;
        const old = (persisted ?? {}) as WishlistStateV0;
        return {
          lists: old.storeSlug && old.items?.length ? { [old.storeSlug]: old.items } : {},
        } as WishlistState;
      },
    },
  ),
);

/**
 * This store's saved items. Empty until the persisted list hydrates, so the
 * first client render matches the server's (which never sees localStorage).
 */
export function useWishlistItems(storeSlug: string): WishItem[] {
  const hydrated = useHydrated();
  const items = useWishlistStore((s) => s.lists[storeSlug] ?? NONE);
  return hydrated ? items : NONE;
}

/** Is this product saved? Masked until hydrated, like `useWishlistItems`. */
export function useIsWished(storeSlug: string, productId: string | undefined): boolean {
  const hydrated = useHydrated();
  const saved = useWishlistStore(
    (s) => !!productId && (s.lists[storeSlug] ?? NONE).some((i) => i.productId === productId),
  );
  return hydrated && saved;
}

/** The saved row for a product — the card and the PDP heart write the same one. */
export function wishItemOf(product: CatalogProduct, hasVariants: boolean): WishItem {
  return {
    productId: product._id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    // The wishlist renders this at card size, not as a row thumb.
    image: cardImageUrl(product.images?.[0]) ?? undefined,
    hasVariants,
    availableQuantity: product.availableQuantity,
    outOfStockBehavior: product.outOfStockBehavior,
  };
}
