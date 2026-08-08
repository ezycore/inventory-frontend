// coding-standard: maintained

const NAME = "EzyCore";

/**
 * Single source for product branding shown in the app UI.
 *
 * The sidebar tagline is deliberately NOT here — it is a translated user-facing
 * label, so it lives in `messages/{en,bn}/layout.json` under `layout.brand`
 * like every other string a merchant reads.
 */
export const BRAND = {
  name: NAME,
  /**
   * Default browser-tab title. Owned by the signed-out tree's metadata and by
   * the raw <title> the protected layout renders for its SSR pass — NOT by the
   * root layout, whose metadata Next re-asserts on every client navigation.
   * Signed-in pages replace it with "<Page> · <Organization>", and it is what
   * the workspace restores when it unmounts (see `useOrgDocumentTitle`).
   */
  documentTitle: `${NAME} - Inventory Management System`,
} as const;

/**
 * The marketing site (`inventory-landing`), which owns the public legal pages.
 * Falls back to the production apex when `NEXT_PUBLIC_ROOT_DOMAIN` is unset —
 * it is blank on non-main branches (see .github/workflows/deploy.yml), and a
 * legal link that silently points nowhere is worse than one pointing at prod.
 *
 * Paths carry the `/en` prefix and trailing slash the landing site actually
 * emits (`output: export` + `trailingSlash: true`); the bare `/terms` and
 * `/privacy` redirects in its `public/_redirects` are a convenience for humans,
 * not something to link through.
 */
const MARKETING_URL = `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ezycore.com"}`;

export const LEGAL_URLS = {
  terms: `${MARKETING_URL}/en/terms/`,
  privacy: `${MARKETING_URL}/en/privacy/`,
} as const;
