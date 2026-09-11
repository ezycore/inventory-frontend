import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { ApiImage } from "@/types/api";
import type { ApiContentPage } from "@/types/api";

// Response shape generated from the backend `contentPageDto`. Kept under `ContentPage`.
export type ContentPage = ApiContentPage;

/** What the content-image upload answers with — the shared `image` DTO. */
export type UploadedImage = ApiImage;

export interface ContentPageInput {
  slug: string;
  title: string;
  body?: string;
  published?: boolean;
  showInFooter?: boolean;
  sortOrder?: number;
  /**
   * Search-engine overrides. NESTED, matching `createContentPageSchema` — the
   * catalog's flat `seoTitle`/`seoDescription` shape exists to survive multipart
   * and this endpoint is JSON, so there is nothing to flatten around.
   *
   * Its absence here was one of the three places the SEO pair went missing: the
   * form rendered both fields, and the payload, the edit prefill and this type
   * all dropped them, so a merchant could type a search title, save, reopen, and
   * find it blank with no error anywhere.
   */
  seo?: { title?: string; description?: string };
}

const base = "/ecommerce/content";

export interface ContentPageListParams {
  page?: number;
  limit?: number;
  search?: string;
  published?: string;
}

/** Max bytes accepted for a body image. Mirrors the product-image cap. */
export const contentPagesApi = {
  /**
   * Upload one image for embedding in a page body.
   *
   * Fires as soon as the merchant picks a file — the editor needs a URL to
   * render, which is well before the page is saved. An abandoned edit therefore
   * leaves an orphan in R2; that is the accepted trade (see the service), and
   * the object still sits under the org prefix so the tenant purge reaches it.
   */
  uploadImage: (file: File): Promise<ApiResponse<UploadedImage>> => {
    const body = new FormData();
    body.append("image", file);
    return apiClient.post(`${base}/images`, body);
  },
  list: (): Promise<ApiResponse<ContentPage[]>> => apiClient.get(base),
  // Adapter for DataTable's self-contained mode: backend returns the full
  // list, so search/published filtering and pagination happen client-side and
  // are wrapped in the PaginatedResponse shape DataTable expects.
  getAll: async (
    params: ContentPageListParams = {},
  ): Promise<ApiResponse<PaginatedResponse<ContentPage>>> => {
    const res = await contentPagesApi.list();
    const all = res.data ?? [];
    const search = (params.search ?? "").trim().toLowerCase();
    const published = params.published ?? "";
    const filtered = all.filter(
      (p) =>
        (!search ||
          p.title.toLowerCase().includes(search) ||
          p.slug.toLowerCase().includes(search)) &&
        (!published || String(p.published) === published),
    );
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const page = params.page && params.page > 0 ? params.page : 1;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    return {
      success: res.success,
      message: res.message,
      data: {
        items: filtered.slice(start, start + limit),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },
  create: (body: ContentPageInput): Promise<ApiResponse<ContentPage>> =>
    apiClient.post(base, body),
  update: (
    id: string,
    body: Partial<ContentPageInput>,
  ): Promise<ApiResponse<ContentPage>> => apiClient.put(`${base}/${id}`, body),
  remove: (id: string): Promise<ApiResponse<{ id: string }>> =>
    apiClient.delete(`${base}/${id}`),
};
