// coding-standard: maintained
/**
 * Owner preview — how the admin's Customize / Themes editor is allowed to see a
 * shop that is not published yet.
 *
 * The editors preview by iframing the **real** storefront, and the public API
 * refuses an unpublished store (`resolveStore` in the backend). So the preview
 * was a 404 until the merchant published, and setting a shop up properly *before*
 * going live was not a sequence the product allowed.
 *
 * The credential's route through the app, admin → shop → API:
 *
 * ```
 * admin editor      GET /organization/storefront/preview-token   (staff session)
 *   ↓  ?previewToken=…            in the iframe URL — a cross-origin frame's own
 *                                 navigation is the one request the parent page
 *                                 cannot put a header on
 * proxy.ts          x-ezy-store-preview     request header, so SERVER components
 *   ↓                                       can read it (a layout gets no
 *                                           searchParams — only headers)
 * lib/storefront-{server,client}.ts
 *   ↓  x-storefront-preview       the header the API reads
 * backend resolveStore
 * ```
 *
 * The token proves one thing — "may view org X's unpublished shop" — and expires
 * in hours; see the backend's `storefront-preview.service.ts` for why it is not
 * the staff session token.
 */

/** URL param the admin puts the token in when it builds the preview iframe URL. */
export const PREVIEW_TOKEN_PARAM = "previewToken";

/**
 * Request header `proxy.ts` forwards the token to server components on.
 * Namespaced with the other `x-ezy-store-*` headers it is set beside, and
 * stripped from inbound requests there for the same reason they are.
 */
export const PREVIEW_REQUEST_HEADER = "x-ezy-store-preview";

/** Header the storefront presents the token to the backend API on. */
export const PREVIEW_API_HEADER = "x-storefront-preview";

/**
 * Cookie `proxy.ts` writes on the SHOP's own host the first time it sees the
 * token, and reads on every request after.
 *
 * Without it the preview survives exactly one page. A merchant clicking a
 * product inside the frame navigates client-side, the `?previewToken=` is gone
 * from the URL, and the RSC request for the new route arrives with no way to say
 * who is asking — so an unpublished shop 404s the moment anyone explores it.
 *
 * Deliberately readable by script: `sfFetch` runs on this origin and needs the
 * same token for its own calls. `httpOnly` would buy nothing anyway — the value
 * arrives in a URL, is scoped to one org's own unpublished shop, and expires in
 * hours.
 */
export const PREVIEW_COOKIE = "ezy-store-preview";

/**
 * Set by the admin editor, which holds a minted token in React state and is on a
 * different origin from the shop — so it has no `?previewToken=` of its own to
 * read. Module scope rather than a prop, because the consumer is `sfFetch`, a
 * module-level fetch helper several layers below any component.
 */
let injected: string | null = null;

export const setStorefrontPreviewToken = (token: string | null): void => {
  injected = token;
};

/**
 * The preview token this browser context should present, or `null` for the
 * ordinary shopper case.
 *
 * Read lazily on every call, never cached at import: inside the preview iframe
 * the token arrives in the page URL, and a value captured at module-eval time
 * would race the first query on a cold load.
 */
export const storefrontPreviewToken = (): string | null => {
  if (injected) return injected;
  if (typeof window === "undefined") return null;
  return (
    new URLSearchParams(window.location.search).get(PREVIEW_TOKEN_PARAM) ??
    // The cookie outlives the URL param: one client-side navigation inside the
    // preview and the param is gone, while the shop is still unpublished.
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${PREVIEW_COOKIE}=`))
      ?.slice(PREVIEW_COOKIE.length + 1) ??
    null
  );
};

/** The API headers a preview request adds, spread-ready (empty when not previewing). */
export const previewApiHeaders = (
  token: string | null,
): Record<string, string> => (token ? { [PREVIEW_API_HEADER]: token } : {});
