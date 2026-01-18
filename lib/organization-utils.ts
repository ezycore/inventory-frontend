/**
 * Organization Utilities
 * Handles subdomain detection and organization slug management
 */

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

  const hostname = window.location.hostname;

  // Development environments (localhost, etc.)
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.includes(".local")
  ) {
    return null;
  }

  // Split hostname into parts
  const parts = hostname.split(".");

  // Need at least 3 parts for a subdomain (subdomain.domain.tld)
  if (parts.length < 3) {
    return null;
  }

  const subdomain = parts[0];

  // Ignore common prefixes that aren't organization subdomains
  if (subdomain === "www" || subdomain === "app" || subdomain === "api") {
    return null;
  }

  return subdomain;
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
