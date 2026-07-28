// coding-standard: maintained

const NAME = "EzyCore";

/** Single source for product branding shown in the app UI. */
export const BRAND = {
  name: NAME,
  tagline: "Make life easier",
  /**
   * Default browser-tab title: the root route metadata, and what the workspace
   * restores when it unmounts (see `useOrgDocumentTitle`). Signed-in pages
   * replace it with "<Page> · <Organization>".
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
