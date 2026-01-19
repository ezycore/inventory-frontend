import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api';
import { toast } from 'sonner';
import { createResourceHooks, handleMutationSuccess } from './helper';
import { useAuthStore } from '@/stores/use-auth-store';

// Local error handler
const handleError = (error: any) => {
  const message = error?.response?.data?.message || error?.message || 'An error occurred';
  toast.error(message);
};

// Query keys
export const profileKeys = {
  all: () => ['profile'] as const,
  list: () => [...profileKeys.all()] as const,
  detail: (id: string) => [...profileKeys.all(), id] as const,
  permissions: () => [...profileKeys.all(), 'permissions'] as const,
};

// Profile DTO types
interface ProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// Create resource hooks using the factory
const profileHooks = createResourceHooks<any, ProfileDto, ProfileDto>(
  profileApi,
  profileKeys as any
);

// Export standard hooks - use 'me' as the ID for current user profile
export const useProfile = () => profileHooks.useDetail('me');

// Custom update hook with auth store update
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();
  
  return useMutation({
    mutationFn: (data: FormData | ({ id: string } & any)) => {
      if (data instanceof FormData) {
        const id = data.get('id') as string;
        return profileApi.update(id, data);
      }
      const { id, ...rest } = data;
      return profileApi.update(id, rest);
    },
    onSuccess: (response, variables) => {
      // Update auth store with new user data
      if (response.data) {
        updateUser(response.data);
      }
      
      const id = variables instanceof FormData
        ? variables.get('id') as string
        : variables.id;

      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      if (response.message) {
        handleMutationSuccess(response.message);
      }
    },
    onError: handleError,
  });
};

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
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      toast.success(response.message || 'Preferences updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });
}
