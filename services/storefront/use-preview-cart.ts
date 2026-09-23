"use client";
// coding-standard: maintained

import { useCallback, useMemo, useState } from "react";
import { isPreviewSession } from "@/lib/storefront-preview";
import { CART_UNCAPPED } from "@/lib/storefront-cart-qty";
import { thumbImageUrl } from "@/lib/storefront-image";
import { useHydrated } from "@/hooks/use-hydrated";
import { useStoreProducts } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { cartLineKey, type CartItem } from "@/services/stores/use-cart-store";
import { usePreviewCartStore } from "@/services/stores/use-preview-cart-store";

/**
 * The store's first two products, for the sample. A module constant because the
 * params object IS the query key — building it inline would mint a new cache
 * entry on every render.
 */
const SAMPLE_PARAMS = { limit: 2 } as const;

/** What a sample line costs when the shop has no products to borrow yet. */
const PLACEHOLDER_PRICES = [1200, 450];

export interface PreviewCart {
  items: CartItem[];
  updateQty: (lineKey: string, qty: number) => void;
  removeItem: (lineKey: string) => void;
  /** True when these lines are the preview's invention, not the merchant's basket. */
  sample: boolean;
}

const noop = () => {};
/** The editor asked for the empty state: no lines, and no controls to work. */
const EMPTIED: PreviewCart = { items: [], updateQty: noop, removeItem: noop, sample: false };

/**
 * The basket a cart or checkout page is previewed with inside an admin editor
 * frame — `null` on every real visit, which is what makes this safe to call from
 * the hooks the whole shop runs on.
 *
 * **Why it exists.** The page editor previews the real storefront, and the cart
 * lives in `localStorage` on the shop's own origin. A merchant has almost never
 * shopped their own shop in that browser, so the cart page they open to design
 * draws its empty-cart card and the checkout page draws two lines of text: the
 * four-way layout picker on each page's core section changes nothing on screen,
 * and neither does anything they arrange around it. Customize dodged this by
 * refusing to give checkout a preview tab at all (`browser-preview.tsx`); the
 * builder cannot dodge it, because that is where those pages are now edited.
 *
 * **What it must never do.** The sample is held here, never written to the cart
 * store — that store persists to the merchant's own shop origin, so a sample
 * that went through it would put products in the basket of every later visit
 * they make to their own shop. For the same reason the lines are worked on
 * locally: the stepper and the remove button on a sample line have to do
 * something, or fixing one dead control would have added three more.
 *
 * `real` is the shopper's actual basket, which always wins — a merchant who HAS
 * items in their cart is previewing something true, and replacing it would be
 * the lie. `enabled` is false where the caller supplies its own lines (a landing
 * page's order form), which needs no sample.
 */
export function usePreviewCart(real: CartItem[], enabled = true): PreviewCart | null {
  const hydrated = useHydrated();
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const filled = usePreviewCartStore((s) => s.filled);

  /* Sticky for the tab, and only ever true inside an editor frame — see
     `isPreviewSession`. Masked by `hydrated` because it reads `sessionStorage`:
     answering `true` in the hydration render would make the client's first paint
     disagree with the server HTML, which is the bug the cart's own hydration
     gate already exists to avoid. */
  const editing = enabled && hydrated && isPreviewSession();
  const wanted = editing && filled && real.length === 0;
  const { data } = useStoreProducts(slug, SAMPLE_PARAMS, wanted);

  /* Quantities the merchant changed on the sample, by line key; `0` is a removed
     line. Local, for the reason in the docstring above. */
  const [edits, setEdits] = useState<Record<string, number>>({});

  const items = useMemo(() => {
    const catalogue = data?.items ?? [];
    const base: CartItem[] = catalogue.length
      ? catalogue.slice(0, 2).map((product, index) => ({
          productId: product._id,
          slug: product.slug,
          name: product.name,
          price: product.price ?? 0,
          image: thumbImageUrl(product.images?.[0]),
          // The second line carries two, so the stepper is previewed showing a
          // number rather than the 1 every line would otherwise sit at.
          quantity: index === 0 ? 1 : 2,
          // Uncapped on purpose: a sample is never ordered, and borrowing a
          // sold-out product's real ceiling would draw the refused-line state
          // over a preview whose whole job is to show the layout.
          maxQty: CART_UNCAPPED,
        }))
      : PLACEHOLDER_PRICES.map((price, index) => ({
          // A shop with no products yet still has a cart page to design, and
          // this is the moment a merchant designs it.
          productId: `preview-sample-${index + 1}`,
          slug: "",
          name: `${t.previewSampleProduct} ${index + 1}`,
          price,
          quantity: index === 0 ? 1 : 2,
          maxQty: CART_UNCAPPED,
        }));
    return base
      .map((line) => {
        const edited = edits[cartLineKey(line)];
        return edited === undefined ? line : { ...line, quantity: edited };
      })
      .filter((line) => line.quantity > 0);
  }, [data, edits, t.previewSampleProduct]);

  const updateQty = useCallback((key: string, qty: number) => {
    setEdits((current) => ({ ...current, [key]: Math.max(0, qty) }));
  }, []);
  const removeItem = useCallback((key: string) => {
    setEdits((current) => ({ ...current, [key]: 0 }));
  }, []);

  if (!editing) return null;
  if (!filled) return EMPTIED;
  if (real.length > 0) return null;
  return { items, updateQty, removeItem, sample: true };
}
