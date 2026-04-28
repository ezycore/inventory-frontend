import { authApi } from "@/services/api";
import { handleMutationError } from "@/lib/error-handling";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { handleMutationSuccess } from "../query-helpers";

export const useSignupAPi = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: FormData) => authApi.signup(data),
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
export interface PendingWorkspaceSelection {
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    role?: string;
  }>;
  pendingAccessToken: string;
  pendingRefreshToken: string;
}

export function useLogin(
  show2FASetter: (show: boolean) => void,
  onWorkspaceSelection?: (pending: PendingWorkspaceSelection) => void,
) {
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

      // Phase 3.3c (YoCore mode): user has access to >1 workspace and must
      // pick one before we can hand back a workspace-scoped session.
      if (
        result.data?.requiresWorkspaceSelection &&
        Array.isArray(result.data?.workspaces) &&
        onWorkspaceSelection
      ) {
        onWorkspaceSelection({
          workspaces: result.data.workspaces,
          pendingAccessToken: result.data.pendingAccessToken,
          pendingRefreshToken: result.data.pendingRefreshToken,
        });
        return;
      }

      // Store user data and token in auth store
      if (result.data?.user && result.data?.token) {
        setUser(
          result.data.user,
          result.data.token,
          result.data.refreshToken ?? null,
        );
      }

      // Invalidate all queries to refresh data
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

/**
 * Phase 3.3c — finalise a multi-workspace login.
 * The component renders a workspace picker, calls this with the chosen
 * workspaceId + the pendingAccess/RefreshToken from the previous login
 * response, and on success we land on /dashboard.
 */
export function useSelectWorkspace() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      pendingAccessToken: string;
      pendingRefreshToken: string;
    }) => authApi.selectWorkspace(data),
    onSuccess: (result) => {
      if (result.data?.user && result.data?.token) {
        setUser(
          result.data.user,
          result.data.token,
          result.data.refreshToken ?? null,
        );
      }
      queryClient.invalidateQueries();
      handleMutationSuccess("Workspace selected");
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl") || "/dashboard";
      router.push(callbackUrl);
    },
    onError: handleMutationError,
  });
}

/**
 * Phase 3.6c — list workspaces the active session can switch into. Powers
 * the top-bar workspace switcher. Disabled when there is no token so the
 * public auth pages don't trigger a 401.
 */
export function useMyWorkspaces() {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ["auth", "workspaces"],
    queryFn: async () => {
      const response = await authApi.listWorkspaces();
      return response.data.workspaces;
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Phase 3.6c — switch the active workspace mid-session. On success we
 * replace the auth-store user + access token, invalidate every query
 * (server data is workspace-scoped on the backend), and refresh the
 * current route.
 */
export function useSwitchWorkspace() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, refreshToken } = useAuthStore();

  return useMutation({
    mutationFn: (workspaceId: string) => {
      if (!refreshToken) {
        throw new Error("Missing refresh token");
      }
      return authApi.switchWorkspace({ workspaceId, refreshToken });
    },
    onSuccess: (result) => {
      if (result.data?.user && result.data?.token) {
        setUser(
          result.data.user,
          result.data.token,
          result.data.refreshToken ?? refreshToken,
        );
      }
      queryClient.invalidateQueries();
      handleMutationSuccess(result.message || "Workspace switched");
      router.refresh();
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
    // Best-effort server-side revoke (YoCore deletes the Redis session;
    // legacy returns the same shape with no side-effect). Fire-and-forget
    // so the user lands on /login immediately.
    authApi.logout().catch(() => {});
    clearAuth();
    router.push("/login");
    queryClient.clear();
    handleMutationSuccess("Logged out successfully");
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
