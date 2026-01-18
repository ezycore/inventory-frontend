import type { ApiResponse } from "@/types";

/**
 * Auth API - Direct backend calls
 */
export function createAuthApi(apiClient: any) {
  return {
    login: (credentials: {
      email: string;
      password: string;
      organizationSlug?: string;
    }): Promise<ApiResponse<any>> => apiClient.post("/auth/login", credentials),

    logout: (): Promise<ApiResponse<void>> => apiClient.post("/auth/logout"),

    me: (): Promise<ApiResponse<any>> => apiClient.get("/auth/me"),

    verifyEmail: (data: { token: string }): Promise<ApiResponse<any>> =>
      apiClient.post("/auth/verify-email", data),

    resendVerification: (data: {
      email: string;
      organizationSlug?: string;
    }): Promise<ApiResponse<any>> =>
      apiClient.post("/auth/resend-verification", data),

    forgotPassword: (data: {
      email: string;
      organizationSlug?: string;
    }): Promise<ApiResponse<any>> =>
      apiClient.post("/auth/forgot-password", data),

    resetPassword: (data: {
      token: string;
      newPassword: string;
    }): Promise<ApiResponse<any>> =>
      apiClient.post("/auth/reset-password", data),
  };
}
