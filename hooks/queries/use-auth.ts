import { authApi } from "@/lib/api";
import { handleMutationError } from "@/lib/error-handling";
import { useAuthStore } from "@/stores/use-auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { handleMutationSuccess } from "./helper";

// Login mutation hook
export function useLogin() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: {
      email: string;
      password: string;
      organizationSlug?: string;
    }) => authApi.login(credentials),
    onSuccess: (result) => {
      // Store user data and token in auth store
      if (result.data?.user && result.data?.token) {
        setUser(result.data.user, result.data.token);
      }

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      handleMutationSuccess("Login successful!");

      // Redirect to dashboard after successful login
      router.push("/dashboard");
    },
    onError: handleMutationError,
  });
}

// Logout mutation hook
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();
  return () => {
    clearAuth();
    router.push("/login");
    queryClient.clear();
    handleMutationSuccess("Logged out successfully");
  }
}

// Verify email mutation hook
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: { token: string }) => authApi.verifyEmail(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Email verified successfully!");
    },
    onError: handleMutationError,
  });
}

// Resend verification email mutation hook
export function useResendVerification() {
  return useMutation({
    mutationFn: (data: { email: string; organizationSlug: string }) =>
      authApi.resendVerification(data),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "Verification email sent successfully!",
      );
    },
    onError: handleMutationError,
  });
}

// Forgot password mutation hook
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { email: string; organizationSlug: string }) =>
      authApi.forgotPassword(data),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "Password reset link sent to your email!",
      );
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
      handleMutationSuccess(result.message || "Password reset successfully!");
      router.push("/login");
    },
    onError: handleMutationError,
  });
}

//varify me
export function useMe() {
  const { setUser, token, clearAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.me(),
    onSuccess: (result) => {
      // Store user data in auth store
      if (result.data?.user) {
        setUser(result.data.user, token);
      }
    },
    onError: (error) => {
      handleMutationError(error);
      clearAuth();
      router.push("/login");
      queryClient.clear();
    },
  });
}
