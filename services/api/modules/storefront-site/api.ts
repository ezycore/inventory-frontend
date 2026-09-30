// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, StorefrontLook } from "@/types";
import type { StorefrontSite, StorefrontSiteRevision } from "@/types/api";

/**
 * The store's look with a draft and a publish step — `/organization/storefront/site`
 * (backend `storefront-site.routes.ts`, gated on `storefront.design`).
 */
export type { StorefrontSite, StorefrontSiteRevision };

export interface SaveStorefrontSiteDraftInput {
  /** Only the look blocks that changed; each one carried replaces the draft's block wholesale. */
  look: StorefrontLook;
  /** The `draftVersion` Customize loaded. A stale one is refused, so two tabs cannot overwrite each other. */
  draftVersion: number;
}

const base = "/organization/storefront/site";

export const storefrontSiteApi = {
  get: (): Promise<ApiResponse<StorefrontSite>> => apiClient.get(base),
  saveDraft: (body: SaveStorefrontSiteDraftInput): Promise<ApiResponse<StorefrontSite>> =>
    apiClient.patch(`${base}/draft`, body),
  discardDraft: (): Promise<ApiResponse<StorefrontSite>> => apiClient.delete(`${base}/draft`),
  publish: (): Promise<ApiResponse<StorefrontSite>> => apiClient.post(`${base}/publish`, {}),
  revisions: (): Promise<ApiResponse<StorefrontSiteRevision[]>> =>
    apiClient.get(`${base}/revisions`),
  /** Copies the revision into the draft; shoppers see it only after the next publish. */
  restoreRevision: (version: number): Promise<ApiResponse<StorefrontSite>> =>
    apiClient.post(`${base}/revisions/${version}/restore`, {}),
};
