import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPermissionsDto,
  UpdateUserRoleDto,
} from "@/types/users";

export function createUsersApi(apiClient: any) {
  return {
    getAll: async (params?: { page?: number; limit?: number; [key: string]: any }): Promise<ApiResponse<PaginatedResponse<User>>> => {
      const response = await apiClient.get("/users");
      // Backend returns array, need to convert to paginated format
      const users = response.data || [];
      return {
        ...response,
        data: {
          items: users,
          total: users.length,
          page: 1,
          limit: users.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      };
    },
    
    getById: (id: string): Promise<ApiResponse<User>> => 
      apiClient.get(`/users/${id}`),
    
    create: (data: CreateUserDto): Promise<ApiResponse<User>> => 
      apiClient.post("/users", data),
    
    update: (id: string, data: UpdateUserDto): Promise<ApiResponse<User>> => 
      apiClient.put(`/users/${id}`, data),
    
    toggleStatus: (id: string): Promise<ApiResponse<User>> => 
      apiClient.patch(`/users/${id}/toggle-status`, {}),
    
    delete: (id: string): Promise<ApiResponse<{ message: string }>> => 
      apiClient.delete(`/users/${id}`),
  };
}
