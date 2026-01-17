import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/use-auth-store';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { handleMutationSuccess } from './helper';
import { handleMutationError } from '@/lib/error-handling';

// Login mutation hook
export function useLogin() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authApi.login(credentials),
    onSuccess: (result) => {
      // Store user data and token in auth store
      if (result.data?.user && result.data?.token) {
        setUser(result.data.user, result.data.token);
        console.log('✅ User and token stored in auth store');
      }

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      handleMutationSuccess('Login successful!');

      // Redirect to dashboard after successful login
      router.push('/dashboard');
    },
    onError: handleMutationError,
  });
}

// Logout mutation hook
export function useLogout() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear auth store
      clearAuth();

      // Clear all queries
      queryClient.clear();

      handleMutationSuccess('Logged out successfully');

      // Redirect to login page
      router.push('/login');
    },
    onError: (error) => {
      // Even if API fails, clear local auth
      clearAuth();
      queryClient.clear();
      router.push('/login');

      handleMutationError(error);
    },
  });
}

// Verify email mutation hook
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: { token: string }) => authApi.verifyEmail(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || 'Email verified successfully!');
    },
    onError: handleMutationError,
  });
}

// Resend verification email mutation hook
export function useResendVerification() {
  return useMutation({
    mutationFn: (data: { email: string; organizationSlug?: string }) =>
      authApi.resendVerification(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || 'Verification email sent successfully!');
    },
    onError: handleMutationError,
  });
}

// Forgot password mutation hook
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { email: string; organizationSlug?: string }) =>
      authApi.forgotPassword(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || 'Password reset link sent to your email!');
    },
    onError: handleMutationError,
  });
}

// Reset password mutation hook
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { token: string; newPassword: string }) =>
      authApi.resetPassword(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || 'Password reset successfully!');
      router.push('/login');
    },
    onError: handleMutationError,
  });
}

