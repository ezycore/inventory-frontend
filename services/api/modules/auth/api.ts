import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

/**
 * Auth API - Authentication endpoints
 * Backend: /api/auth
 *
 * USAGE MAP:
 * -----------
 * signup          → useSignupAPi (use-auth.ts) → app/(auth)/signup/page.tsx
 * login           → useLogin (use-auth.ts) → components/login/login-form.tsx
 * me              → useMe (use-auth.ts) → app/(protected)/layout.tsx
 * verifyEmail     → useVerifyEmail (use-auth.ts) → app/(auth)/verify-email/page.tsx
 * resendVerification → useResendVerification (use-auth.ts) → app/(auth)/resend-verification/page.tsx
 * forgotPassword  → useForgotPassword (use-auth.ts) → app/(auth)/forgot-password/page.tsx
 * resetPassword   → useResetPassword (use-auth.ts) → app/(auth)/reset-password/page.tsx
 */
export const authApi = {
  // POST /api/auth/signup - Register new organization owner
  // Used in: useSignupAPi → signup/page.tsx
  signup: (data: FormData): Promise<ApiResponse<any>> =>
    apiClient.post("/auth/signup", data),

  // POST /api/auth/login - Login user
  // Used in: useLogin → login-form.tsx
  login: (credentials: {
    email: string;
    password: string;
    organizationSlug?: string;
    twoFactorToken?: string;
  }): Promise<ApiResponse<any>> => apiClient.post("/auth/login", credentials),

  // GET /api/auth/me - Get current authenticated user
  // Used in: useMe → (protected)/layout.tsx
  me: (): Promise<ApiResponse<any>> => apiClient.get("/auth/me"),

  // POST /api/auth/verify-email - Verify email with token
  // Used in: useVerifyEmail → verify-email/page.tsx
  verifyEmail: (data: { token: string }): Promise<ApiResponse<any>> =>
    apiClient.post("/auth/verify-email", data),

  // POST /api/auth/resend-verification - Resend verification email
  // Used in: useResendVerification → resend-verification/page.tsx
  resendVerification: (data: {
    email: string;
    organizationSlug?: string;
  }): Promise<ApiResponse<any>> =>
    apiClient.post("/auth/resend-verification", data),

  // POST /api/auth/forgot-password - Request password reset
  // Used in: useForgotPassword → forgot-password/page.tsx
  forgotPassword: (data: {
    email: string;
    organizationSlug: string;
  }): Promise<ApiResponse<any>> =>
    apiClient.post("/auth/forgot-password", data),

  // POST /api/auth/reset-password - Reset password with token
  // Used in: useResetPassword → reset-password/page.tsx
  resetPassword: (data: {
    token: string;
    newPassword: string;
  }): Promise<ApiResponse<any>> =>
    apiClient.post("/auth/reset-password", data),
};
