import type { ApiResponse } from "@/types";
import { buildQueryParams, type BaseFilters } from "./utils";

/**
 * Profile API - Following standard architecture
 */
export function createProfileApi(apiClient: any) {
  return {
    // Get profile (equivalent to getById for current user)
    getAll: (): Promise<ApiResponse<any>> => apiClient.get("/profile"),
    
    getById: (id: string): Promise<ApiResponse<any>> => apiClient.get("/profile"),

    // Update profile with FormData support for avatar upload
    update: (id: string, data: FormData): Promise<ApiResponse<any>> => 
      apiClient.put("/profile", data),

    // Additional profile-specific methods
    updatePassword: (data: {
      currentPassword: string;
      newPassword: string;
    }): Promise<ApiResponse<any>> => apiClient.put("/profile/password", data),

    updatePreferences: (preferences: {
      theme?: "light" | "dark" | "system";
      currency?: string;
      timezone?: string;
      language?: string;
    }): Promise<ApiResponse<any>> =>
      apiClient.put("/profile/preferences", { preferences }),

    getPermissions: (): Promise<
      ApiResponse<{
        role: string;
        permissions: string[];
      }>
    > => apiClient.get("/profile/permissions"),

    // Dummy methods to match standard API pattern (not used but required by factory)
    create: (data: FormData): Promise<ApiResponse<any>> => 
      Promise.reject(new Error("Create not supported for profile")),
    
    delete: (id: string): Promise<ApiResponse<void>> => 
      Promise.reject(new Error("Delete not supported for profile")),
  };
}
