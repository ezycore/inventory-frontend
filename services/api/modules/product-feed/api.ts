// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { Operations, ProductFeedSettings } from "@/types/api";

/** Product feed switch (backend `docs/plan/product-feed.md`). */

/** The PATCH body, taken from the generated spec rather than hand-written. */
export type UpdateProductFeedSettingsBody = NonNullable<
  Operations["patch_api_organization_storefront_product_feed"]["requestBody"]
>["content"]["application/json"];

export const productFeedApi = {
  get: (): Promise<ApiResponse<ProductFeedSettings>> =>
    apiClient.get("/organization/storefront/product-feed"),

  update: (body: UpdateProductFeedSettingsBody): Promise<ApiResponse<ProductFeedSettings>> =>
    apiClient.patch("/organization/storefront/product-feed", body),
};
