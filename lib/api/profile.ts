import type { ApiResponse } from "@/types";

export function createProfileApi(apiClient: any) {
  return {
    get: (): Promise<ApiResponse<any>> => apiClient.get("/profile"),

    update: (data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      avatar?: string;
    }): Promise<ApiResponse<any>> => apiClient.put("/profile", data),

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

    updateAvatar: (avatar: string): Promise<ApiResponse<any>> =>
      apiClient.put("/profile/avatar", { avatar }),

    getPermissions: (): Promise<
      ApiResponse<{
        role: string;
        permissions: string[];
      }>
    > => apiClient.get("/profile/permissions"),
  };
}
