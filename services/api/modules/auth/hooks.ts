import { authApi, type SignupPayload } from "@/services/api";
import { handleMutationError } from "@/lib/error-handling";
import { workspaceUrl } from "@/lib/organization-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { handleMutationSuccess } from "../query-helpers";

/** Pull the submitted organization slug out of a signup payload (object or FormData). */
function signupSlugFromPayload(payload: SignupPayload): string | null {
  const raw =
    typeof FormData !== "undefined" && payload instanceof FormData
      ? payload.get("organizationSlug")
      : (payload as Record<string, unknown>).organizationSlug;
  return typeof raw === "string" && raw.trim() ? raw.trim().toLowerCase() : null;
}

export const useSignupAPi = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignupPayload) => authApi.signup(data),
    onSuccess: (data, variables) => {
      handleMutationSuccess(data.message || "Account created successfully");
      // A brand-new workspace invalidates by definition: nothing in the cache belongs to it yet.
      // eslint-disable-next-line query-cache/no-blanket-invalidate -- new workspace, empty cache
      queryClient.invalidateQueries();

      // Hand the new owner to their workspace login with the "verify your
      // email" notice. In production that's their subdomain (a different
      // origin → full-page load); locally/staging workspaceUrl returns a
      // relative path, so we keep the SPA router.
      const slug = signupSlugFromPayload(variables);
      const target = slug
        ? workspaceUrl(slug, "/login?registered=true")
        : "/login?registered=true";
      if (target.startsWith("/")) {
        router.push(target);
      } else {
        window.location.assign(target);
      }
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

      // A session change: whatever is cached belongs to the previous user and org, so none of it
      // may survive the login.
      // eslint-disable-next-line query-cache/no-blanket-invalidate -- session boundary
      queryClient.invalidateQueries();

      handleMutationSuccess("Login successful!");

      // Redirect to the intended page or dashboard after successful login
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl") || "/dashboard";
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

// Reset password mutation hook. The post-reset redirect lives in the page
// (reset-password/page.tsx) because the login target may be the user's
// workspace subdomain (a different origin in production), which needs a
// full-page navigation rather than the client-side router.
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { token: string; newPassword: string }) =>
      authApi.resetPassword(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Password reset successfully!");
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
