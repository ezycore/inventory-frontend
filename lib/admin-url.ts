// coding-standard: maintained
/**
 * Admin-host convention for custom domains: the public storefront owns the root
 * (`acme.com`), so the merchant admin app lives at `admin.acme.com`. This is the
 * single source for deriving that host/URL — used by Settings → Domains (DNS
 * rows + card links) and the storefront "unavailable" page's owner sign-in link.
 * Mirrors the backend `ADMIN_HOST_PREFIX` in `easystock-backend/utils/tenant-host.ts`.
 */
const ADMIN_PREFIX = "admin.";

/** Reduce a raw domain/origin to a bare, lowercased host (no scheme/path/port). */
function bareHost(domain: string): string {
  let h = domain.trim().toLowerCase();
  const scheme = h.indexOf("://");
  if (scheme !== -1) h = h.slice(scheme + 3);
  return h.split("/")[0].split(":")[0];
}

/** Bare host → its admin host. Idempotent when already an `admin.` host. */
export function adminHostForDomain(domain: string): string {
  const h = bareHost(domain);
  if (!h) return "";
  return h.startsWith(ADMIN_PREFIX) ? h : `${ADMIN_PREFIX}${h}`;
}

/** Bare host / origin → absolute admin URL (`https://admin.<domain>`), or "". */
export function adminUrlForDomain(domain: string): string {
  const host = adminHostForDomain(domain);
  return host ? `https://${host}` : "";
}
