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
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const authStore = await import("@/stores/use-auth-store");
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
        // 🚨 Handle 401 Unauthorized - user deleted, disabled, or token invalid
        if (response.status === 401) {
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
