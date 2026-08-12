// coding-standard: maintained
/**
 * Organization Utilities
 * Handles subdomain detection and organization slug management
 */

/**
 * Subdomains that are infrastructure / marketing hosts, never a workspace.
 * On these hosts the app runs in "no workspace" mode (the manual org-slug field
 * is shown). Mirrors the reserved list in DEPLOYMENT.md §17.1 and the backend
 * signup guard in easystock-backend `src/constants/reserved-slugs.ts`.
 */
export const RESERVED_SUBDOMAINS = new Set<string>([
  "www",
  "app",
  "api",
  "mc",
  "mc-api",
  "rc",
  "admin",
  "assets",
  "static",
  "portainer",
  "dozzle",
]);

/**
 * True for reserved infra subdomains, including any `rc-*` staging host
 * (rc-api, rc-mc, rc-mc-api, …).
 */
export function isReservedSubdomain(subdomain: string): boolean {
  const s = subdomain.toLowerCase();
  return RESERVED_SUBDOMAINS.has(s) || s.startsWith("rc-");
}

/**
 * Extract subdomain from hostname
 * @returns subdomain string or null if no subdomain exists
 *
 * Examples:
 * - "abc-company.eazystock.com" → "abc-company"
 * - "localhost" → null
 * - "eazystock.com" → null
 * - "www.eazystock.com" → null (www is ignored)
 */
export function getSubdomain(): string | null {
  if (typeof window === "undefined") return null;
  return subdomainFromHostname(window.location.hostname);
}

/**
 * Pure host → workspace-slug resolution, usable server- or client-side. Pass a
 * hostname (no port). Returns null for apex / reserved / IP / localhost hosts.
 */
/**
 * A bare IP literal, v4 or v6. Never a workspace and never a custom domain — a
 * merchant registers a NAME in Settings → Domains, never an address. Matching
 * only `192.168.*` (as this file did until 2026-08-11) breaks every other
 * private range: `10.x` covers most corporate wifi and phone hotspots, and a
 * developer opening the dev server from a phone on one got the workspace gate's
 * "Workspace not found" instead of the app.
 */
export const isIpHost = (h: string): boolean =>
  /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(":") || h === "::1";

export function subdomainFromHostname(hostname: string): string | null {
  const h = hostname.toLowerCase();

  // Plain localhost / loopback / any IP address — no workspace.
  if (h === "localhost" || isIpHost(h)) {
    return null;
  }

  // Local dev multi-tenant: `{slug}.localhost` (mirrors proxy.ts resolveStore),
  // so the admin auto-detects the workspace on a tenant subdomain in dev exactly
  // as it does in production — the org-slug field is then hidden.
  if (h.endsWith(".localhost")) {
    const sub = h.slice(0, -".localhost".length);
    if (sub && !sub.includes(".") && !isReservedSubdomain(sub)) return sub;
    return null;
  }

  // Other mDNS-style `.local` hosts — no workspace.
  if (h.includes(".local")) {
    return null;
  }

  const root = getRootDomain().toLowerCase();
  if (root) {
    // Root configured (prod/staging): a workspace subdomain is EXACTLY one label
    // under the apex (`<slug>.ezycore.com`). The apex itself and any custom
    // domain (shop.acme.com) are NOT slug hosts — critical so a custom domain
    // isn't misread as slug="shop". See docs/CUSTOM-DOMAINS-P1.md.
    if (h === root || !h.endsWith(`.${root}`)) return null;
    const label = h.slice(0, -(root.length + 1));
    // Multi-label (a.b.ezycore.com) and infra/marketing hosts are never a workspace.
    if (!label || label.includes(".") || isReservedSubdomain(label)) return null;
    return label;
  }

  // No root configured (local / single-host): legacy 3-part heuristic.
  const parts = h.split(".");
  if (parts.length < 3) {
    return null;
  }

  const subdomain = parts[0];

  // Infra / marketing hosts (www, app, api, mc, rc, rc-*, …) are never a
  // workspace — fall back to "no workspace" mode so the manual slug field shows.
  if (isReservedSubdomain(subdomain)) {
    return null;
  }

  return subdomain;
}

/**
 * True when the given host already implies a workspace — either a
 * `<slug>.ROOT_DOMAIN` subdomain OR a custom domain (any non-platform host). On
 * such hosts the tenant is determined by the host (the BE resolves it from the
 * request), so auth forms need no manual org-slug field and must not send a
 * client-derived slug. False on the platform apex / `www` / reserved hosts and
 * in local/single-host mode, where the manual slug field is shown instead.
 */
export function hostImpliesWorkspace(hostname: string): boolean {
  const h = hostname.toLowerCase().split(":")[0];
  if (subdomainFromHostname(h)) return true;

  const root = getRootDomain().toLowerCase();
  const isLocal =
    h === "localhost" ||
    h.endsWith(".localhost") ||
    isIpHost(h) ||
    h.includes(".local");
  if (!root || isLocal) return false;

  // Platform apex / www / reserved subdomain of the root → no implicit workspace.
  if (h === root || h === `www.${root}` || h.endsWith(`.${root}`)) return false;

  // Anything else is a customer custom domain → implicit workspace.
  return true;
}

/** Client-side {@link hostImpliesWorkspace} for the current window host. */
export function isWorkspaceHost(): boolean {
  if (typeof window === "undefined") return false;
  return hostImpliesWorkspace(window.location.hostname);
}

/**
 * Server-side variant: accepts a raw `Host` header value (may include `:port`).
 */
export function subdomainFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  return subdomainFromHostname(host.split(":")[0]);
}

/**
 * Check if subdomain-based organization routing is enabled
 * @returns true if subdomain exists and should be used
 */
export function isSubdomainMode(): boolean {
  return getSubdomain() !== null;
}

/**
 * Get organization slug from subdomain or return null
 * This is the primary function to get the organization slug
 */
export function getOrganizationSlug(): string | null {
  return getSubdomain();
}

/**
 * Enhanced form data with automatic organization slug handling
 * This function should be called before submitting any auth-related forms
 *
 * @param formData - The form data object
 * @param manualSlug - Optional manual slug from form input
 * @returns Enhanced form data with organizationSlug populated
 */
export function withOrganizationSlug<T extends object>(
  formData: T,
  manualSlug?: string,
): T & { organizationSlug?: string } {
  const subdomain = getSubdomain();

  // If subdomain exists, use it (takes precedence)
  if (subdomain) {
    return {
      ...formData,
      organizationSlug: subdomain,
    };
  }

  // Otherwise, use manual slug if provided
  if (manualSlug) {
    return {
      ...formData,
      organizationSlug: manualSlug,
    };
  }

  // Return original data if no slug available
  return formData;
}

/**
 * Check if organization slug field should be shown in forms
 * @returns true if field should be visible, false if it should be hidden
 */
export function shouldShowOrganizationSlugField(): boolean {
  // Hide on any host that already implies a workspace (subdomain OR custom
  // domain); show only on the platform apex / local, where the org is ambiguous.
  return !isWorkspaceHost();
}

/**
 * Get placeholder text for organization slug field
 */
export function getOrganizationSlugPlaceholder(): string {
  return "your-organization";
}

/**
 * Get description/helper text for organization slug field
 */
export function getOrganizationSlugDescription(): string {
  return "Enter your organization slug (e.g., abc-company)";
}

/**
 * Validate organization slug format
 * @param slug - The slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidOrganizationSlug(slug: string): boolean {
  // Only lowercase letters, numbers, and hyphens
  // Must start and end with alphanumeric character
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Generate slug from organization name
 * @param name - Organization name
 * @returns Generated slug
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Apex domain that workspaces live under (e.g. "ezycore.com"), read from
 * NEXT_PUBLIC_ROOT_DOMAIN. Empty when unset (local dev / single-host), which
 * makes {@link workspaceUrl} fall back to relative paths.
 *
 * NOTE: NEXT_PUBLIC_* vars are baked at BUILD time — set this when building the
 * production frontend image (see DEPLOYMENT.md §10.1), not just at runtime.
 */
export function getRootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() || "";
}

/**
 * Absolute URL for a workspace on its own subdomain, e.g.
 * `workspaceUrl("acme", "/login")` → `https://acme.ezycore.com/login`.
 *
 * Falls back to a relative path when no root domain is configured (local dev)
 * or when called server-side, so callers can use the result directly in either
 * mode. Crossing to a workspace subdomain is a new origin, so callers should
 * navigate via a full page load (a plain `<a>` / `window.location`), not the
 * client-side router.
 */
export function workspaceUrl(slug: string, path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const root = getRootDomain();
  if (!root || typeof window === "undefined") return normalizedPath;
  return `${window.location.protocol}//${slug}.${root}${normalizedPath}`;
}

/**
 * URL of the platform signup page. Signup lives on the shared platform host
 * (`app.<root>`, e.g. "https://app.ezycore.com/signup") — a workspace subdomain
 * or custom domain must cross origins to reach it. Falls back to the relative
 * path when no root domain is configured (local dev / staging single-host).
 */
export function signupUrl(): string {
  const root = getRootDomain();
  return root ? `https://app.${root}/signup` : "/signup";
}
