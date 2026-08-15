"use client";
// coding-standard: maintained

import { type CSSProperties } from "react";
import type { StoreTemplates } from "@/lib/storefront-client";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { resolveTemplates } from "@/lib/storefront-templates";
import { useCartPage } from "@/components/storefront/cart/use-cart-page";
import {
  CartHeading,
  EmptyCart,
} from "@/components/storefront/cart/cart-blocks";
import {
  CardsCart,
  CompactCart,
  EditorialCart,
  PanelCart,
} from "@/components/storefront/cart/cart-layouts";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

/**
 * The cart — **one of four whole layouts**, chosen by `templates.cartLayout`.
 *
 * `useCartPage` owns the arithmetic, and the delivery estimate is the reason
 * that split matters: the zone is only known at checkout, so the cart quotes the
 * cheapest possible fee prefixed "From". A layout that flattened that into a
 * single number would understate the delivery charge, which is the largest
 * single cause of abandonment.
 *
 * Hydration and the empty state are handled HERE rather than in the layouts:
 * both are answers to "should a cart render at all", and an empty cart has no
 * anatomy worth varying.
 */
export default function CartPage() {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const draft = useSfPreview((s) => s.cartLayout);
  const api = useCartPage();

  const layout = isCartLayout(draft) ? draft : resolveTemplates(store).cartLayout;
  const Layout = CART_LAYOUTS[layout] ?? PanelCart;

  // The cart lives in a persisted (localStorage) store the server can't read.
  // Hold the neutral shell until hydration so the first client render matches
  // the SSR HTML — otherwise React hydration mismatches and the empty-cart CTA
  // flashes before the persisted items appear.
  if (!api.hydrated) return <div style={wrap} aria-busy="true" />;

  if (api.items.length === 0) {
    return (
      <div style={wrap}>
        <CartHeading api={api} />
        <EmptyCart api={api} />
      </div>
    );
  }

  return (
    <div style={wrap}>
      <Layout api={api} />
    </div>
  );
}

const CART_LAYOUTS: Record<StoreTemplates["cartLayout"], typeof PanelCart> = {
  panel: PanelCart,
  compact: CompactCart,
  cards: CardsCart,
  editorial: EditorialCart,
};

function isCartLayout(v: unknown): v is StoreTemplates["cartLayout"] {
  return v === "panel" || v === "compact" || v === "cards" || v === "editorial";
}
