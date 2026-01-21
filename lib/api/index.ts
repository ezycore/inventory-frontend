/**
 * API Module Index
 * Central export point for all API modules
 */

import { apiClient } from "../api-client";
import { createProductsApi } from "./products";
import { createVariantsApi } from "./variants";
import { createCategoriesApi } from "./categories";
import { createBrandsApi } from "./brands";
import { createLocationsApi } from "./locations";
import { createUnitsApi } from "./units";
import { createTaxesApi } from "./taxes";
import { createDiscountsApi } from "./discounts";
import { createInventoryApi } from "./inventory";
import { createStockApi, createStockMovementsApi, createLegacyInventoryApi } from "./stock";
import { createCustomersApi } from "./customers";
import { createSuppliersApi } from "./suppliers";
import { createUsersApi } from "./users";
import { createAuthApi } from "./auth";
import { createSetupApi } from "./setup";
import { createProfileApi } from "./profile";
import { createDashboardApi } from "./dashboard";
import { createOrganizationApi } from "@/lib/api/organization";
import { createAccountsApi } from "./accounts";
import { createTransactionsApi } from "./transactions";

// Export core client
export { apiClient, type ApiError } from "../api-client";

// Create API instances
export const productsApi = createProductsApi(apiClient);
export const variantsApi = createVariantsApi(apiClient); // Handles both variant instances & attribute templates
export const variantApi = variantsApi; // Alias for compatibility
export const variantAttributesApi = variantsApi; // Alias for attribute templates (same API)
export const categoriesApi = createCategoriesApi(apiClient);
export const brandsApi = createBrandsApi(apiClient);
export const locationsApi = createLocationsApi(apiClient);
export const unitsApi = createUnitsApi(apiClient);
export const taxesApi = createTaxesApi(apiClient);
export const discountsApi = createDiscountsApi(apiClient);
export const inventoryApi = createInventoryApi(apiClient);
export const stockApi = createStockApi(apiClient);
export const stockMovementsApi = createStockMovementsApi(apiClient);
export const customersApi = createCustomersApi(apiClient);
export const suppliersApi = createSuppliersApi(apiClient);
export const usersApi = createUsersApi(apiClient);
export const profileApi = createProfileApi(apiClient);
export const dashboardApi = createDashboardApi(apiClient);
export const organizationApi = createOrganizationApi(apiClient);
export const authApi = createAuthApi(apiClient);
export const setupApi = createSetupApi(apiClient);
export const accountsApi = createAccountsApi(apiClient);
export const transactionsApi = createTransactionsApi(apiClient);

// Legacy API for backward compatibility
export const legacyInventoryApi = createLegacyInventoryApi(apiClient, productsApi, stockApi);

// Re-export utility functions
export { buildQueryParams, type BaseFilters } from "./utils";
