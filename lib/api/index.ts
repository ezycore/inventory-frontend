/**
 * API Module Index
 * Central export point for all API modules
 */

import { createOrganizationApi } from "@/lib/api/organization";
import { apiClient } from "../api-client";
import { createAccountsApi } from "./accounts";
import { createAuthApi } from "./auth";
import { createBrandsApi } from "./brands";
import { createCategoriesApi } from "./categories";
import { createCustomersApi } from "./customers";
import { createDashboardApi } from "./dashboard";
import { createDiscountsApi } from "./discounts";
import { createInventoryApi } from "./inventory";
import { createLocationsApi } from "./locations";
import { createProductsApi } from "./products";
import { createProfileApi } from "./profile";
import { createPurchaseOrdersApi } from "./purchase-orders";
import { createSalesOrdersApi } from "./sales-orders";
import { createStockApi, createStockMovementsApi } from "./stock";
import { createSuppliersApi } from "./suppliers";
import { createTaxesApi } from "./taxes";
import { createTransactionsApi } from "./transactions";
import { createUnitsApi } from "./units";
import { createUsersApi } from "./users";
import { createVariantsApi } from "./variants";

// Export core client
export { apiClient, type ApiError } from "../api-client";

// Create API instances
export const productsApi = createProductsApi(apiClient);
export const variantsApi = createVariantsApi(apiClient); // Handles both variant instances & attribute templates
export const variantApi = variantsApi; // Alias for compatibility
export const variantAttributesApi = variantsApi; // Alias for attribute templates (same API)
export const categoriesApi = createCategoriesApi(apiClient);
export const brandsApi = createBrandsApi(apiClient);
export const unitsApi = createUnitsApi(apiClient);
export const taxesApi = createTaxesApi(apiClient);
export const discountsApi = createDiscountsApi(apiClient);
export const inventoryApi = createInventoryApi(apiClient);
export const stockApi = createStockApi(apiClient);
export const stockMovementsApi = createStockMovementsApi(apiClient);
export const customersApi = createCustomersApi(apiClient);
export const suppliersApi = createSuppliersApi(apiClient);
export const dashboardApi = createDashboardApi(apiClient);
export const accountsApi = createAccountsApi(apiClient);
export const transactionsApi = createTransactionsApi(apiClient);
export const purchaseOrdersApi = createPurchaseOrdersApi(apiClient);
export const salesOrdersApi = createSalesOrdersApi(apiClient);
export const profileApi = createProfileApi(apiClient);
export const authApi = createAuthApi(apiClient);
export const organizationApi = createOrganizationApi(apiClient);
export const locationsApi = createLocationsApi(apiClient);
export const usersApi = createUsersApi(apiClient);

// Re-export utility functions
export { buildQueryParams, type BaseFilters } from "./utils";
