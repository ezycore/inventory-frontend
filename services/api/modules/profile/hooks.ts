import { organizationApi, profileApi } from "@/services/api";
import { handleMutationError } from "@/lib/error-handling";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleMutationSuccess } from "../query-helpers";

// Query keys
export const profileKeys = {
  all: () => ["profile"] as const,
  twoFactorStatus: () => [...profileKeys.all(), "2fa-status"] as const,
};

// Profile DTO types
interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

interface OrganizationDto {
  name: string;
  address?: string;
  country?: string;
  timezone?: string;
  currency?: string;
}

// ============= Profile Management Hooks =============

// Update profile hook with auth store update
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: FormData | ({ id: string } & any)) => {
      if (data instanceof FormData) {
        return profileApi.update(data);
      }
      const { id, ...rest } = data;
      return profileApi.update(rest);
    },
    onSuccess: (response) => {
      // Update auth store with new user data
      if (response.data) {
        updateUser(response.data);
      }

      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      queryClient.invalidateQueries({ queryKey: ["auth"] });

      if (response.message) {
        handleMutationSuccess(response.message);
      }
    },
    onError: handleMutationError,
  });
}

// Update avatar hook
export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (formData: FormData) => profileApi.update(formData),
    onSuccess: (response) => {
      // Update the user in auth store
      if (response.data) {
        updateUser(response.data);
      }
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      handleMutationSuccess(
        response.message || "Profile image updated successfully",
      );
    },
    onError: handleMutationError,
  });
}

// Remove avatar hook
export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("removeAvatar", "true");
      return profileApi.update(formData);
    },
    onSuccess: (response) => {
      // Update the user in auth store
      if (response.data) {
        updateUser(response.data);
      }
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      handleMutationSuccess("Profile image removed successfully");
    },
    onError: handleMutationError,
  });
}

// Update password hook
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: UpdatePasswordDto) => profileApi.updatePassword(data),
    onSuccess: (response) => {
      handleMutationSuccess(
        response.message || "Password changed successfully",
      );
    },
    onError: handleMutationError,
  });
}

// ============= Organization Hooks =============
// Note: useUpdateOrganization is now in organization/hooks.ts
// Import from there: import { useUpdateOrganization } from '@/services/api'

// ============= 2FA Hooks =============

// Get 2FA status
export function use2FAStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await profileApi.get2FAStatus();
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.twoFactorStatus(), data);
    },
    onError: handleMutationError,
  });
}

// Enable 2FA
export function useEnable2FA() {
  return useMutation({
    mutationFn: async () => {
      const response = await profileApi.enable2FA();
      return response.data;
    },
    onError: handleMutationError,
  });
}

// Verify 2FA
export function useVerify2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => profileApi.verify2FA({ token }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.twoFactorStatus(),
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      if (response.message) {
        handleMutationSuccess(response.message);
      }
    },
    onError: handleMutationError,
  });
}

// Disable 2FA
export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => profileApi.disable2FA({ password }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.twoFactorStatus(),
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      handleMutationSuccess(response.message || "2FA disabled successfully");
    },
    onError: handleMutationError,
  });
}

// ============= Organization Ownership Hooks =============

// Get organization users
export function useOrganizationUsers() {
  return useMutation({
    mutationFn: async () => {
      const response = await profileApi.getOrganizationUsers();
      return response.data;
    },
    onError: handleMutationError,
  });
}

// Transfer ownership
export function useTransferOwnership() {
  const queryClient = useQueryClient();
  const { updateUser, user } = useAuthStore();

  return useMutation({
    mutationFn: (newOwnerId: string) =>
      profileApi.transferOwnership({ newOwnerId }),
    onSuccess: (response) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });

      // Update auth store - current user is no longer owner
      if (user && response.data) {
        updateUser({
          ...user,
          organization: {
            ...user.organization,
            ownerId: response.data.newOwner.id,
          },
        });
      }

      handleMutationSuccess(
        response.message || "Ownership transferred successfully",
      );
    },
    onError: handleMutationError,
  });
}
