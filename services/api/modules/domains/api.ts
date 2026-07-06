import { apiClient } from "@/lib/api-client";
import type { ApiResponse, OrganizationDomain } from "@/types";

/**
 * Custom-domain management API. Non-standard CRUD (verb endpoints + the domain
 * itself as the path id), so it doesn't use the generic resource helpers.
 * See CUSTOM-DOMAINS-P1.md.
 */
export const domainsApi = {
  list: (): Promise<ApiResponse<{ domains: OrganizationDomain[] }>> =>
    apiClient.get("/domains"),

  add: (domain: string): Promise<ApiResponse<{ domain: OrganizationDomain }>> =>
    apiClient.post("/domains", { domain }),

  verify: (
    domain: string,
  ): Promise<ApiResponse<{ domain: OrganizationDomain }>> =>
    apiClient.post(`/domains/${encodeURIComponent(domain)}/verify`, {}),

  remove: (domain: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/domains/${encodeURIComponent(domain)}`),
};
