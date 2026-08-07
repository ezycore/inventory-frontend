"use client";
// coding-standard: maintained

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useStoreProduct } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { thumbImageUrl } from "@/lib/storefront-image";
import { cartLineCap } from "@/lib/storefront-cart-qty";
import {
  defaultSelection,
  matchVariant,
  optionsFitInline,
} from "@/components/storefront/variant-selector";
import type { QuickBuyLine } from "@/components/storefront/quick-buy-types";

/**
 * Mouse dwell before we fetch a card's variants. Long enough that sweeping the
 * pointer across a 4-column grid doesn't fire four requests, short enough that
 * the flyout is already populated by the time the pointer settles.
 */
const HOVER_INTENT_MS = 120;

export type CardQuickBuy = ReturnType<typeof useCardQuickBuy>;

/**
 * Quick buy from a product card — the state machine behind `CardCtaRow` and
 * `CardVariantFlyout`.
 *
 * **Why there is a fetch at all:** the catalog list payload carries
 * `hasVariants` but not `variants` (see `CatalogProduct`), so a card cannot
 * render an option chip — or even decide *which surface* the options belong in
 * — until it has the detail payload. It is requested on hover intent (mouse) or
 * on the first press (touch), against the same query key the PDP uses, so a
 * shopper who then opens the product page pays nothing for it.
 *
 * **The tiering rule** (`optionsFitInline`): no variants buys straight through;
 * one short axis reveals the in-card flyout; anything larger opens the sheet.
 *
 * **The first press always reveals, never buys.** With a variant preselected we
 * could add to the cart on the first tap, but that would put a size the shopper
 * never chose into their cart. So press one shows the options (with the default
 * highlighted) and press two commits — except for a product with no options,
 * which has nothing to reveal and buys immediately.
 */
export function useCardQuickBuy(product: CatalogProduct, ctaOwnsImage = false) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const variable = !!product.hasVariants;
  const [wanted, setWanted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealOnLoad, setRevealOnLoad] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `""` keeps the query disabled (`enabled: !!productSlug`) until something
  // asks for it — a grid of 24 cards must not fetch 24 detail payloads.
  const { data: detail, isFetching } = useStoreProduct(
    slug,
    wanted && variable ? product.slug : "",
  );

  const variants = detail?.variants ?? [];
  // A layout that paints its CTA over the product image (`reveal`) has already
  // taken the space the flyout would use, so those products go to the sheet
  // regardless of how few options they have. Stacking the two instead would
  // cover ~55% of a 158px card image, and letting the flyout replace the CTA
  // would leave the shopper with a chosen size and no button to commit it.
  const fitsInline =
    !ctaOwnsImage && variants.length > 0 && optionsFitInline(variants);
  /** The shopper touched a chip — as opposed to `defaultSelection`'s highlight. */
  const hasPicked = Object.keys(picked).length > 0;
  const selection = hasPicked ? picked : defaultSelection(variants);
  const selected = matchVariant(variants, selection);

  const canBackorder = product.outOfStockBehavior === "backorder";
  const soldOut = product.availableQuantity <= 0 && !canBackorder;
  // Pending covers the gap between the first press and the variants landing —
  // without it the card looks inert for the length of a network round trip.
  const pending = revealOnLoad && isFetching;

  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );

  // The press that arrived before the data did, replayed once it lands.
  // Render-time rather than an effect: the surface should open in the same
  // commit the variants arrive in, and clearing the flag first makes this a
  // one-shot rather than a loop.
  if (revealOnLoad && !isFetching) {
    setRevealOnLoad(false);
    if (variants.length) {
      setRevealed(true);
      if (fitsInline) setFlyoutOpen(true);
      else setSheetOpen(true);
    }
  }

  const commit = useCallback(
    (line: QuickBuyLine, intent: "add" | "buy") => {
      const { qty, ...item } = line;
      addItem(slug, item, qty);
      setFlyoutOpen(false);
      setSheetOpen(false);
      if (intent === "buy") {
        // No toast: arriving at checkout with the item in the cart IS the
        // confirmation, and a toast would land on a screen change.
        router.push(storeHref(base, "/checkout"));
      } else {
        toast.success(t.added);
      }
    },
    [addItem, base, router, slug, t.added],
  );

  /** The card's own line — a product with no options needs no detail payload. */
  const simpleLine = useCallback(
    (): QuickBuyLine => ({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price ?? 0,
      image: thumbImageUrl(product.images?.[0]),
      maxQty: cartLineCap(product.availableQuantity, canBackorder),
      qty: 1,
    }),
    [canBackorder, product],
  );

  const press = useCallback(
    (intent: "add" | "buy") => {
      if (soldOut) return;
      if (!variable) {
        commit(simpleLine(), intent);
        return;
      }
      if (!revealed || (!flyoutOpen && !sheetOpen && !fitsInline)) {
        setWanted(true);
        setRevealOnLoad(true);
        return;
      }
      // **A variant the shopper never chose is never committed.** `revealed` is
      // also set by a 120ms mouse dwell, so without this a desktop shopper who
      // brushed a card and then clicked Add bought whatever `defaultSelection`
      // had highlighted — a size they never picked. Hover may reveal the
      // options; only a pick may buy one.
      if (!hasPicked) {
        setRevealed(true);
        if (fitsInline) setFlyoutOpen(true);
        else setSheetOpen(true);
        return;
      }
      if (!selected || selected.price == null) return;
      const cap = cartLineCap(selected.availableQuantity, canBackorder);
      // The chips disable a sold-out value, but `defaultSelection` falls back to
      // the first variant when none is in stock — so the committed one can still
      // be empty. Checkout would reject it anyway; refusing here keeps it out of
      // the cart instead of putting it there to fail later.
      if (cap === 0) return;
      commit(
        {
          productId: product._id,
          variantId: selected._id,
          variantLabel: selected.label,
          slug: product.slug,
          name: product.name,
          price: selected.price,
          image: thumbImageUrl(selected.images?.[0] ?? product.images?.[0]),
          maxQty: cap,
          qty: 1,
        },
        intent,
      );
    },
    [
      canBackorder,
      commit,
      fitsInline,
      flyoutOpen,
      hasPicked,
      product,
      revealed,
      selected,
      sheetOpen,
      simpleLine,
      soldOut,
      variable,
    ],
  );

  /**
   * Mouse-only, matching the PDP gallery's zoom: a tap also fires
   * `pointerenter`, and treating that as hover would mark the options
   * "revealed" on a device that never showed them.
   */
  const onPointerEnter = useCallback(
    (e: ReactPointerEvent) => {
      if (e.pointerType !== "mouse" || !variable || soldOut) return;
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => {
        setWanted(true);
        // The CSS `:hover` rule is already showing the flyout by now, so the
        // shopper has seen the options — the next press should buy, not reveal.
        setRevealed(true);
      }, HOVER_INTENT_MS);
    },
    [soldOut, variable],
  );

  const onPointerLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  return {
    variable,
    variants,
    fitsInline,
    detail,
    selection,
    selected,
    /**
     * The variant the shopper **explicitly picked**, as opposed to the one
     * `defaultSelection` pre-highlights. The card prices off this: switching
     * the headline price on a default nobody chose would silently rewrite
     * "From ৳600" into a definite price the shopper never asked for. `press`
     * refuses to commit without it, for the same reason.
     */
    chosen: hasPicked ? selected : undefined,
    soldOut,
    pending,
    flyoutOpen,
    sheetOpen,
    press,
    commit,
    onPointerEnter,
    onPointerLeave,
    closeSheet: useCallback(() => setSheetOpen(false), []),
    pick: useCallback((next: Record<string, string>) => {
      setPicked(next);
      setRevealed(true);
    }, []),
  };
}
