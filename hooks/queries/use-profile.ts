import { organizationApi, profileApi } from "@/lib/api";
import { handleMutationError } from "@/lib/error-handling";
import { useAuthStore } from "@/stores/use-auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createResourceHooks, handleMutationSuccess } from "./helper";

// Query keys
export const profileKeys = {
  all: () => ["profile"] as const,
  list: () => [...profileKeys.all()] as const,
  detail: (id: string) => [...profileKeys.all(), id] as const,
  permissions: () => [...profileKeys.all(), "permissions"] as const,
};

// Profile DTO types
interface ProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

interface PreferencesDto {
  theme?: "light" | "dark" | "system";
  currency?: string;
  timezone?: string;
  language?: string;
}

interface OrganizationDto {
  name: string;
  address?: string;
  country?: string;
  timezone?: string;
  currency?: string;
}

// Custom update profile hook with auth store update (in use)
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
    onSuccess: (response, variables) => {
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

// Update avatar hook (in use)
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

// Remove avatar hook (in use)
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

// Get permissions
export function useProfilePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await profileApi.getPermissions();
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.permissions(), data);
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

// Update preferences hook
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: PreferencesDto) =>
      profileApi.updatePreferences(preferences),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      handleMutationSuccess(
        response.message || "Preferences updated successfully",
      );
    },
    onError: handleMutationError,
  });
}

// Update organization hook
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: OrganizationDto) =>
      organizationApi.update(data as unknown as FormData),
    onSuccess: (response) => {
      // Update organization in auth store
      if (response.data && user) {
        updateUser({
          ...user,
          organization: {
            ...user.organization,
            ...response.data,
          },
        });
      }
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      handleMutationSuccess(
        response.message || "Organization updated successfully",
      );
    },
    onError: handleMutationError,
  });
}

// 2FA Hooks

// Get 2FA status (in use)
export function use2FAStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await profileApi.get2FAStatus();
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...profileKeys.all(), "2fa-status"], data);
    },
    onError: handleMutationError,
  });
}

// Enable 2FA (in use)
export function useEnable2FA() {
  return useMutation({
    mutationFn: async () => {
      const response = await profileApi.enable2FA();
      return response.data;
    },
    onError: handleMutationError,
  });
}

// Verify 2FA (in use)
export function useVerify2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => profileApi.verify2FA({ token }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: [...profileKeys.all(), "2fa-status"],
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      if (response.message) {
        handleMutationSuccess(response.message);
      }
    },
    onError: handleMutationError,
  });
}

// Disable 2FA (in use)
export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => profileApi.disable2FA({ password }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: [...profileKeys.all(), "2fa-status"],
      });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      handleMutationSuccess(response.message || "2FA disabled successfully");
    },
    onError: handleMutationError,
  });
}

// Organization Ownership Hooks

// Get organization users (in use)
export function useOrganizationUsers() {
  return useMutation({
    mutationFn: async () => {
      const response = await profileApi.getOrganizationUsers();
      return response.data;
    },
    onError: handleMutationError,
  });
}

// Transfer ownership (in use)
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
