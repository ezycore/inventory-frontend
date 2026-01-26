import type { ApiResponse, Location, PaginatedResponse } from "@/types";
import type { CreateUserDto, UpdateUserDto, User } from "@/types/users";
import { buildQueryParams, type BaseFilters } from "./utils";

export function createUsersApi(apiClient: any) {
  return {
    getAll: (
      filters: BaseFilters = {},
    ): Promise<ApiResponse<PaginatedResponse<User>>> =>
      apiClient.get(`/users${buildQueryParams(filters)}`), // used in users page table getAllData

    create: (data: CreateUserDto): Promise<ApiResponse<User>> =>
      apiClient.post("/users", data), // used in users page

    update: (id: string, data: UpdateUserDto): Promise<ApiResponse<User>> =>
      apiClient.put(`/users/${id}`, data), // used in users page

    toggleStatus: (id: string): Promise<ApiResponse<User>> =>
      apiClient.patch(`/users/${id}/toggle-status`, {}), // used in users page custom actions

    delete: (id: string): Promise<ApiResponse<{ message: string }>> =>
      apiClient.delete(`/users/${id}`), // used in users page

    // /** Get current user's accessible locations */
    getMyLocations: (): Promise<ApiResponse<Location[]>> =>
      apiClient.get("/users/me/locations"), // in use in changeDefaultLocationDialog

    /** Update current user's default location */
    updateMyDefaultLocation: (locationId: string): Promise<ApiResponse<User>> =>
      apiClient.put("/users/me/default-location", { locationId }), // in use in changeDefaultLocationDialog
  };
}
