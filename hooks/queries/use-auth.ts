import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/use-auth-store';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

// Login mutation hook
export function useLogin() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      if (result.success === true) {
        // Set auth data in store
        setAuth(result.data.user, result.data.token);

        toast.success('Login successful!');

        // Redirect to dashboard after successful login
        router.push('/dashboard');
      } else {
        toast.error('Login failed');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'An error occurred during login');
    },
  });
}

// Logout mutation hook
export function useLogout() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear auth store
      clearAuth();

      // Clear all queries
      queryClient.clear();

      toast.success('Successfully Logged out ');
      
      // Redirect to login page
      router.push('/login');
    },
    onError: (error: Error) => {
      // Even if API fails, clear local auth
      clearAuth();
      queryClient.clear();
      router.push('/login');
      
      toast.error(error.message || 'Logout failed');
    },
  });
}
