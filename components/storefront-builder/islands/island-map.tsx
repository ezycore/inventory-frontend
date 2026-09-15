"use client";
// coding-standard: maintained

import dynamic from "next/dynamic";
import type { ComponentProps, ComponentType } from "react";

/**
 * The only way a Storefront Builder section loads client code.
 *
 * Spike B (plan §2.7) tested every way of mixing server sections with client
 * islands. Importing an island into a server module — statically, or through
 * `next/dynamic` — merged every island into one chunk that every page
 * downloaded. Only this shape split them: a `"use client"` module holding one
 * `next/dynamic(() => import(...))` per island type. A page without a product
 * grid then downloads no product-card code at all.
 *
 * So: a section view renders `<Island name="…" props={…} />` and never imports
 * a client component itself. Props cross the server → client boundary, so they
 * must be serializable.
 */
const ISLANDS = {
  "product-cards": dynamic(() =>
    import("./product-cards").then((module) => module.ProductCardsIsland),
  ),
  "product-rail": dynamic(() =>
    import("@/components/storefront/home/product-rail-track").then((module) => module.ProductRailTrack),
  ),
  "hero-carousel": dynamic(() =>
    import("@/components/storefront/hero-carousel").then((module) => module.HeroCarousel),
  ),
  "hero-fullbleed": dynamic(() =>
    import("@/components/storefront/home/hero-fullbleed").then((module) => module.HeroFullBleedView),
  ),
  "campaign-offers": dynamic(() =>
    import("./campaign-offers").then((module) => module.CampaignOffersIsland),
  ),
  /** A category strip's paging arrows; the tiles arrive as server-rendered children. */
  "category-strip": dynamic(() =>
    import("@/components/storefront/home/category-strip").then((module) => module.CategoryStrip),
  ),
  /** A landing page's order form: one product's options and the store's checkout. */
  "order-form": dynamic(() =>
    import("./order-form").then((module) => module.OrderFormIsland),
  ),
  /** One product with the product page's photos, options, price and buy controls. */
  "single-product": dynamic(() =>
    import("./single-product").then((module) => module.SingleProductIsland),
  ),
  /** An offer's price block, worded in the shopper's language. */
  "offer-price": dynamic(() =>
    import("./offer-price").then((module) => module.OfferPriceIsland),
  ),
  /** A phone bar pinned to the bottom, leading to the page's order form. */
  "sticky-order-bar": dynamic(() =>
    import("./sticky-order-bar").then((module) => module.StickyOrderBarIsland),
  ),
  /** A video's click-to-load cover; the provider's player loads on press. */
  video: dynamic(() => import("./video").then((module) => module.VideoIsland)),
  /** The storefront's own wording, in the shopper's language, where the merchant typed none. */
  "store-word": dynamic(() => import("./store-word").then((module) => module.StoreWordIsland)),
  /** A landing page's id, remembered for the order this visit may end in. Renders nothing. */
  "visit-source": dynamic(() =>
    import("@/components/storefront/visit-source-capture").then((module) => module.VisitSourceCapture),
  ),
};

export type IslandName = keyof typeof ISLANDS;
export type IslandProps<N extends IslandName> = ComponentProps<(typeof ISLANDS)[N]>;

export function Island<N extends IslandName>({
  name,
  props,
}: {
  name: N;
  props: IslandProps<N>;
}) {
  const Component = ISLANDS[name] as ComponentType<IslandProps<N>>;
  return <Component {...props} />;
}
