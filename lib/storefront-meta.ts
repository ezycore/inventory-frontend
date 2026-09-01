// coding-standard: maintained
import { isSfPreview } from "@/services/storefront/cart-identity";
import type { StorefrontStore } from "@/lib/storefront-client";

/**
 * The Meta Pixel wrapper — the only place the storefront talks to `fbq`.
 *
 * Backend plan: `easystock-backend/docs/plan/meta-pixel-capi.md`.
 *
 * ## `Purchase` is never sent from here
 *
 * The Pixel reports the browsing journey — `PageView`, `ViewContent`, `AddToCart`,
 * `InitiateCheckout` — and nothing else. The sale is reported server-side through the
 * Conversions API when the order reaches the merchant's chosen trigger, so the same order can
 * never be counted at two different moments.
 *
 * That is enforced, not merely intended: `MetaBrowserEvent` has no `Purchase` member, so a
 * browser purchase does not type-check, and an eslint rule rejects the string literal reaching
 * `fbq` for anyone who reaches past this module.
 *
 * ## Everything here fails silently
 *
 * An ad blocker is the normal case, not an error — roughly a third of shoppers have one. A
 * tracking call must never surface an error, break a click, or block a purchase, so every export
 * swallows its own failure exactly as `CartSync` does.
 */

/** The browser events this storefront may send. `Purchase` is deliberately not a member. */
export type MetaBrowserEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout";

/** `window.fbq`, as much of it as we call. */
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/** Content payload shared by `ViewContent`, `AddToCart` and `InitiateCheckout`. */
export interface MetaContentPayload {
  currency?: string;
  value?: number;
  /** `productId`, or `productId:variantId` for a variant line — matches what CAPI sends. */
  content_ids?: string[];
  contents?: { id: string; quantity: number; item_price: number }[];
  content_name?: string;
  content_type?: "product";
  /** `InitiateCheckout` only — Meta documents `num_items` for that event alone. */
  num_items?: number;
}

/**
 * `sessionStorage` key holding the `fbclid` seen on this visit.
 *
 * Captured because the `_fbc` cookie only exists once the Pixel has run on a page carrying
 * `?fbclid=`, and the shopper may land with the script still loading, blocked, or on a store
 * whose pixel is off. Checkout reconstructs `fbc` from this when the cookie is missing.
 * `sessionStorage`, not `localStorage`: a click id belongs to the visit it arrived on.
 */
const FBCLID_KEY = "ezy-fbclid";

/**
 * The single line-identity rule, shared with the server.
 *
 * A product and one of its variants are different sellable things, so they are different content
 * ids — and the value must be identical in the browser event, in the CAPI `Purchase`, and in any
 * future catalog feed, or Meta treats them as three unrelated products.
 */
export const metaContentId = (productId: string, variantId?: string): string =>
  variantId ? `${productId}:${variantId}` : productId;

/** Read a cookie by name. Returns `undefined` rather than throwing where cookies are blocked. */
const readCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Remember this visit's `fbclid`, if the shopper arrived with one.
 *
 * Called once on mount. Deliberately does not clear a previously stored value when the current
 * URL has none: the shopper clicks the ad once and then browses, and every page after the first
 * would otherwise erase the click that brought them.
 */
export const captureFbclid = (): void => {
  if (typeof window === "undefined") return;
  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (!fbclid) return;
    window.sessionStorage.setItem(
      FBCLID_KEY,
      // The click id alone is not the `_fbc` value — the creation time is half of it, and it has
      // to be the moment the click was SEEN, not the moment checkout reads it back.
      JSON.stringify({ fbclid, at: Date.now() }),
    );
  } catch {
    // Private mode / storage disabled. Attribution degrades; nothing breaks.
  }
};

/**
 * The `_fbc` value for this visit: the cookie the Pixel set, or one rebuilt from the stored
 * `fbclid` when there is no cookie.
 *
 * Format is Meta's: `fb.{subdomainIndex}.{creationTime}.{fbclid}`. `subdomainIndex` is `1`
 * because the storefront sets its cookie on the domain the shopper is browsing.
 */
export const resolveFbc = (): string | undefined => {
  const cookie = readCookie("_fbc");
  if (cookie) return cookie;
  try {
    const raw = window.sessionStorage.getItem(FBCLID_KEY);
    if (!raw) return undefined;
    const stored = JSON.parse(raw) as { fbclid?: string; at?: number };
    if (!stored.fbclid || !stored.at) return undefined;
    return `fb.1.${stored.at}.${stored.fbclid}`;
  } catch {
    return undefined;
  }
};

/** The `_fbp` browser id the Pixel sets. Absent until the script has run at least once. */
export const resolveFbp = (): string | undefined => readCookie("_fbp");

/**
 * The attribution block checkout sends with the order.
 *
 * The server cannot read these itself: they are first-party cookies on the storefront's host and
 * the API lives on another one, so a cross-site request never carries them. The order must not
 * depend on any of it — every field is optional, and a blocked-cookie shopper still checks out.
 */
export const metaCheckoutAttribution = (): {
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
} | undefined => {
  if (typeof window === "undefined" || isSfPreview()) return undefined;
  const fbp = resolveFbp();
  const fbc = resolveFbc();
  const eventSourceUrl = window.location.href;
  // Nothing to attribute with — send no block at all rather than a URL on its own.
  if (!fbp && !fbc) return undefined;
  return { fbp, fbc, eventSourceUrl };
};

/**
 * Is this event allowed to fire right now?
 *
 * Two guards beyond "is the pixel configured", and both were learned elsewhere in this codebase:
 * the Customize editor renders the REAL storefront in an iframe at `?preview=1`, so a merchant
 * theming their shop would otherwise pollute their own funnel with visits they never had
 * (`CartSync` refuses to write for the same reason); and an ad blocker leaves `window.fbq`
 * undefined, which is ordinary rather than exceptional.
 */
const canSend = (
  store: StorefrontStore | undefined,
  event: MetaBrowserEvent,
): boolean => {
  if (typeof window === "undefined") return false;
  if (!store?.meta?.pixelId) return false;
  if (isSfPreview()) return false;
  if (typeof window.fbq !== "function") return false;
  const events = store.meta.events;
  if (event === "PageView") return events.pageView;
  if (event === "ViewContent") return events.viewContent;
  if (event === "AddToCart") return events.addToCart;
  return events.initiateCheckout;
};

/**
 * Send one browser event.
 *
 * Every call carries an `eventID`. Nothing deduplicates against it today — the server sends no
 * browser-side event — but it costs one field and is what makes a future server-side
 * `ViewContent`/`AddToCart` deduplicate instead of double-counting on the day someone adds one.
 */
export const trackMetaEvent = (
  store: StorefrontStore | undefined,
  event: MetaBrowserEvent,
  payload?: MetaContentPayload,
  eventId?: string,
): void => {
  if (!canSend(store, event)) return;
  try {
    window.fbq?.(
      "track",
      event,
      payload ?? {},
      { eventID: eventId ?? `${event}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}` },
    );
  } catch {
    // Tracking must never break a shopper's interaction.
  }
};
