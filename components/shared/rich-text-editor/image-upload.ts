// coding-standard: maintained
import type { ApiResponse } from "@/types";
import { productsApi, storefrontPagesApi } from "@/services/api";

/**
 * Which endpoint an editor's insert-image button posts to.
 *
 * A scope rather than a boolean, because the surfaces that embed images sit
 * behind **different permissions**: storefront pages need `storefront.design`,
 * product descriptions need
 * `products.create` or `products.edit`. A single `allowImages: true` could only
 * ever point at one of them, which is why the product-description editor shipped
 * with no button at all — the only endpoint available would have 403'd for a
 * product-only role.
 *
 * Omitting the scope is how a field opts OUT: no scope, no button.
 */
export type RichImageScope = "page" | "product";

/** Bytes. Mirrors the backend's multer limit — reject before the round trip. */
export const RICH_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

type Uploader = (file: File) => Promise<ApiResponse<{ url?: string }>>;

export const RICH_IMAGE_UPLOADERS: Record<RichImageScope, Uploader> = {
  page: (file) => storefrontPagesApi.uploadImage(file),
  product: (file) => productsApi.uploadDescriptionImage(file),
};
