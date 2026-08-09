// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type {
  OrgRole,
  PermissionCatalog,
  RoleDelete,
  RoleUsage,
} from "@/types/api";

export interface RoleWriteInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

/**
 * Roles are addressed by **slug**, not id — that is what `user.role` carries and
 * what the backend's per-org unique index is built on. Renaming a role never
 * changes it.
 */
export const rolesApi = {
  getAll: (): Promise<ApiResponse<OrgRole[]>> => apiClient.get("/roles"),

  /** The permission tree a role may be composed from, filtered by the org's plan. */
  getCatalog: (): Promise<ApiResponse<PermissionCatalog>> =>
    apiClient.get("/roles/catalog"),

  /** How many users hold a role — read before offering to delete it. */
  getUsage: (slug: string): Promise<ApiResponse<RoleUsage>> =>
    apiClient.get(`/roles/${encodeURIComponent(slug)}/usage`),

  create: (data: RoleWriteInput): Promise<ApiResponse<OrgRole>> =>
    apiClient.post("/roles", data),

  update: (slug: string, data: RoleWriteInput): Promise<ApiResponse<OrgRole>> =>
    apiClient.put(`/roles/${encodeURIComponent(slug)}`, data),

  /**
   * `reassignTo` moves every holder to that role first, inside one transaction.
   * Without it the backend answers 409 `ROLE_IN_USE` whenever anyone holds the
   * role — deleting a role in use would lock its holders out of the product
   * entirely, so the API refuses rather than warns.
   */
  remove: (slug: string, reassignTo?: string): Promise<ApiResponse<RoleDelete>> =>
    apiClient.delete(
      `/roles/${encodeURIComponent(slug)}${
        reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : ""
      }`,
    ),
};
