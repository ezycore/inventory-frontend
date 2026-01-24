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

    // Update profile with FormData support for avatar upload (in use)
    update: (data: FormData): Promise<ApiResponse<any>> => 
      apiClient.put("/profile", data),

    // Additional profile-specific methods (in use)
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

    // 2FA methods (in use)
    get2FAStatus: (): Promise<ApiResponse<{ enabled: boolean }>> =>
      apiClient.get("/profile/2fa/status"),

    enable2FA: (): Promise< // in use
      ApiResponse<{ secret: string; qrCode: string }>
    > => apiClient.post("/profile/2fa/enable", {}),

    verify2FA: (data: { // in use
      token: string;
    }): Promise<
      ApiResponse<{ message: string; backupCodes: string[] }>
    > => apiClient.post("/profile/2fa/verify", data),

    disable2FA: (data: { password: string }): Promise<ApiResponse<any>> => // in use
      apiClient.post("/profile/2fa/disable", data),

    // Organization ownership methods (in use)
    getOrganizationUsers: (): Promise< 
      ApiResponse<
        Array<{
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
          role: string;
        }>
      >
    > => apiClient.get("/profile/organization/users"),

    transferOwnership: (data: { // in use
      newOwnerId: string;
    }): Promise<ApiResponse<any>> =>
      apiClient.post("/profile/transfer-ownership", data),

    // Dummy methods to match standard API pattern (not used but required by factory)
    create: (data: FormData): Promise<ApiResponse<any>> => 
      Promise.reject(new Error("Create not supported for profile")),
    
    delete: (id: string): Promise<ApiResponse<void>> => 
      Promise.reject(new Error("Delete not supported for profile")),
  };
}
