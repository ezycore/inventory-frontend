// coding-standard: maintained
import { isSfPreview } from "@/services/storefront/cart-identity";
import { CONSENT_STORAGE_KEY } from "@/lib/storefront-consent";
import { storefrontItemId } from "@/lib/storefront-item-id";
import { alreadySent, rememberSent } from "@/lib/storefront-sent-once";
import type { StorefrontStore } from "@/lib/storefront-client";

/**
 * The Google Analytics 4 wrapper — the only place the storefront talks to `window.gtag`
 * (backend `docs/plan/storefront-ga4.md`).
 *
 * Every rule about money and items here was checked against Google's documentation on
 * 2026-09-24 (links in the plan §4): `value` is `Σ(price × quantity)` over `items` and excludes
 * shipping and tax; a discounted item carries its discounted unit `price` plus a unit `discount`;
 * `currency` goes with every `value`.
 */

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export type CookieBannerMode = "off" | "eu" | "always";

/** One item, the same shape on all four events. */
export interface Ga4Item {
  /** `storefrontItemId` — the id Meta uses too, so a product is the same item in both tools. */
  item_id: string;
  item_name: string;
  /** Variant label ("Red / XL"), on a variant line only. */
  item_variant?: string;
  /** Unit price, 2 dp. On `purchase`, the effective price after the order discount is spread. */
  price: number;
  quantity: number;
  /** `purchase` only: unit discount, list price − effective price. */
  discount?: number;
  /** Position in the list, on `begin_checkout` and `purchase`. */
  index?: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** The two store fields GA4 reads — narrow, so the client half can hold just these. */
export type Ga4Store = Pick<StorefrontStore, "ga4" | "currency">;

/* ------------------------------------------------------------------ consent ---- */

/** The four Consent Mode v2 signals. One shopper answer drives all four (plan §5). */
export const ga4ConsentState = (granted: boolean) => {
  const state = granted ? "granted" : "denied";
  return {
    analytics_storage: state,
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
  } as const;
};

/**
 * GA4's consent default before this page view has an answer (owner decision, plan §5 Option A).
 *
 * A stored answer always wins. Without one, the merchant's banner mode decides: no banner means
 * the merchant chose not to ask, so tracking is on; `eu` asks — and waits — only on a European
 * clock; `always` waits for everyone. **This is the configured behaviour, not a legal
 * judgement** — the merchant chooses the mode and is responsible for choosing it.
 *
 * `ga4BootScript` repeats this in plain JS, because it must run before any bundle has loaded;
 * `storefront-ga4.test.ts` runs the script against this function for every case so the two
 * cannot drift.
 */
export const ga4DefaultGranted = (
  mode: CookieBannerMode,
  stored: "granted" | "denied" | null,
  europeanClock: boolean,
): boolean => {
  if (stored) return stored === "granted";
  if (mode === "off") return true;
  if (mode === "eu") return !europeanClock;
  return false;
};

/**
 * The inline boot script, rendered into the server HTML by `components/storefront/ga4.tsx`.
 *
 * **Why inline and not `next/script`.** The browser runs an inline script while it parses the
 * page — before hydration, so before any React effect. That makes `dataLayer` and `gtag` exist
 * by the time the first `page_view` or `view_item` is sent, and every event is queued until the
 * library lands instead of being dropped (plan §3). The consent default is the first command, as
 * Google requires, and reads the shopper's stored answer so a returning shopper who refused is
 * never counted even for one hit.
 */
export const ga4BootScript = (
  measurementId: string,
  mode: CookieBannerMode,
): string => `(function(){
var w=window;w.dataLayer=w.dataLayer||[];
if(!w.gtag){w.gtag=function(){w.dataLayer.push(arguments);};}
var d=null,eu=true;
try{d=w.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)});}catch(e){}
try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone;eu=z?z.indexOf("Europe/")===0:false;}catch(e){eu=true;}
var m=${JSON.stringify(mode)};
var g=d==="granted"?true:d==="denied"?false:m==="off"?true:m==="eu"?!eu:false;
var s=g?"granted":"denied";
w.gtag("consent","default",{analytics_storage:s,ad_storage:s,ad_user_data:s,ad_personalization:s});
if(!g){w.gtag("set","ads_data_redaction",true);}
w.gtag("js",new Date());
w.gtag("config",${JSON.stringify(measurementId)},{send_page_view:false});
})();`;

/** Forward the shopper's answer from `ConsentBar`. Nothing to do on a store without GA4. */
export const setGa4Consent = (granted: boolean): void => {
  try {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("consent", "update", ga4ConsentState(granted));
    window.gtag("set", "ads_data_redaction", !granted);
  } catch {
    // Tracking must never break a shopper's interaction.
  }
};

/* ------------------------------------------------------------------- events ---- */

/**
 * Should this browser send GA4 events for `store`? Only when the store has GA4 — never because
 * the library has not loaded yet (events queue, see `ga4BootScript`) — and never from the
 * Customize editor's `?preview=1` iframe, where the visits are the merchant's own.
 */
const canSend = (store: Ga4Store | undefined): boolean =>
  typeof window !== "undefined" && !!store?.ga4?.measurementId && !isSfPreview();

/**
 * Recreate the queue if something removed it. The inline boot script is the first line of
 * defence; this is the second, so a call can never be silently discarded for want of `gtag`.
 */
const ensureGtag = (): Gtag => {
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    const queue = window.dataLayer;
    window.gtag = function gtag() {
      // gtag.js reads an `arguments` object, not an array — the documented stub pushes exactly this.
      // eslint-disable-next-line prefer-rest-params
      queue.push(arguments);
    };
  }
  return window.gtag;
};

/** Send one event. Swallows its own failures — tracking must never break a shopper's action. */
export const trackGa4Event = (
  store: Ga4Store | undefined,
  name: string,
  params: Record<string, unknown>,
): void => {
  if (!canSend(store)) return;
  try {
    ensureGtag()("event", name, params);
  } catch {
    // Nothing to recover: the shopper's action already happened.
  }
};

/**
 * `currency` + `value`, or neither. GA4 needs a currency with every value, and a guessed one is
 * worse than no revenue — so a store without a currency sends the event without money.
 */
export const ga4Money = (
  store: Ga4Store | undefined,
  value: number,
): { currency?: string; value?: number } =>
  store?.currency ? { currency: store.currency, value: round2(value) } : {};

/** A cart (or product) line as a GA4 item, at its list price. */
export const ga4LineItem = (
  line: {
    productId: string;
    variantId?: string;
    name: string;
    variantLabel?: string;
    price: number;
  },
  quantity: number,
  index?: number,
): Ga4Item => ({
  item_id: storefrontItemId(line.productId, line.variantId),
  item_name: line.name,
  ...(line.variantLabel ? { item_variant: line.variantLabel } : {}),
  price: round2(line.price),
  quantity,
  ...(index !== undefined ? { index } : {}),
});

/**
 * `page_view`. The caller supplies the location and title (`Ga4Client` waits for Next to write the
 * new page's title); without a title, gtag falls back to `document.title` itself.
 */
export const trackGa4PageView = (
  store: Ga4Store | undefined,
  location: string,
  title?: string,
): void =>
  trackGa4Event(store, "page_view", {
    page_location: location,
    ...(title ? { page_title: title } : {}),
  });

/* ----------------------------------------------------------------- purchase ---- */

/** The placed order, narrowed to what a `purchase` needs — so a test can build one by hand. */
export interface Ga4PurchaseOrder {
  orderNumber: string;
  totalAmount: number;
  shippingCharged: number;
  couponCode?: string;
  items: {
    productId: string;
    variantId?: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal?: number;
  }[];
}

/**
 * The order's lines at their EFFECTIVE prices, so the items add up to `value` (plan §4).
 *
 * The order discount (coupon + manual) sits on the order, not on lines, so the lines' own prices
 * add up to the pre-discount subtotal. Sent as-is, GA4's items would disagree with its revenue by
 * the whole discount. So:
 *
 * 1. The merchandise figure is `totalAmount − shippingCharged` (the backend's
 *    `max(0, subtotal − discountAmount)`).
 * 2. Each line's share of it is proportional to its gross; the last line takes the rounding
 *    remainder, so nothing leaks.
 * 3. Its effective unit price is that share ÷ quantity, to 2 dp. One entry per line — never split
 *    into two entries with the same `item_id`, because Google does not document how a repeated id
 *    is treated.
 * 4. `value` is then computed FROM the items, as Google requires. Where a share does not divide
 *    evenly (100 over 3 units → 33.33 × 3) `value` sits a few paisa under the merchandise figure.
 *    With no discount it is exact.
 */
export const ga4PurchaseItems = (
  order: Ga4PurchaseOrder,
): { items: Ga4Item[]; value: number } => {
  const merchandise = round2(Math.max(0, order.totalAmount - order.shippingCharged));
  const gross = order.items.map((line) => line.subtotal ?? line.price * line.quantity);
  const grossTotal = gross.reduce((sum, g) => sum + g, 0);

  const nets: number[] = [];
  gross.forEach((g, i) => {
    if (i < gross.length - 1) {
      nets.push(grossTotal > 0 ? round2((merchandise * g) / grossTotal) : 0);
    } else {
      const others = nets.reduce((sum, n) => sum + n, 0);
      nets.push(Math.max(0, round2(merchandise - others)));
    }
  });

  const items = order.items.map((line, i): Ga4Item => {
    const unit = line.quantity > 0 ? round2(nets[i] / line.quantity) : 0;
    const discount = round2(line.price - unit);
    return {
      item_id: storefrontItemId(line.productId, line.variantId),
      item_name: line.productName,
      price: unit,
      quantity: line.quantity,
      ...(discount > 0 ? { discount } : {}),
      index: i,
    };
  });

  const value = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  return { items, value };
};

/** `sessionStorage` namespace for purchases already sent — separate from Meta's. */
const SENT_PURCHASES_KEY = "ezy-ga4-purchases";

/**
 * Report the sale, once. Called from checkout's `onSuccess` — the one moment the browser and the
 * order number exist together. `transaction_id` is the order number: stable and unique within the
 * merchant's store, and a GA4 property belongs to one merchant. The send-once guard is marked
 * BEFORE the send, so a reload, the back button or a re-render cannot fire it again.
 */
export const trackGa4Purchase = (
  store: Ga4Store | undefined,
  order: Ga4PurchaseOrder,
): void => {
  if (!canSend(store)) return;
  if (alreadySent(SENT_PURCHASES_KEY, order.orderNumber)) return;
  rememberSent(SENT_PURCHASES_KEY, order.orderNumber);

  const { items, value } = ga4PurchaseItems(order);
  const money = ga4Money(store, value);
  trackGa4Event(store, "purchase", {
    transaction_id: order.orderNumber,
    ...money,
    // Shipping is money too: without a currency it would be as ambiguous as `value`.
    ...(money.currency ? { shipping: round2(order.shippingCharged) } : {}),
    ...(order.couponCode ? { coupon: order.couponCode } : {}),
    items,
  });
};
