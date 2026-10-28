"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { storefrontApi, type CatalogProduct } from "@/lib/storefront-client";
import { cartAnonymousId, isSfPreview } from "@/services/storefront/cart-identity";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useWishlistStore, wishItemOf } from "@/services/stores/use-wishlist-store";

/** A heart tapped a few times in a row is one change, not five requests. */
const DEBOUNCE_MS = 1500;

/** Claims already made this page load — keyed by store + shopper + handle. */
const claimed = new Set<string>();

const toItems = (cards: CatalogProduct[]) => cards.map((c) => wishItemOf(c, !!c.hasVariants));

/**
 * Mirrors the browser's wishlist to the server and keeps the two agreeing
 * (backend `docs/plan/wishlist.md`, Phase 2). Renders nothing. Built like
 * `CartSync`, for the same reasons: one place no heart can forget, and store
 * subscriptions inside an effect so it never re-renders the shell.
 *
 * - **Guest:** the browser is the editor. Every change is sent (debounced); the
 *   first send of a page load also folds the live prices and stock back in, and
 *   drops products the shop no longer sells.
 * - **Signing in** (or loading with a live session): the browser's list is
 *   CLAIMED into the account and the merged result adopted, so items saved on
 *   another device arrive here and the next sync cannot undo the merge.
 * - **Signing out:** this store's list is cleared from the browser. The account
 *   keeps it, so it comes back on the next sign-in, and the next person to use a
 *   shared phone does not inherit someone else's saved items.
 *
 * Fire-and-forget throughout: a wishlist must never show a shopper an error.
 */
export function WishlistSync({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;
    // The Customize preview renders the real shop; a merchant tapping hearts
    // while theming must not write a wishlist into their own statistics.
    if (isSfPreview()) return;
    const anonymousId = cartAnonymousId(slug);
    if (!anonymousId) return;

    const { refresh, adopt, clearStore } = useWishlistStore.getState();
    const ids = () => (useWishlistStore.getState().lists[slug] ?? []).map((i) => i.productId);
    const session = () => {
      const s = useShopperStore.getState();
      return s.slug === slug && s.token && s.shopper?.id
        ? { token: s.token, shopperId: s.shopper.id }
        : null;
    };
    const keyOf = (shopperId: string, productIds: string[]) =>
      JSON.stringify([shopperId, productIds]);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSent = "";

    const send = (opts: { keepalive?: boolean; refreshAfter?: boolean } = {}) => {
      const productIds = ids();
      const auth = session();
      const key = keyOf(auth?.shopperId ?? "", productIds);
      if (key === lastSent) return;
      lastSent = key;
      void storefrontApi
        .syncWishlist(slug, { anonymousId, productIds }, auth?.token, opts.keepalive)
        .then((res) => {
          if (opts.refreshAfter) refresh(slug, productIds, toItems(res.items));
        })
        .catch(() => {
          // Let the next change retry rather than desync for good.
          lastSent = "";
        });
    };

    const flush = (keepalive = false) => {
      if (!timer) return;
      clearTimeout(timer);
      timer = undefined;
      send({ keepalive });
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        send();
      }, DEBOUNCE_MS);
    };

    const claim = () => {
      const auth = session();
      if (!auth) return false;
      const marker = `${slug}:${auth.shopperId}:${anonymousId}`;
      if (claimed.has(marker)) return true;
      claimed.add(marker);
      void storefrontApi
        .claimWishlist(slug, auth.token, { anonymousId, productIds: ids() })
        .then((res) => {
          adopt(slug, toItems(res.items));
          lastSent = keyOf(auth.shopperId, res.items.map((c) => c._id));
        })
        .catch(() => {
          claimed.delete(marker);
        });
      return true;
    };

    let unsubscribe: (() => void) | undefined;
    const start = () => {
      if (!claim()) {
        // A visitor who never saved anything costs no request.
        if (ids().length > 0) send({ refreshAfter: true });
        else lastSent = keyOf("", []);
      }
      const offWishlist = useWishlistStore.subscribe((s, prev) => {
        if (s.lists[slug] !== prev.lists[slug]) schedule();
      });
      let prevToken = session()?.token ?? null;
      const offShopper = useShopperStore.subscribe(() => {
        const token = session()?.token ?? null;
        if (token && token !== prevToken) claim();
        if (!token && prevToken) {
          if (timer) clearTimeout(timer);
          timer = undefined;
          clearStore(slug);
          lastSent = keyOf("", []);
        }
        prevToken = token;
      });
      unsubscribe = () => {
        offWishlist();
        offShopper();
      };
    };

    // The persisted list hydrates after first render; syncing before that would
    // push an empty list over a real one.
    if (useWishlistStore.persist.hasHydrated()) {
      start();
    } else {
      const done = useWishlistStore.persist.onFinishHydration(() => start());
      unsubscribe = () => done();
    }

    // A heart tapped just before the tab closes is the save most worth keeping.
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

  return null;
}
