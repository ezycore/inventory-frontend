// coding-standard: maintained
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

  /**
   * Read auth token + active location from the Zustand store. Shared by
   * `request` (JSON) and `download` (blob) so both attach identical headers.
   */
  private async getAuthState(): Promise<{
    token: string | null;
    activeLocationId: string | null;
    isAuthenticated: boolean;
    clearAuth: () => void;
  }> {
    const authStore = await import("@/services/stores/use-auth-store");
    const state = authStore.useAuthStore.getState();
    let token: string | null = null;
    let activeLocationId: string | null = null;
    if (typeof window !== "undefined") {
      token = state.token || null;
      activeLocationId = state.activeLocationId || null;
    }
    return {
      token,
      activeLocationId,
      isAuthenticated: state.isAuthenticated,
      clearAuth: state.clearAuth,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { token, activeLocationId, isAuthenticated, clearAuth } =
      await this.getAuthState();

    try {
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

      // Explicit tenant host — lets the split-origin BE resolve the org at the
      // auth boundary (login/forgot) even if Origin is unavailable. Belt-and-
      // suspenders alongside the browser Origin. See CUSTOM-DOMAINS-P1.md.
      if (typeof window !== "undefined") {
        headers["X-Tenant-Host"] = window.location.host;
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

  /**
   * GET a binary/text file (e.g. CSV export) and trigger a browser download.
   * Unlike `request`, this reads the response as a Blob (never `.json()`), and
   * honours the server's `Content-Disposition` filename when present.
   */
  async download(
    endpoint: string,
    options: { filename?: string } = {},
  ): Promise<void> {
    const { token, activeLocationId } = await this.getAuthState();

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (activeLocationId) headers["X-Active-Location"] = activeLocationId;

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw {
        success: false,
        error: `Download failed (status ${response.status})`,
        statusCode: response.status,
      } as ApiError;
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    const serverName = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
    const filename = serverName || options.filename || "download";

    if (typeof window === "undefined") return;
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
