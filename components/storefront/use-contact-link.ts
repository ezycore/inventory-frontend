"use client";
// coding-standard: maintained

import type { StorefrontStore } from "@/lib/storefront-client";
import {
  resolveChannels,
  type ContactChannelSpec,
} from "@/lib/storefront-contact-channels";
import {
  buildContactMessage,
  isPageAllowed,
  pageOf,
} from "@/lib/storefront-contact-message";
import { useHydrated } from "@/hooks/use-hydrated";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useSfContact } from "@/services/stores/use-sf-contact-store";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import type { ContactButtonPage, ContactChannelKind } from "@/types";
import type { Dict } from "@/lib/storefront-i18n";

export interface ResolvedContactChannel {
  kind: ContactChannelKind;
  value: string;
  label: string;
  spec: ContactChannelSpec;
}

export interface ContactLink {
  page: ContactButtonPage | null;
  position: "right" | "left";
  label: string;
  channels: ResolvedContactChannel[];
  /** The prefilled message, already resolved for this page. */
  message: string;
  storeName: string;
  hours: NonNullable<StorefrontStore["contactButton"]>["hours"];
  nudge: NonNullable<StorefrontStore["contactButton"]>["nudge"];
  /** Build the outbound href for a channel, honouring its prefill capability. */
  hrefFor: (channel: ResolvedContactChannel) => string;
}

/**
 * Everything both contact surfaces need: the floating launcher in `StoreShell`
 * and the inline "Ask about this" button on the product page.
 *
 * They share this rather than each resolving the config, because the two would
 * otherwise disagree the moment one of them is changed — the inline button would
 * keep offering a channel the merchant disabled, or send a message the launcher
 * had learned to build differently.
 *
 * Returns `null` whenever no contact surface should render at all: no config
 * (the backend omits the block when the switch is off), a page the merchant
 * excluded, a suppressed route, or nothing resolving to a usable channel.
 */
export function useContactLink(store?: StorefrontStore, base = ""): ContactLink | null {
  const pathname = useStorePathname();
  const { t } = useStorefrontUI();
  // The Customize editor streams its unsaved draft so the merchant sees the
  // button appear the instant they flip the switch. `undefined` means "nothing
  // drafted"; `null` is a real draft meaning "switched off", so `??` is wrong here.
  const draft = useSfPreview((s) => s.contactButton);
  const config = draft !== undefined ? draft : store?.contactButton;
  const published = useSfContact((s) => s.context);
  // The cart is a localStorage-persisted zustand store, and zustand rehydrates
  // it SYNCHRONOUSLY — so on the client it already holds the shopper's items on
  // the very first render, while the server rendered zero. That count reaches
  // the `href` of a rendered <a>, so using it unmasked is a hydration mismatch
  // on /cart and /checkout. `useHydrated` holds it at 0 for the hydration render
  // and the real count lands on the pass after, exactly as the cart page itself
  // does. Do not "simplify" this away.
  const hydrated = useHydrated();
  const liveCartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0),
  );
  const cartCount = hydrated ? liveCartCount : 0;

  const page = pageOf(pathname, base);
  if (!config || !isPageAllowed(config.showOn, page)) return null;

  const channels = resolveChannels(config.channels ?? []);
  if (channels.length === 0) return null;

  const storeName = store?.name ?? "";
  const message = buildContactMessage(
    config.greeting,
    storeName,
    contextFor(page, t, published, cartCount),
  );

  return {
    page,
    position: config.position === "left" ? "left" : "right",
    label: config.label?.trim() || labelFor(page, t),
    channels,
    message,
    storeName,
    hours: config.hours,
    nudge: config.nudge,
    // A platform that cannot show the shopper a prefilled message gets no
    // message at all rather than a parameter it will silently drop.
    hrefFor: (channel) =>
      channel.spec.href(channel.value, channel.spec.prefill === "text" ? message : ""),
  };
}

/**
 * The launcher's own label, per page. A merchant's `label` overrides all of
 * these — they are what a shopper sees when none was written, and they are the
 * difference between a generic "Chat with us" on the checkout page and an offer
 * to finish the order in the chat instead.
 */
function labelFor(page: ContactButtonPage | null, t: Dict): string {
  switch (page) {
    case "product":
      return t.askAboutThis;
    case "cart":
      return t.chatNeedHelp;
    case "checkout":
      return t.chatOrderInstead;
    case "order":
      return t.chatTrackOrder;
    default:
      return t.chatWithUs;
  }
}

/**
 * The sentence the shopper's message ends with.
 *
 * A page that knows something specific — the product, the order — publishes it
 * through `usePublishContactContext`, and that always wins. Cart and checkout
 * derive theirs here instead: the cart store is already global, so wiring two
 * more pages to publish a number they both already read would be duplication.
 */
function contextFor(
  page: ContactButtonPage | null,
  t: Dict,
  published: string | null,
  cartCount: number,
): string | undefined {
  if (published) return published;
  if ((page === "cart" || page === "checkout") && cartCount > 0) {
    return t.ctxCart.replace("{count}", String(cartCount));
  }
  return undefined;
}
