// coding-standard: maintained

/**
 * Turn a display name into a URL-safe slug: lowercased, every run of
 * non-alphanumerics collapsed to one hyphen, no leading or trailing hyphen.
 *
 * Matches the `^[a-z0-9-]+$` pattern the workspace-address and product-slug
 * fields validate against, so a suggestion generated here is always accepted
 * as typed rather than bouncing off the field it was generated for.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
