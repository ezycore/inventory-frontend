// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { ClaritySettings, Operations } from "@/types/api";

/**
 * Microsoft Clarity settings (backend `docs/plan/storefront-clarity.md`).
 *
 * Lives under `/organization/storefront/clarity` for the same reason the Meta module does: it is
 * store configuration, not a resource of its own.
 *
 * **Two calls, and there will not be a third.** There is no connection test — Clarity exposes no
 * way to ask whether a project id exists without that project's own API token — and no report:
 * the merchant reads their own dashboard, which `ClaritySettings.dashboardUrl` links to.
 */

/**
 * The PATCH body, taken from the generated spec rather than hand-written — the same reasoning as
 * `UpdateMetaSettingsBody`. `cookieConsent` is a three-value enum that decides who sees a consent
 * bar, and a hand-written union here would keep compiling after the backend changed it.
 */
export type UpdateClaritySettingsBody = NonNullable<
  Operations["patch_api_organization_storefront_clarity"]["requestBody"]
>["content"]["application/json"];

export const clarityApi = {
  get: (): Promise<ApiResponse<ClaritySettings>> =>
    apiClient.get("/organization/storefront/clarity"),

  update: (
    body: UpdateClaritySettingsBody,
  ): Promise<ApiResponse<ClaritySettings>> =>
    apiClient.patch("/organization/storefront/clarity", body),
};
