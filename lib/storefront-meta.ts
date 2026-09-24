// coding-standard: maintained
import { isSfPreview } from "@/services/storefront/cart-identity";
import { storefrontItemId } from "@/lib/storefront-item-id";
import { alreadySent, rememberSent } from "@/lib/storefront-sent-once";
import type { StorefrontStore } from "@/lib/storefront-client";

/**
 * The Meta Pixel wrapper — the only place the storefront talks to `fbq`.
 *
 * Backend plan: `easystock-backend/docs/plan/meta-pixel-capi.md`.
 *
 * ## `Purchase` leaves here only through `trackMetaPurchase`
 *
 * The Pixel always reports the browsing journey — `PageView`, `ViewContent`, `AddToCart`,
 * `InitiateCheckout`. The sale is reported server-side through the Conversions API when the
 * order reaches the merchant's chosen trigger, and that half is never optional.
 *
 * A merchant may ALSO switch on a browser `Purchase` (`store.meta.events.purchase`, off by
 * default), because some ad optimisation and Advanced Matching flows want the event with the
 * shopper's own cookies behind it. When they do, both halves carry the same `event_id` —
 * `metaPurchaseEventId(orderNumber)` — and Meta collapses them into one conversion.
 *
 * **That collapse has a 48-hour limit, and it is the whole risk of the setting.** Meta only
 * deduplicates events received within 48 hours of each other. The browser half fires at
 * checkout; the server half fires at the store's `purchaseTrigger`. So `pending` is seconds
 * apart and always safe, `confirmed` is safe if the merchant confirms within two days, and
 * `delivered` is routinely outside the window — two conversions for one sale. The settings UI
 * says this at the point of choice; nothing here second-guesses the merchant's answer.
 *
 * `trackMetaPurchase` is the only sanctioned path, and the eslint rule still rejects a
 * `Purchase` literal handed straight to `fbq` anywhere in the repo — including this file, which
 * passes the event name through as a variable.
 *
 * ## Everything here fails silently
 *
 * An ad blocker is the normal case, not an error — roughly a third of shoppers have one. A
 * tracking call must never surface an error, break a click, or block a purchase, so every export
 * swallows its own failure exactly as `CartSync` does.
 */

/**
 * The browser events this storefront may send.
 *
 * `Purchase` is a member, but it is not reachable through `trackMetaEvent` with an ad-hoc
 * payload — `trackMetaPurchase` is its one caller, because the shared `event_id` is what keeps
 * it from double-counting and a hand-built call would omit it.
 */
export type MetaBrowserEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

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
  /** `Purchase` only. The same order number the CAPI half sends, so the pair reconciles. */
  order_id?: string;
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
  storefrontItemId(productId, variantId);

/**
 * The `Purchase` deduplication id — **the same cross-repo contract as `metaContentId`.**
 *
 * The backend builds this exact string in `easystock-backend/src/services/meta/`
 * `meta-purchase.service.ts` (`purchaseEventId`) for the Conversions API event. Meta merges a
 * browser event and a server event into ONE conversion only when `event_name` and `event_id`
 * both match, so a drift of a single character here turns the merchant's dashboard into double
 * revenue rather than into an error anyone would see. Change one side, change both, and both
 * tests.
 */
export const metaPurchaseEventId = (orderNumber: string): string =>
  `purchase_${orderNumber}`;

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
  if (event === "InitiateCheckout") return events.initiateCheckout;
  // Opt-in, and `=== true` rather than a truthy read: an older store payload that predates the
  // field arrives with `purchase` undefined, and a browser Purchase fired by accident is a
  // duplicate conversion the merchant cannot delete from Meta.
  return events.purchase === true;
};

/**
 * Send one browser event.
 *
 * Every call carries an `eventID`. For `Purchase` it is the shared, deterministic id the server
 * also sends and it is what stops the sale being counted twice, so `trackMetaPurchase` always
 * passes one. For the journey events nothing deduplicates against it yet — the server sends no
 * browser-side counterpart — but it costs one field and is what makes a future server-side
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

/**
 * The order the thank-you screen just received. Structurally the placement response, narrowed to
 * what a `Purchase` needs — so a test can build one without a whole `StorefrontOrder`.
 */
export interface MetaPurchaseOrder {
  orderNumber: string;
  totalAmount: number;
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }[];
  fulfillmentType?: "delivery" | "pickup";
}

/**
 * Every `event_id` this browser has already reported, so one order is one event — see
 * `lib/storefront-sent-once.ts`. Meta would very likely collapse a repeat anyway (same
 * `event_name`, same `event_id`), but "very likely" is not a guarantee we get to make on a
 * merchant's revenue.
 */
const SENT_PURCHASES_KEY = "ezy-meta-purchases";

/**
 * Report the sale from the browser, when the merchant has asked for it.
 *
 * Called once, from checkout's `onSuccess` — the only moment the shopper's browser and the
 * order number exist together. Silent unless `store.meta.events.purchase` is on; the Conversions
 * API reports the sale either way and is unaffected by anything here.
 *
 * The `event_id` is `metaPurchaseEventId(orderNumber)`, identical to the server's, which is what
 * makes the pair one conversion rather than two. Content ids are built with `metaContentId` for
 * the same reason: the two halves must describe the same catalogue items.
 *
 * `value` is `totalAmount` — what the buyer owes, matching the CAPI half exactly. Taking the
 * subtotal here and the total there would report two different amounts for one sale and quietly
 * break the merchant's ROAS.
 */
export const trackMetaPurchase = (
  store: StorefrontStore | undefined,
  order: MetaPurchaseOrder,
): void => {
  if (!canSend(store, "Purchase")) return;
  const eventId = metaPurchaseEventId(order.orderNumber);
  if (alreadySent(SENT_PURCHASES_KEY, eventId)) return;

  const contents = order.items.map((item) => ({
    id: metaContentId(item.productId, item.variantId),
    quantity: item.quantity,
    item_price: item.price,
  }));

  // Marked BEFORE the send, not after: `trackMetaEvent` swallows its own failures, so a thrown
  // `fbq` would otherwise leave the id unrecorded and let a re-render try again.
  rememberSent(SENT_PURCHASES_KEY, eventId);
  trackMetaEvent(
    store,
    "Purchase",
    {
      currency: store?.currency || "BDT",
      value: Number(order.totalAmount.toFixed(2)),
      content_type: "product",
      content_ids: contents.map((line) => line.id),
      contents,
      order_id: order.orderNumber,
      // `num_items` is deliberately absent — Meta documents it for `InitiateCheckout` alone, and
      // the CAPI half omits it for the same reason.
    },
    eventId,
  );
};
