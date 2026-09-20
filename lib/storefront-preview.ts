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
import { create } from "zustand";

export const PREVIEW_TOKEN_PARAM = "previewToken";

/**
 * URL param the admin editors put on the frame's first URL to turn the draft
 * receivers on. Read through `isPreviewSession()`, never directly — see there.
 */
export const PREVIEW_PARAM = "preview";

/**
 * `sessionStorage` key that remembers "this document is an editor preview frame"
 * for the rest of the tab's life.
 *
 * Per tab and per origin, which is the exact scope wanted: the shop's own host,
 * the one frame (or the one "open in a new tab" window) the editor opened, and
 * nothing a real shopper's browser ever holds.
 */
export const PREVIEW_SESSION_KEY = "ezy-sf-preview";

/**
 * Whether this browser context is an admin preview frame.
 *
 * **Not a plain read of `?preview=1`, and that is the whole point.** Every link
 * in the shop is a bare path, so the first click inside the preview — a
 * category, a product, the logo — client-side navigates and the param is gone.
 * The receivers survived that only because they had already mounted; the moment
 * the document was replaced (a dev Fast Refresh, any hard navigation) the new
 * one read a param-less URL, mounted no listener, and every later edit the
 * editor posted was dropped on the floor. The frame kept showing its last paint,
 * so the preview looked alive and simply stopped following the controls, and
 * only reloading the editor — which rebuilds `src` with the param — brought it
 * back.
 *
 * The token beside it already had this fixed, with a cookie (`PREVIEW_COOKIE`),
 * for the same reason and in the same words. This is the other half of it.
 *
 * `sessionStorage` rather than a cookie: nothing on the server needs to know,
 * and a tab-scoped value cannot leak into the merchant's ordinary shop window.
 * Every access is wrapped — a private window or blocked site data throws — and
 * the URL answer is what a failed read falls back to, so the worst case is
 * today's behaviour rather than a dead preview.
 */
export const isPreviewSession = (): boolean => {
  if (typeof window === "undefined") return false;
  const onUrl =
    new URLSearchParams(window.location.search).get(PREVIEW_PARAM) === "1";
  try {
    if (onUrl) window.sessionStorage.setItem(PREVIEW_SESSION_KEY, "1");
    else return window.sessionStorage.getItem(PREVIEW_SESSION_KEY) === "1";
  } catch {
    // Storage unavailable — fall back to what the URL says.
  }
  return onUrl;
};

/**
 * Asks the shop's own origin to forget its preview cookie.
 *
 * The cookie is set on the SHOP's host and the editor lives on the admin's, so
 * the admin cannot delete it — only ask. Publishing is the moment it stops being
 * wanted: from then on the shop renders for everyone, and a lingering cookie
 * just means the merchant's own visits carry an inert header and, because a
 * preview response is deliberately `no-store`, bypass ISR for up to the token's
 * full four hours. Nobody else is affected, which is why this is a tidy-up and
 * not a security fix.
 */
export const PREVIEW_CLEAR_PARAM = "previewEnded";

/**
 * Request header `proxy.ts` forwards the token to server components on.
 * Namespaced with the other `x-ezy-store-*` headers it is set beside, and
 * stripped from inbound requests there for the same reason they are.
 */
export const PREVIEW_REQUEST_HEADER = "x-ezy-store-preview";

/**
 * URL param the page editor's frame adds (`builder=1`): this preview streams a
 * builder page's unsaved sections, rather than being the Customize frame, which
 * sends `preview=1` alone.
 */
export const PREVIEW_BUILDER_PARAM = "builder";

/**
 * Request header `proxy.ts` sets when a preview request carries
 * `PREVIEW_BUILDER_PARAM` — how a system route, which never receives
 * `searchParams` in its shared wrapper, knows it is inside the page editor's
 * frame. Only ever set beside `PREVIEW_REQUEST_HEADER`, and stripped from
 * inbound requests with it.
 */
export const PREVIEW_BUILDER_HEADER = "x-ezy-store-preview-builder";

/** Header the storefront presents the token to the backend API on. */
export const PREVIEW_API_HEADER = "x-storefront-preview";

/**
 * Editor → preview frame: draw the shop in this light/dark theme
 * (`payload.theme`). Sent by BOTH admin previews — Customize's `BrowserPreview`
 * and the page editor's `PagePreviewFrame` — so it lives here rather than in
 * `page-draft-messages.ts`, which is the page editor's own channel.
 *
 * The frame applies it as an override (`setPreviewTheme`), never by writing
 * `localStorage['ezy-sf-theme']`: that key is the MERCHANT'S OWN shopper
 * preference on the shop's origin, and an editor button that rewrote it would
 * silently change how their live shop greets them on every future visit. The
 * override also makes the preview deterministic — without it a merchant who had
 * once toggled their shop to dark previewed dark while the editor said light.
 */
export const PREVIEW_THEME_MESSAGE = "ezycore-preview-theme";

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
 * read. A store rather than a prop, because the consumer is `sfFetch`, a
 * module-level fetch helper several layers below any component — the same
 * `getState()` shape `api-client.ts` and `revalidate-storefront.ts` use to reach
 * auth from outside React.
 *
 * ⚠ A bare module-scope `let` did this job, and it was fine in a browser, where
 * module scope is per-tab. **It is not per-tab on the server.** Client components
 * still server-render, so the editor's write runs there too — into state shared
 * by every concurrent request in the process. It has never leaked only because
 * the token comes from a query with no data during SSR, so the server always
 * wrote `null`; prefetch or hydrate that query and one merchant's token becomes
 * a process global. The write below therefore refuses to run on the server,
 * which is the part that actually closes it — the store is what makes the state
 * observable and testable rather than a hidden module variable.
 */
interface PreviewTokenState {
  injected: string | null;
  setInjected: (token: string | null) => void;
}

const usePreviewToken = create<PreviewTokenState>((set) => ({
  injected: null,
  setInjected: (injected) => set({ injected }),
}));

export const setStorefrontPreviewToken = (token: string | null): void => {
  // Client only — see above. A server render reads its token from the request
  // (`getStorePreviewToken`), never from here, so this is a no-op, not a gap.
  if (typeof window === "undefined") return;
  usePreviewToken.getState().setInjected(token);
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
  // The window check comes FIRST. Reading injected state on the server would be
  // reading whatever the last request happened to write — the hazard above.
  if (typeof window === "undefined") return null;
  const { injected } = usePreviewToken.getState();
  if (injected) return injected;
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
