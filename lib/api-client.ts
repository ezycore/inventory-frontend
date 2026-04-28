/**
 * Core API Client
 * Provides base HTTP methods for making API requests
 */

export type ApiError = {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
};

// Global 401 handler - will be set by the auth store
let handle401: (() => void) | null = null;

export const setGlobal401Handler = (handler: () => void) => {
  handle401 = handler;
};

/**
 * Phase 3.3c — single-flight refresh-token rotation.
 *
 * On the first 401 we POST `/auth/refresh` with the stored refresh token
 * (YoCore mode) and retry the original request once. Concurrent 401s during
 * an in-flight refresh await the same promise so we never spawn N refreshes.
 *
 * On the legacy auth path the BE returns `501 REFRESH_NOT_SUPPORTED_LEGACY`
 * which we map to a hard logout (the previous behaviour).
 */
let refreshInFlight: Promise<string | null> | null = null;

async function performTokenRefresh(baseURL: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const authStore = await import("@/services/stores/use-auth-store");
  const state = authStore.useAuthStore.getState();
  const refreshToken = state.refreshToken;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${baseURL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { token?: string; refreshToken?: string };
    };
    const newToken = json.data?.token;
    const newRefresh = json.data?.refreshToken ?? refreshToken;
    if (!newToken) return null;
    state.setTokens(newToken, newRefresh);
    return newToken;
  } catch {
    return null;
  }
}

export class ApiClient {
  private baseURL: string;

  constructor(
    baseURL: string = process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000/api",
  ) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const authStore = await import("@/services/stores/use-auth-store");
    const isAuthenticated = authStore.useAuthStore.getState().isAuthenticated;
    const clearAuth = authStore.useAuthStore.getState().clearAuth;

    try {
      // Get token and active location from Zustand store (if available)
      let token: string | null = null;
      let activeLocationId: string | null = null;
      if (typeof window !== "undefined") {
        try {
          const state = authStore.useAuthStore.getState();
          token = state.token || null;
          activeLocationId = state.activeLocationId || null;
        } catch (e) {
          // Store might not be available yet
        }
      }

      // Check if body is FormData
      const isFormData = options.body instanceof FormData;

      const headers: HeadersInit = isFormData
        ? {
            ...options.headers,
          }
        : {
            "Content-Type": "application/json",
            ...options.headers,
          };

      // Add Authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Add active location header for location-scoped operations
      if (activeLocationId) {
        headers["X-Active-Location"] = activeLocationId;
      }

      const response = await fetch(url, {
        headers,
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        // 🚨 Handle 401 Unauthorized
        if (response.status === 401) {
          // Phase 3.3c: try a one-shot refresh-token rotation before bailing.
          // Skip on the refresh endpoint itself (avoid infinite loop) and on
          // /auth/login (a 401 there means bad credentials, not session expiry).
          const isAuthEndpoint =
            endpoint.startsWith("/auth/refresh") ||
            endpoint.startsWith("/auth/login");
          if (!isRetry && !isAuthEndpoint && isAuthenticated) {
            if (!refreshInFlight) {
              refreshInFlight = performTokenRefresh(this.baseURL).finally(
                () => {
                  refreshInFlight = null;
                },
              );
            }
            const newToken = await refreshInFlight;
            if (newToken) {
              return this.request<T>(endpoint, options, true);
            }
          }

          if (handle401) {
            handle401();
          }

          if (isAuthenticated) {
            location.pathname = "/login";
            clearAuth();
          }
        }

        throw {
          message:
            data.error ||
            data.message ||
            `HTTP error! status: ${response.status}`,
          status: response.status,
          ...data,
        } as ApiError;
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
