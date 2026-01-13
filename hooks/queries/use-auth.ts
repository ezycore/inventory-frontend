import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/use-auth-store';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

// Login mutation hook
export function useLogin() {
  const router = useRouter();
  const { setUser,setToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      // Store user data and token in auth store
      if (result.data?.user && result.data?.token) {
        setUser(result.data.user);
        setToken(result.data.token);
      }

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      toast.success('Login successful!');
      
      // Redirect to dashboard after successful login
      router.push('/dashboard');
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

      toast.success('Logged out successfully');
      
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
