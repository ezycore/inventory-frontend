// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { Ga4Settings, Operations } from "@/types/api";

/**
 * Google Analytics 4 settings (backend `docs/plan/storefront-ga4.md`).
 *
 * Two calls, like Clarity: there is no connection test (GA4 answers "does this id exist" only to
 * an admin OAuth grant on the merchant's property) and no report — the merchant reads their own.
 */

/** The PATCH body, taken from the generated spec rather than hand-written. */
export type UpdateGa4SettingsBody = NonNullable<
  Operations["patch_api_organization_storefront_ga4"]["requestBody"]
>["content"]["application/json"];

export const ga4Api = {
  get: (): Promise<ApiResponse<Ga4Settings>> =>
    apiClient.get("/organization/storefront/ga4"),

  update: (body: UpdateGa4SettingsBody): Promise<ApiResponse<Ga4Settings>> =>
    apiClient.patch("/organization/storefront/ga4", body),
};
