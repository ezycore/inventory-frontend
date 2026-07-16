import { apiClient } from "@/lib/api-client";
import type { ApiResponse, Location, PaginatedResponse } from "@/types";
import type { CreateUserDto, UpdateUserDto } from "@/types/users";
import type { AdminUser } from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

/**
 * Users API - user management functions gated by resolved permissions.
 * Backend: /api/users
 *
 * USAGE MAP:
 * -----------
 * getAll                  → createResourceHooks → app/(protected)/users/page.tsx (DataTable)
 * create                  → useCreateUser (use-users.ts) → users/page.tsx
 * update                  → useUpdateUser (use-users.ts) → users/page.tsx
 * toggleStatus            → useToggleUserStatus (use-users.ts) → users/page.tsx (custom actions)
 * delete                  → useDeleteUser (use-users.ts) → users/page.tsx
 * getMyLocations          → useMyLocations (use-users.ts) → LocationSwitcher.tsx, ChangeDefaultLocationDialog.tsx
 * updateMyDefaultLocation → useUpdateMyDefaultLocation (use-users.ts) → ChangeDefaultLocationDialog.tsx
 */
export const usersApi = {
  // GET /api/users - Get all users (paginated, filtered)
  // Used in: DataTable → users/page.tsx
  getAll: (
    filters: BaseFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<AdminUser>>> =>
    apiClient.get(`/users${buildQueryParams(filters)}`),

  // GET /api/users/stats - Get user statistics
  getStats: (): Promise<ApiResponse<any>> =>
    apiClient.get("/users/stats"),

  // POST /api/users - Create new user
  // Used in: useCreateUser → users/page.tsx
  create: (data: CreateUserDto): Promise<ApiResponse<AdminUser>> =>
    apiClient.post("/users", data),

  // PUT /api/users/:id - Update user
  // Used in: useUpdateUser → users/page.tsx
  update: (id: string, data: UpdateUserDto): Promise<ApiResponse<AdminUser>> =>
    apiClient.put(`/users/${id}`, data),

  // PATCH /api/users/:id/toggle-status - Activate/deactivate user
  // Used in: useToggleUserStatus → users/page.tsx (custom actions)
  toggleStatus: (id: string): Promise<ApiResponse<AdminUser>> =>
    apiClient.patch(`/users/${id}/toggle-status`, {}),

  // DELETE /api/users/:id - Delete user
  // Used in: useDeleteUser → users/page.tsx
  delete: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/users/${id}`),

  // ============= Current User Location Methods =============

  // GET /api/users/me/locations - Get current user's accessible locations
  // Used in: useMyLocations → LocationSwitcher.tsx, ChangeDefaultLocationDialog.tsx
  getMyLocations: (): Promise<ApiResponse<Location[]>> =>
    apiClient.get("/users/me/locations"),

  // PUT /api/users/me/default-location - Update current user's default location
  // Used in: useUpdateMyDefaultLocation → ChangeDefaultLocationDialog.tsx
  updateMyDefaultLocation: (locationId: string): Promise<ApiResponse<AdminUser>> =>
    apiClient.put("/users/me/default-location", { locationId }),
};
