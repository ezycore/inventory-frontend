import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { OrganizationRole } from "@/types/users";

export const rolesApi = {
  getAll: (): Promise<ApiResponse<OrganizationRole[]>> => apiClient.get("/roles"),
};
