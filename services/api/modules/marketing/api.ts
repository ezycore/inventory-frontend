// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { MarketingSettings, Operations } from "@/types/api";

/**
 * Store-level marketing settings — the cookie banner every measurement tool shares (backend
 * `docs/plan/storefront-ga4.md` §5).
 */

export type UpdateMarketingSettingsBody = NonNullable<
  Operations["patch_api_organization_storefront_marketing"]["requestBody"]
>["content"]["application/json"];

export const marketingApi = {
  get: (): Promise<ApiResponse<MarketingSettings>> =>
    apiClient.get("/organization/storefront/marketing"),

  update: (
    body: UpdateMarketingSettingsBody,
  ): Promise<ApiResponse<MarketingSettings>> =>
    apiClient.patch("/organization/storefront/marketing", body),
};
