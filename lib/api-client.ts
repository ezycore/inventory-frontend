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

let getAuthToken: (() => string | null) | null = null;

export const setAuthTokenGetter = (getter: () => string | null) => {
  getAuthToken = getter;
};

export class ApiClient {
  private baseURL: string;

  constructor(
    baseURL: string = process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000/api"
  ) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      // Check if body is FormData
      const isFormData = options.body instanceof FormData;

      // Get auth token from store
      const token = getAuthToken ? getAuthToken() : null;

      const response = await fetch(url, {
        headers: isFormData
          ? {
              // Don't set Content-Type for FormData, let browser set it with boundary
              ...options.headers,
              Authorization: token ? `Bearer ${token}` : undefined,
            }
          : {
              "Content-Type": "application/json",
              ...options.headers,
              Authorization: token ? `Bearer ${token}` : undefined,
            },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        // 🚨 Handle 401 Unauthorized - user deleted, disabled, or token invalid
        if (response.status === 401 && handle401) {
          console.warn("🚨 401 Unauthorized - Auto logging out user");
          handle401();
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
