// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  ApiImage,
  StorefrontHomePage,
  StorefrontPage,
  StorefrontPageListItem,
  StorefrontPageRevision,
} from "@/types/api";
import { buildQueryParams } from "../../utils";

/**
 * Storefront Builder pages — `/ecommerce/pages` (backend `storefront-pages.routes.ts`,
 * gated on `storefront.design`). Responses are the generated types; the request
 * bodies mirror `storefront-page.validator.ts`, which checks only the envelope — a
 * section's settings are checked against the section manifest, and a refusal names
 * the failing path.
 */
export type { StorefrontPage, StorefrontPageListItem, StorefrontPageRevision };

/** One section instance as a draft stores it. */
export type StorefrontPageSection = NonNullable<StorefrontPage["draft"]>["sections"][number];

export interface StorefrontPageListParams {
  page?: number;
  limit?: number;
  search?: string;
  kind?: StorefrontPage["kind"];
  status?: StorefrontPage["status"];
}

/**
 * The two kinds a merchant makes: a landing page for an ad, or one of the shop's
 * own pages. System pages are built by the store migration and a campaign's page
 * by its campaign, so neither can be created here.
 */
export interface CreateStorefrontPageInput {
  /** Unset means a landing page, which is what this endpoint made before store pages. */
  kind?: Extract<StorefrontPage["kind"], "landing" | "content">;
  title: string;
  /** Unset takes a free slug made from the title. */
  slug?: string;
  chrome?: StorefrontPage["chrome"];
  /** A template's starting sections, saved as the first draft — refused whole, like a draft save. */
  sections?: StorefrontPageSection[];
}

export interface UpdateStorefrontPageInput {
  title?: string;
  /** Renaming a published page keeps the old address as a redirect. */
  slug?: string;
  chrome?: StorefrontPage["chrome"];
  seo?: { title?: string; description?: string; noindex?: boolean };
  /** Store pages only — where the storefront's footer lists this page. */
  footer?: { show?: boolean; order?: number };
  /** Landing pages only; sent whole. `null` removes it. */
  schedule?: {
    startsAt: string | null;
    endsAt: string | null;
    afterEnd: NonNullable<StorefrontPage["schedule"]>["afterEnd"];
    afterEndPageId?: string | null;
  } | null;
}

export interface SaveStorefrontPageDraftInput {
  sections: StorefrontPageSection[];
  /** The `draftVersion` the editor loaded. A stale one is refused, so two tabs cannot overwrite each other. */
  draftVersion: number;
}

const base = "/ecommerce/pages";

export const storefrontPagesApi = {
  list: (
    params: StorefrontPageListParams = {},
  ): Promise<ApiResponse<PaginatedResponse<StorefrontPageListItem>>> =>
    apiClient.get(`${base}${buildQueryParams(params)}`),
  get: (id: string): Promise<ApiResponse<StorefrontPage>> => apiClient.get(`${base}/${id}`),
  create: (body: CreateStorefrontPageInput): Promise<ApiResponse<StorefrontPage>> =>
    apiClient.post(base, { kind: "landing", ...body }),
  update: (id: string, body: UpdateStorefrontPageInput): Promise<ApiResponse<StorefrontPage>> =>
    apiClient.patch(`${base}/${id}`, body),
  remove: (id: string): Promise<ApiResponse<{ id: string }>> => apiClient.delete(`${base}/${id}`),
  saveDraft: (
    id: string,
    body: SaveStorefrontPageDraftInput,
  ): Promise<ApiResponse<StorefrontPage>> => apiClient.put(`${base}/${id}/draft`, body),
  discardDraft: (id: string): Promise<ApiResponse<StorefrontPage>> =>
    apiClient.delete(`${base}/${id}/draft`),
  publish: (id: string): Promise<ApiResponse<StorefrontPage>> =>
    apiClient.post(`${base}/${id}/publish`, {}),
  unpublish: (id: string): Promise<ApiResponse<StorefrontPage>> =>
    apiClient.post(`${base}/${id}/unpublish`, {}),
  duplicate: (id: string): Promise<ApiResponse<StorefrontPage>> =>
    apiClient.post(`${base}/${id}/duplicate`, {}),
  /**
   * Draw a landing page at the store's `/`, or `null` for the Customize home. Only
   * a published landing page is accepted, and the homepage cannot be turned off or
   * deleted until another choice is made.
   */
  setHome: (pageId: string | null): Promise<ApiResponse<StorefrontHomePage>> =>
    apiClient.put(`${base}/home`, { pageId }),
  revisions: (id: string): Promise<ApiResponse<StorefrontPageRevision[]>> =>
    apiClient.get(`${base}/${id}/revisions`),
  /** Copies the revision into the draft; the live page is unchanged until the next publish. */
  restoreRevision: (id: string, version: number): Promise<ApiResponse<StorefrontPage>> =>
    apiClient.post(`${base}/${id}/revisions/${version}/restore`, {}),
  /**
   * Upload a picture for a section. Written at once — the editor needs its URL
   * before the draft is saved — under `storefront.design`, which the content-page
   * upload (`storefront.manage`) does not accept.
   */
  uploadImage: (file: File): Promise<ApiResponse<ApiImage>> => {
    const body = new FormData();
    body.append("image", file);
    return apiClient.post(`${base}/images`, body);
  },
};
