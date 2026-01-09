import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api-client';
import { toast } from 'sonner';

// Query keys
export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
};

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      avatar?: string;
    }) => profileApi.update(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success(response.message || 'Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

// Update password
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: {
      currentPassword: string;
      newPassword: string;
    }) => profileApi.updatePassword(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
}

// Update preferences
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      preferences: {
        theme?: 'light' | 'dark' | 'system';
        currency?: string;
        timezone?: string;
        language?: string;
      }
    }) => profileApi.updatePreferences(data.preferences),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success(response.message || 'Preferences updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });
}

// Update avatar
export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatar: string) => profileApi.updateAvatar(avatar),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success(response.message || 'Avatar updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update avatar');
    },
  });
}
