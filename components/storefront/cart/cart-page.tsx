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
import { PreviewCartNotice } from "@/components/storefront/preview-cart-notice";

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
 * Rendered by the `/cart` route, and — once a store's cart page has moved onto
 * the builder — by the `cart-lines` core section, which is why this lives beside
 * its layouts rather than in the route folder.
 *
 * Hydration and the empty state are handled HERE rather than in the layouts:
 * both are answers to "should a cart render at all", and an empty cart has no
 * anatomy worth varying.
 *
 * Inside the page editor's frame the basket may be the preview's own sample
 * (`usePreviewCart`, applied in `useCartPage`) — without it a merchant designing
 * their cart page previews the empty-cart card and none of the four layouts.
 * The notice above it is what keeps the sample from reading as a real basket.
 */
export function CartPageView({ layout: chosen }: { layout?: StoreTemplates["cartLayout"] }) {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const draft = useSfPreview((s) => s.cartLayout);
  const api = useCartPage();

  /* Precedence: the Customize draft (the merchant is watching it repaint), then
     the cart section's own choice once this page is on the builder, then the
     store's template. The section setting sits UNDER the draft for the same
     reason every other value here does — an editor preview that ignored the
     draft would look broken while it was being dragged. */
  const layout = isCartLayout(draft)
    ? draft
    : (chosen ?? resolveTemplates(store).cartLayout);
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
    // `data-preview-interactive` exempts this subtree's controls from the page
    // editor's click capture, so the sample's stepper and remove button work.
    // Only ever set on a sample — see `page-draft-preview.tsx`.
    <div style={wrap} data-preview-interactive={api.sampleCart ? "" : undefined}>
      {api.sampleCart ? <PreviewCartNotice text={api.t.previewSampleCart} /> : null}
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
