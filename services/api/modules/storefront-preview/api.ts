// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { StorefrontPreviewToken } from "@/types/api";

/**
 * The owner-preview credential — what lets the Customize / Themes editor iframe
 * a shop that is not published yet. See `lib/storefront-preview.ts` for the
 * route the token takes from here to the API.
 */
export const storefrontPreviewApi = {
  getToken: (): Promise<ApiResponse<StorefrontPreviewToken>> =>
    apiClient.get("/organization/storefront/preview-token"),
};
