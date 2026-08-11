"use client";
// coding-standard: maintained

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { storefrontApi } from "@/lib/storefront-client";
import { toast } from "@/lib/storefront-toast";
import { cartAnonymousId, isSfPreview } from "@/services/storefront/cart-identity";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore, type CartItem } from "@/services/stores/use-cart-store";
import { useShopperStore } from "@/services/stores/use-shopper-store";

/** Long enough to collapse a burst of quantity taps, short enough that the
 *  unload flush is a backstop rather than the main path. */
const DEBOUNCE_MS = 2000;

/** Claims already made this page load — keyed by store + shopper + handle. */
const claimed = new Set<string>();

/**
 * Mirrors the browser cart to the server so the merchant can see abandoned carts
 * (backend `docs/plan/abandoned-cart.md`, Phase 1). Renders nothing.
 *
 * **Why one component instead of instrumenting the cart store's call sites:**
 * `addItem`/`updateQty`/`removeItem`/`clear` are called from eight places across
 * seven files today, and the card quick-buy site was added on 2026-08-01 — the set
 * grows, and a new CTA would silently stop reporting with nothing failing. One
 * transient subscription can't be forgotten.
 *
 * **Why it never subscribes reactively:** it reads the cart through
 * `useCartStore.subscribe` inside an effect, not through the hook selector. A
 * selector here would re-render the whole storefront chrome on every quantity
 * tap, since this mounts inside `StoreShell`.
 *
 * Everything it does is fire-and-forget analytics: every call swallows its own
 * failure, because a shopper must never see an error — or a blocked interaction —
 * from a feature that exists for the merchant.
 */
export function CartSync({ slug }: { slug: string }) {
  const pathname = usePathname();
  // Zustand actions are stable references, so this adds no render churn.
  const restore = useCartStore((s) => s.restore);
  // Held in a ref so a locale change can't re-run the claim effect — its deps
  // must stay narrow or a re-render would re-issue the network call. Written in
  // an effect, never during render (refs are not a render-time channel).
  const { t } = useStorefrontUI();
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // ---- cart mirror -------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;
    // The Customize editor renders the REAL storefront in an iframe at
    // `?preview=1`. Without this, a merchant theming their shop and tapping
    // "Add to cart" would pollute their own funnel with carts they never had.
    if (isSfPreview()) return;

    const anonymousId = cartAnonymousId(slug);
    if (!anonymousId) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: CartItem[] | null = null;
    let lastSent = "";
    // An empty cart is only worth reporting once it has been non-empty: a
    // visitor who never adds anything must not create a cart document, but a
    // shopper who removes their last item must not leave a stale mirror behind.
    let everHadItems = false;

    const send = (items: CartItem[], keepalive = false) => {
      const payload = items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
      const fingerprint = JSON.stringify(payload);
      if (fingerprint === lastSent) return;
      lastSent = fingerprint;
      void storefrontApi
        .syncCart(slug, { anonymousId, items: payload }, keepalive)
        .catch(() => {
          // Let the next change retry: a dropped sync must not permanently
          // desync the mirror just because the shopper was briefly offline.
          lastSent = "";
        });
    };

    const flush = (keepalive = false) => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      const items = pending;
      pending = null;
      if (!items) return;
      if (items.length === 0 && !everHadItems) return;
      send(items, keepalive);
    };

    const schedule = (items: CartItem[]) => {
      if (items.length > 0) everHadItems = true;
      pending = items;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => flush(), DEBOUNCE_MS);
    };

    const observe = () => {
      const state = useCartStore.getState();
      // A cart belonging to another store is not this store's to mirror; the
      // store-switch reset (`setStore`) surfaces here as an empty list, which
      // `everHadItems` already keeps from being reported as a removal.
      if (state.storeSlug !== slug) return;
      if (state.items.length > 0) everHadItems = true;
      schedule(state.items);
    };

    // The persisted cart hydrates AFTER first render. Subscribing before that
    // would push an empty list over a real server-side cart.
    const start = () => {
      observe();
      return useCartStore.subscribe(observe);
    };

    let unsubscribe: (() => void) | undefined;
    if (useCartStore.persist.hasHydrated()) {
      unsubscribe = start();
    } else {
      const done = useCartStore.persist.onFinishHydration(() => {
        unsubscribe = start();
      });
      unsubscribe = () => done();
    }

    // The debounce is what loses the most interesting shopper: add an item, close
    // the tab 1.5s later. `pagehide` fires on close AND on bfcache navigation;
    // `visibilitychange` covers the mobile case of switching apps, where
    // `pagehide` may never come. `keepalive` lets the request outlive the page.
    const onLeave = () => flush(true);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onLeave();
    };
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe?.();
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slug]);

  // ---- claim the cart onto a signed-in shopper ---------------------------
  // Fires on sign-in AND on mount for an already-signed-in shopper. Both matter:
  // doing this only inside the login mutation would miss every returning shopper
  // with a live persisted session, whose cart would then never be attributable —
  // and `markConvertedForShopper` on the backend keys off exactly this link.
  //
  // The response is **adopted, not discarded**: signing in merges the carts this
  // shopper left on other devices into this one, server-side. If this device kept
  // its own items, the next debounced sync would push them over the merge and
  // undo it — so adopting is what makes cross-device carts actually work.
  useEffect(() => {
    if (typeof window === "undefined" || !slug || isSfPreview()) return;

    const claim = (token: string | null, shopperId: string | undefined) => {
      if (!token || !shopperId) return;
      const anonymousId = cartAnonymousId(slug);
      if (!anonymousId) return;
      const marker = `${slug}:${shopperId}:${anonymousId}`;
      if (claimed.has(marker)) return;
      claimed.add(marker);
      void storefrontApi
        .claimCart(slug, token, anonymousId)
        .then((cart) => {
          // Only rewrite the local cart when the server actually folded something
          // in. With nothing merged the two are already the same, and replacing
          // it would fight whatever the shopper is doing right now.
          if (cart.mergedCount > 0 && cart.items.length) {
            restore(
              slug,
              cart.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                variantLabel: item.variantLabel,
                slug: item.slug,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                maxQty: item.maxQty,
              })),
            );
            toast.success(tRef.current.cartMerged);
          }
        })
        .catch(() => {
          // Allow a retry on the next auth change / mount.
          claimed.delete(marker);
        });
    };

    const state = useShopperStore.getState();
    if (state.slug === slug) claim(state.token, state.shopper?.id);

    return useShopperStore.subscribe((s) => {
      if (s.slug === slug) claim(s.token, s.shopper?.id);
    });
  }, [slug, restore]);

  // ---- funnel step: reached checkout -------------------------------------
  // Read from the pathname here rather than from an effect inside the checkout
  // view, so the checkout page — a money path — is not touched by an analytics
  // feature. The backend stamp is first-write-wins, so repeat calls are free.
  useEffect(() => {
    if (typeof window === "undefined" || !slug || isSfPreview()) return;
    if (!pathname?.includes("/checkout")) return;
    if (useCartStore.getState().items.length === 0) return;

    const anonymousId = cartAnonymousId(slug);
    if (!anonymousId) return;
    void storefrontApi.markCheckoutStarted(slug, anonymousId).catch(() => {});
  }, [slug, pathname]);

  return null;
}
