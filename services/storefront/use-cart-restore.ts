// coding-standard: maintained
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storefrontApi } from "@/lib/storefront-client";
import { toast } from "@/lib/storefront-toast";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { useCartStore } from "@/services/stores/use-cart-store";

/**
 * Handles the `?recover=<token>` link from an abandoned-cart email
 * (backend `docs/plan/abandoned-cart.md`, Phase 3).
 *
 * The shopper usually arrives on a **different device** from the one that built
 * the cart — that is the whole reason the link exists — so the cart is rebuilt
 * from the server payload rather than from whatever `localStorage` holds here.
 *
 * Three things it must get right:
 * - **Strip the token from the URL** once used. It is a bearer credential; leaving
 *   it in the address bar puts it in history, in any shared link, and in the
 *   `Referer` of every outbound click.
 * - **Run once.** A `ref` guard, not just the effect deps: React 18 StrictMode
 *   double-invokes effects in dev, and the second call would hit an
 *   already-consumed token and show the shopper a spurious error.
 * - **Say what changed.** `removedCount > 0` means items were dropped as no longer
 *   available; the shopper came back for specific things, so a quietly shorter
 *   cart is the one outcome worse than the abandonment.
 */
export function useCartRestore(slug: string) {
  const router = useRouter();
  const pathname = useStorePathname();
  const params = useSearchParams();
  const { t } = useStorefrontUI();
  const restore = useCartStore((s) => s.restore);
  const done = useRef(false);

  const token = params.get("recover");

  useEffect(() => {
    if (!slug || !token || done.current) return;
    done.current = true;

    // Drop the token from the URL immediately — before the request resolves, so a
    // slow network can't leave it exposed in the address bar meanwhile.
    router.replace(pathname, { scroll: false });

    void storefrontApi
      .restoreCart(slug, token)
      .then((cart) => {
        if (!cart.items.length) {
          toast.error(t.cartRestoreEmpty);
          return;
        }
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
        toast.success(
          cart.removedCount > 0
            ? t.cartRestoredPartial.replace("{n}", String(cart.removedCount))
            : t.cartRestored,
        );
      })
      .catch(() => {
        // Expired or already-used link. Their cart may well still be here, so the
        // message says that rather than implying everything is lost.
        toast.error(t.cartRestoreExpired);
      });
  }, [slug, token, pathname, router, restore, t]);
}
