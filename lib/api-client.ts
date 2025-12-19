import type {
  ApiResponse,
  PaginatedResponse,
  ProductFilters,
  VariantFilters,
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
  UpdateVariantDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateBrandDto,
  UpdateBrandDto,
  CreateStockMovementDto,
} from "@/types";
import { StockMovementType } from "@/types";

type ApiError = {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
};

class ApiClient {
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

      const response = await fetch(url, {
        credentials: 'include', // Always include cookies for authentication
        headers: isFormData
          ? {
            // Don't set Content-Type for FormData, let browser set it with boundary
            ...options.headers,
          }
          : {
            "Content-Type": "application/json",
            ...options.headers,
          },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
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

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Products API
export const productsApi = {
  getAll: (
    filters: ProductFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/products?${new URLSearchParams(filters as any)}`),

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/products/${id}`),

  getBySlug: (slug: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/products/slug/${slug}`),

  search: (query: string): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/products/search?q=${encodeURIComponent(query)}`),

  create: (data: CreateProductDto): Promise<ApiResponse<any>> =>
    apiClient.post("/products", data),

  update: (id: string, data: UpdateProductDto): Promise<ApiResponse<any>> =>
    apiClient.put(`/products/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/products/${id}`),
};

// Variants API
export const variantsApi = {
  getAll: (
    filters: VariantFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/variants?${new URLSearchParams(filters as any)}`),

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/variants/${id}`),

  getByProduct: (
    productId: string
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/variants?product_id=${productId}`),

  getLowStock: (): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get("/variants/low-stock"),

  getStats: (productId?: string): Promise<ApiResponse<any>> =>
    apiClient.get(
      `/variants/stats${productId ? `?product_id=${productId}` : ""}`
    ),

  create: (data: CreateVariantDto): Promise<ApiResponse<any>> =>
    apiClient.post("/variants", data),

  update: (id: string, data: UpdateVariantDto): Promise<ApiResponse<any>> =>
    apiClient.put(`/variants/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/variants/${id}`),
};

// Variant API alias for compatibility with existing hooks
export const variantApi = variantsApi;

// Categories API
export const categoriesApi = {
  getAll: (
    filters: {
      page?: number;
      limit?: number;
      status?: "active" | "inactive";
      parent_id?: string;
      [key: string]: any;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });
    return apiClient.get(`/categories${params.toString() ? `?${params.toString()}` : ''}`);
  },

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/categories/${id}`),

  create: (data: CreateCategoryDto): Promise<ApiResponse<any>> =>
    apiClient.post("/categories", data),

  update: (id: string, data: UpdateCategoryDto): Promise<ApiResponse<any>> =>
    apiClient.put(`/categories/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/categories/${id}`),
};

// Brands API
export const brandsApi = {
  getAll: (
    filters: {
      page?: number;
      limit?: number;
      status?: "active" | "inactive";
      [key: string]: any; // Allow dynamic filter fields
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle objects (like date-range) by JSON stringifying
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });
    return apiClient.get(`/brands?${params.toString()}`);
  },

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/brands/${id}`),

  getBySlug: (slug: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/brands/slug/${slug}`),

  create: (data: FormData): Promise<ApiResponse<any>> =>
    apiClient.post("/brands", data),

  update: (id: string, data: UpdateBrandDto | FormData): Promise<ApiResponse<any>> =>
    apiClient.put(`/brands/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/brands/${id}`),
};

// Stores API
export const storesApi = {
  getAll: (
    filters: {
      page?: number;
      limit?: number;
      status?: "active" | "inactive";
      [key: string]: any;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });
    return apiClient.get(`/stores?${params.toString()}`);
  },

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/stores/${id}`),

  create: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/stores", data),

  update: (id: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/stores/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/stores/${id}`),
};

// Warehouses API
export const warehousesApi = {
  getAll: (
    filters: {
      page?: number;
      limit?: number;
      status?: "active" | "inactive";
      [key: string]: any;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });
    return apiClient.get(`/warehouses?${params.toString()}`);
  },

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/warehouses/${id}`),

  create: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/warehouses", data),

  update: (id: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/warehouses/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/warehouses/${id}`),
};

// Stock Management API
export const stockApi = {
  getMovements: (
    filters: {
      variant_id?: string;
      product_id?: string;
      type?: string;
      reason?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: "asc" | "desc";
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/stock/movements?${new URLSearchParams(filters as any)}`),

  getMovementsByVariant: (
    variantId: string
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/stock/movements?variant_id=${variantId}`),

  getStockLevels: (): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get("/stock/levels"),

  createMovement: (data: CreateStockMovementDto): Promise<ApiResponse<any>> =>
    apiClient.post("/stock/movements", data),

  adjustStock: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/stock/adjust", data),

  transferStock: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/stock/transfer", data),

  getOverview: (productId?: string): Promise<ApiResponse<any>> =>
    apiClient.get(
      `/stock/overview${productId ? `?product_id=${productId}` : ""}`
    ),

  getLowStock: (limit?: number): Promise<ApiResponse<any[]>> =>
    apiClient.get(`/stock/low-stock${limit ? `?limit=${limit}` : ""}`),
};

// Legacy API endpoints for backward compatibility
export const inventoryApi = {
  getItems: (filters: Record<string, any> = {}) => productsApi.getAll(filters),

  getItem: (id: string) => productsApi.getById(id),

  searchItems: (query: string) => productsApi.getAll({ search: query }),

  getLowStockItems: () => stockApi.getLowStock(),

  createItem: (data: any) => productsApi.create(data),

  updateItem: (id: string, data: any) => productsApi.update(id, data),

  deleteItem: (id: string) => productsApi.delete(id),

  updateQuantity: (id: string, quantity: number, reason?: string) =>
    stockApi.createMovement({
      variant_id: id,
      type: quantity > 0 ? StockMovementType.IN : StockMovementType.OUT,
      quantity: Math.abs(quantity),
      reason: (reason as any) || "adjustment",
    }),
};

// Suppliers API (placeholder for future implementation)
export const suppliersApi = {
  getAll: () => Promise.resolve([]),
  getById: (id: string) => Promise.resolve(null),
  create: (data: any) => Promise.resolve(null),
  update: (id: string, data: any) => Promise.resolve(null),
  delete: (id: string) => Promise.resolve(null),
};

// Users API (placeholder for future implementation)
export const usersApi = {
  getProfile: () => Promise.resolve(null),
  getById: (id: string) => Promise.resolve(null),
  getAll: (filters: Record<string, any> = {}) => Promise.resolve([]),
  update: (id: string, data: any) => Promise.resolve(null),
  updateProfile: (data: any) => Promise.resolve(null),
};

// Auth API - using fetch directly since these are Next.js API routes
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || 'Login failed');
    }

    return result;
  },

  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    return response.json();
  },
};

// Profile API
export const profileApi = {
  get: (): Promise<ApiResponse<any>> => apiClient.get("/profile"),

  update: (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }): Promise<ApiResponse<any>> => apiClient.put("/profile", data),

  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<any>> => apiClient.put("/profile/password", data),

  updatePreferences: (preferences: {
    theme?: 'light' | 'dark' | 'system';
    currency?: string;
    timezone?: string;
    language?: string;
  }): Promise<ApiResponse<any>> => apiClient.put("/profile/preferences", { preferences }),

  updateAvatar: (avatar: string): Promise<ApiResponse<any>> =>
    apiClient.put("/profile/avatar", { avatar }),

  getPermissions: (): Promise<ApiResponse<{
    role: string;
    permissions: string[];
  }>> => apiClient.get("/profile/permissions"),
};

// Dashboard API
export const variantAttributesApi = {
  /**
   * Process variant attribute data before sending to API
   * Converts values string to array and handles both FormData and plain objects
   */
  processData: (data: any): any => {
    if (data instanceof FormData) {
      const formData = new FormData();
      for (const [key, value] of data.entries()) {
        if (key === 'values') {
          // Convert comma-separated string to array
          const valuesArray = typeof value === 'string'
            ? value.split(',').map((v: string) => v.trim()).filter((v: string) => v)
            : value;
          formData.append(key, JSON.stringify(valuesArray));
        } else {
          formData.append(key, value);
        }
      }
      return formData;
    } else {
      // Plain object
      return {
        ...data,
        values: typeof data.values === 'string'
          ? data.values.split(',').map((v: string) => v.trim()).filter((v: string) => v)
          : data.values
      };
    }
  },

  /**
   * Transform variant attribute data for editing
   * Converts values array to comma-separated string
   */
  transformForEdit: (item: any): any => {
    return {
      ...item,
      values: Array.isArray(item.values) ? item.values.join(', ') : item.values
    };
  },

  getAll: (
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      [key: string]: any;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });
    return apiClient.get(`/variants?${params.toString()}`);
  },

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/variants/${id}`),

  create: (data: any): Promise<ApiResponse<any>> => {
    const processedData = variantAttributesApi.processData(data);
    return apiClient.post("/variants", processedData);
  },

  update: (id: string, data: any): Promise<ApiResponse<any>> => {
    const processedData = variantAttributesApi.processData(data);
    return apiClient.put(`/variants/${id}`, processedData);
  },

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/variants/${id}`),
};

export const dashboardApi = {
  getStats: (): Promise<
    ApiResponse<{
      products: {
        total: number;
        active: number;
        inactive: number;
        archived: number;
      };
      variants: {
        total: number;
        active: number;
        lowStock: number;
        outOfStock: number;
      };
      categories: {
        total: number;
        active: number;
      };
      brands: {
        total: number;
        active: number;
      };
      stock: {
        totalValue: number;
        totalItems: number;
        lowStockAlerts: number;
      };
    }>
  > => apiClient.get("/dashboard/stats"),
};

export { apiClient };
export type { ApiError };
