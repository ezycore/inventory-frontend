import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { ApiMessage, TwoFactorStatus, TwoFactorSetup, TwoFactorVerify } from "@/types/api";

/**
 * Profile API - Current user profile management
 * Backend: /api/profile
 *
 * USAGE MAP:
 * -----------
 * update                → useUpdateProfile, useUpdateAvatar, useRemoveAvatar (use-profile.ts)
 *                         → profile/profile-info-tab.tsx, profile/profile-header.tsx
 * updatePassword        → useUpdatePassword (use-profile.ts) → profile/password-change-tab.tsx
 * get2FAStatus          → use2FAStatus (use-profile.ts) → profile/two-factor-tab.tsx
 * enable2FA             → useEnable2FA (use-profile.ts) → profile/two-factor-tab.tsx
 * verify2FA             → useVerify2FA (use-profile.ts) → profile/two-factor-tab.tsx
 * disable2FA            → useDisable2FA (use-profile.ts) → profile/two-factor-tab.tsx
 * getOrganizationUsers  → useOrganizationUsers (use-profile.ts) → profile/transfer-ownership-tab.tsx
 * transferOwnership     → useTransferOwnership (use-profile.ts) → profile/transfer-ownership-tab.tsx
 */
export const profileApi = {
  // PUT /api/profile - Update profile with FormData support for avatar upload
  // Used in: useUpdateProfile, useUpdateAvatar, useRemoveAvatar → profile-info-tab.tsx, profile-header.tsx
  update: (data: FormData): Promise<ApiResponse<any>> =>
    apiClient.put("/profile", data),

  // PUT /api/profile/password - Change password
  // Used in: useUpdatePassword → password-change-tab.tsx
  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<ApiMessage>> => apiClient.put("/profile/password", data),

  // ============= 2FA Methods =============

  // GET /api/profile/2fa/status - Get 2FA enabled status
  // Used in: use2FAStatus → two-factor-tab.tsx
  get2FAStatus: (): Promise<ApiResponse<TwoFactorStatus>> =>
    apiClient.get("/profile/2fa/status"),

  // POST /api/profile/2fa/enable - Enable 2FA and get QR code
  // Used in: useEnable2FA → two-factor-tab.tsx
  // Password-confirmed since 2026-08-09, same as disable2FA: turning 2FA ON from
  // a hijacked session locks the real owner out of their own account.
  enable2FA: (data: { password: string }): Promise<ApiResponse<TwoFactorSetup>> =>
    apiClient.post("/profile/2fa/enable", data),

  // POST /api/profile/2fa/verify - Verify 2FA token and get backup codes
  // Used in: useVerify2FA → two-factor-tab.tsx
  verify2FA: (data: {
    token: string;
  }): Promise<ApiResponse<TwoFactorVerify>> =>
    apiClient.post("/profile/2fa/verify", data),

  // POST /api/profile/2fa/disable - Disable 2FA
  // Used in: useDisable2FA → two-factor-tab.tsx
  disable2FA: (data: { password: string }): Promise<ApiResponse<ApiMessage>> =>
    apiClient.post("/profile/2fa/disable", data),

  // ============= Organization Ownership Methods =============

  // GET /api/profile/organization/users - Get all users in organization
  // Used in: useOrganizationUsers → transfer-ownership-tab.tsx
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

  // POST /api/profile/transfer-ownership - Transfer organization ownership
  // Used in: useTransferOwnership → transfer-ownership-tab.tsx
  transferOwnership: (data: {
    newOwnerId: string;
  }): Promise<ApiResponse<any>> =>
    apiClient.post("/profile/transfer-ownership", data),
};
