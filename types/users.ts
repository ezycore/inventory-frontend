import { Location } from "@/types";

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
  | "locations.all"
  | "reports.view"
  | "organization.edit"
  | "organization.manage"
  | "users.view"
  | "users.manage";

export type Role = string;

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  avatar?: string;
  role: Role;
  permissions: string[];
  /** Assigned location IDs; roles with locations.all can access all locations. */
  locationIds?: string[];
  /** User's default/active location ID */
  locations: Location[];
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

/**
 * `system` — the 5 built-ins, defined in backend code and immutable.
 * `mc` — pushed by Mission Control; the platform owns them.
 * `custom` — authored in this workspace; the only kind editable here.
 */
export interface OrganizationRole {
  slug: string;
  name: string;
  description?: string;
  source: "system" | "mc" | "custom";
  locked: boolean;
  permissions: string[];
  assignable: boolean;
}
