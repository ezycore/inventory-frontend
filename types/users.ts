// User and Permission types
export type Permission =
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "categories.view"
  | "categories.create"
  | "categories.edit"
  | "categories.delete"
  | "brands.view"
  | "brands.create"
  | "brands.edit"
  | "brands.delete"
  | "stock.view"
  | "stock.manage"
  | "reports.view"
  | "organization.edit"
  | "users.view"
  | "users.manage";

export type Role = "admin" | "manager" | "staff" | "viewer";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  avatar?: string;
  role: Role;
  permissions: Permission[];
  /** Array of location IDs the user has access to (admin has all access) */
  locationIds?: string[];
  /** User's default/active location ID */
  defaultLocationId?: string;
  status: "active" | "inactive";
  preferences: {
    theme: "light" | "dark" | "system";
    currency: string;
    timezone: string;
    language: string;
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role?: Role;
  phone?: string;
  /** Array of location IDs to assign to the user */
  locationIds?: string[];
  /** User's default location ID */
  defaultLocationId?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: Role;
}

export interface RegisterUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role?: Role;
  phone?: string;
  /** Array of location IDs to assign to the user */
  locationIds?: string[];
  /** User's default location ID */
  defaultLocationId?: string;
}

export interface UpdateUserPermissionsDto {
  permissions: Permission[];
}

export interface UpdateUserRoleDto {
  role: Role;
}

export interface RegisterUserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    temporaryPassword?: string; // Only in development
  };
}

export interface UsersResponse {
  success: boolean;
  data: User[];
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface PermissionsResponse {
  success: boolean;
  data: Permission[];
}
