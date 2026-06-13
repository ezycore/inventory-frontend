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
export function subdomainFromHostname(hostname: string): string | null {
  const h = hostname.toLowerCase();

  // Development environments (localhost, etc.)
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.startsWith("192.168.") ||
    h.includes(".local")
  ) {
    return null;
  }

  // Need at least 3 parts for a subdomain (subdomain.domain.tld)
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
export function withOrganizationSlug<T extends Record<string, any>>(
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
  return !isSubdomainMode();
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
