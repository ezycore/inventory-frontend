// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { LegacyOrder, MigrationRun } from "@/types/api";

/**
 * Moving a store in from WooCommerce (backend `docs/plan/data-migration.md`).
 * Verb endpoints rather than CRUD: a migration is started, watched, approved
 * and stopped — never edited.
 */
export interface StartWooMigrationInput {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  autoCreate: boolean;
  mirrorImages: boolean;
  importOrders: boolean;
}

export const migrationsApi = {
  list: (): Promise<ApiResponse<MigrationRun[]>> => apiClient.get("/migrations"),

  get: (id: string): Promise<ApiResponse<MigrationRun>> => apiClient.get(`/migrations/${id}`),

  /** Checks the store and the key first; a bad one is answered here, not in the background. */
  startWooCommerce: (input: StartWooMigrationInput): Promise<ApiResponse<MigrationRun>> =>
    apiClient.post("/migrations/woocommerce", input),

  /** The merchant approved the preview. */
  commit: (id: string): Promise<ApiResponse<MigrationRun>> =>
    apiClient.post(`/migrations/${id}/commit`, {}),

  cancel: (id: string): Promise<ApiResponse<MigrationRun>> =>
    apiClient.post(`/migrations/${id}/cancel`, {}),

  /** A customer's orders from the old store — read-only history. */
  legacyOrders: (customerId: string): Promise<ApiResponse<LegacyOrder[]>> =>
    apiClient.get(`/migrations/customers/${customerId}/orders`),
};
