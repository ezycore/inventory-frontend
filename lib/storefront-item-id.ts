// coding-standard: maintained

/**
 * The one line-identity rule for every measurement tool on the storefront.
 *
 * A product and one of its variants are different sellable things, so they get different ids:
 * `productId`, or `productId:variantId` for a variant line. Meta's `content_ids` (and the
 * Conversions API on the server, see `metaContentId`) and GA4's `item_id` both use this, so a
 * product reads as the same item in every tool the merchant compares.
 */
export const storefrontItemId = (productId: string, variantId?: string): string =>
  variantId ? `${productId}:${variantId}` : productId;
