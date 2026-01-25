import type { ApiResponse, PaginatedResponse, Location } from "@/types";
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
} from "@/types/users";
import { buildQueryParams, type BaseFilters } from "./utils";

export function createUsersApi(apiClient: any) {
  return {
    getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<User>>> =>
      apiClient.get(`/users${buildQueryParams(filters)}`),
    
    create: (data: CreateUserDto): Promise<ApiResponse<User>> => 
      apiClient.post("/users", data),
    
    update: (id: string, data: UpdateUserDto): Promise<ApiResponse<User>> => 
      apiClient.put(`/users/${id}`, data),
    
    toggleStatus: (id: string): Promise<ApiResponse<User>> => 
      apiClient.patch(`/users/${id}/toggle-status`, {}),
    
    delete: (id: string): Promise<ApiResponse<{ message: string }>> => 
      apiClient.delete(`/users/${id}`),

    // /** Get current user's accessible locations */
    getMyLocations: (): Promise<ApiResponse<Location[]>> =>
      apiClient.get("/users/me/locations"),

    /** Update current user's default location */
    updateMyDefaultLocation: (locationId: string): Promise<ApiResponse<User>> =>
      apiClient.put("/users/me/default-location", { locationId }),
  };
}
