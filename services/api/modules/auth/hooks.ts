import { authApi, type SignupPayload } from "@/services/api";
import { handleMutationError } from "@/lib/error-handling";
import { getRootDomain, getSubdomain, workspaceUrl } from "@/lib/organization-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { handleMutationSuccess } from "../query-helpers";

export const useSignupAPi = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignupPayload) => authApi.signup(data),
    onSuccess: (data) => {
      handleMutationSuccess(data.message || "Item created successfully");
      queryClient.invalidateQueries();
      // Redirect to dashboard after successful login
      router.push("/login?registered=true");
    },
    onError: handleMutationError,
  });
};

// Login mutation hook
export function useLogin(show2FASetter: (show: boolean) => void) {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  

  return useMutation({
    mutationFn: (credentials: {
      email: string;
      password: string;
      organizationSlug?: string;
      twoFactorToken?: string;
    }) => authApi.login(credentials),
    onSuccess: (result) => {
      // Check if 2FA is required
      if (result.data?.requires2FA) {
        show2FASetter(true);
        // Don't redirect or show success message for 2FA required
        // The component will handle showing the 2FA input
        return;
      }

      // Store user data and token in auth store
      if (result.data?.user && result.data?.token) {
        setUser(result.data.user, result.data.token);
      }

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      handleMutationSuccess("Login successful!");

      // Redirect to the intended page or dashboard after successful login
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl") || "/dashboard";

      // When logging in from a reserved host (e.g. app.ezycore.com), cross to
      // the workspace subdomain instead of staying on the current origin.
      const slug = result.data?.user?.organization?.slug;
      if (slug && getRootDomain() && !getSubdomain()) {
        let path = callbackUrl;
        try { path = new URL(callbackUrl).pathname; } catch { /* already a path */ }
        window.location.href = workspaceUrl(slug, path);
        return;
      }

      router.push(callbackUrl);
    },
    onError: handleMutationError,
  });
}

// Logout mutation hook
export function  useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return () => {
    // Client-only logout: clear auth state (also removes cookies via store impl)
    clearAuth();

    // Remove sensitive / session-local localStorage keys
    try {
      const sensitiveKeys = [
        'easystock-auth',
        'sell-page-storage',
        'sales-order-storage',
        'purchase-page-storage',
        'sales-storage',
        'sales-return-storage',
        'stock-transfer-storage',
        'stock-adjustment-storage',
      ];

      sensitiveKeys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      // ignore localStorage errors (privacy mode / SSR safety)
    }
    // Clear react-query cache and redirect
    queryClient.clear();
    router.push('/login');
    handleMutationSuccess('Logged out successfully');
  };
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

//verify me
export function useMe() {
  const { setUser, token } = useAuthStore();
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
      queryClient.clear();
    },
  });
}
