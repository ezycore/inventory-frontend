// coding-standard: maintained
import { isSfPreview } from "@/services/storefront/cart-identity";

/**
 * Where a visit came from, for the order it may end in: the landing page the
 * shopper came through and the `utm_*` tags on the URL they arrived on. The
 * merchant's Pages list counts orders per landing page from it
 * (`StorefrontOrder.source`, backend plan storefront-builder §9).
 *
 * `sessionStorage`, like the `fbclid` in `storefront-meta.ts`: a visit's source
 * belongs to that visit. Each half is last-touch on its own — a second ad click
 * replaces the tags, a second landing page replaces the page, and a page with
 * neither (the product the shopper wandered to next) keeps both.
 *
 * Nothing here may fail an order. Storage can be missing or full, and the
 * Customize preview (`?preview=1`) is the merchant, not a shopper.
 */

const VISIT_SOURCE_KEY = "ezy-visit-source";
const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;
/** The backend's `placeOrderSchema` cap per tag — longer values would refuse the order. */
const UTM_MAX_LENGTH = 200;

export type VisitUtm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

export interface VisitSource {
  pageId?: string;
  utm?: VisitUtm;
}

/** The `utm_*` tags on a query string, without the prefix; `undefined` when there are none. */
export function utmFromSearch(search: string): VisitUtm | undefined {
  const params = new URLSearchParams(search);
  const utm: VisitUtm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`)?.trim();
    if (value) utm[key] = value.slice(0, UTM_MAX_LENGTH);
  }
  return Object.keys(utm).length ? utm : undefined;
}

const readStored = (): VisitSource => {
  try {
    const raw = window.sessionStorage.getItem(VISIT_SOURCE_KEY);
    return raw ? (JSON.parse(raw) as VisitSource) : {};
  } catch {
    return {};
  }
};

/** Remember this page's part of the visit's source. `pageId` only on a landing page. */
export function captureVisitSource(pageId?: string): void {
  if (typeof window === "undefined" || isSfPreview()) return;
  const stored = readStored();
  const next: VisitSource = {
    pageId: pageId ?? stored.pageId,
    utm: utmFromSearch(window.location.search) ?? stored.utm,
  };
  if (!next.pageId && !next.utm) return;
  try {
    window.sessionStorage.setItem(VISIT_SOURCE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / storage full. The order simply goes unattributed.
  }
}

/** The source to send with an order, or `undefined` when this visit has none. */
export function orderSource(): VisitSource | undefined {
  if (typeof window === "undefined" || isSfPreview()) return undefined;
  const { pageId, utm } = readStored();
  return pageId || utm ? { pageId, utm } : undefined;
}
