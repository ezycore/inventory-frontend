import type { ApiResponse } from "@/types";
import type {
  User,
  RegisterUserDto,
  UpdateUserPermissionsDto,
  UpdateUserRoleDto,
  RegisterUserResponse,
  UsersResponse,
  UserResponse,
  PermissionsResponse,
} from "@/types/users";

export function createUsersApi(apiClient: any) {
  return {
    getAll: (): Promise<UsersResponse> => apiClient.get("/users"),
    
    getById: (id: string): Promise<UserResponse> => apiClient.get(`/users/${id}`),
    
    register: (data: RegisterUserDto): Promise<RegisterUserResponse> => 
      apiClient.post("/users", data),
    
    updatePermissions: (id: string, data: UpdateUserPermissionsDto): Promise<UserResponse> => 
      apiClient.patch(`/users/${id}/permissions`, data),
    
    updateRole: (id: string, data: UpdateUserRoleDto): Promise<UserResponse> => 
      apiClient.patch(`/users/${id}/role`, data),
    
    toggleStatus: (id: string): Promise<UserResponse> => 
      apiClient.patch(`/users/${id}/toggle-status`, {}),
    
    delete: (id: string): Promise<ApiResponse<{ message: string }>> => 
      apiClient.delete(`/users/${id}`),
    
    getAllPermissions: (): Promise<PermissionsResponse> => 
      apiClient.get("/users/permissions"),
  };
}
