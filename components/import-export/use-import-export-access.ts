// coding-standard: maintained
import { useMemo } from "react";
import { areAllFeaturesEnabled, isFeatureEnabled } from "@/lib/feature-utils";
import { customersApi, inventoryApi, productsApi, suppliersApi } from "@/services/api";
import type { DomainEvent } from "@/services/api/invalidation";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { FeatureName } from "@/types";
import type { DataTableImportConfig } from "@/types/DataTable";

/**
 * Who may use which card of the Import & Export center (backend
 * `docs/plan/import-export-center.md`). Each card asks exactly what its
 * endpoint asks — the same permission, and the feature the route's write gate
 * checks — so nobody is offered a button that answers 403, and a switched-off
 * part of the business is hidden rather than shown empty.
 */

export type ImportKey = "products" | "inventory" | "customers" | "suppliers";

export interface ImportResource {
  key: ImportKey;
  config: DataTableImportConfig;
  /** What a committed import dirties (`services/api/invalidation.ts`). */
  event: DomainEvent;
}

const IMPORTS: (ImportResource & { permission: string; features?: FeatureName[] })[] = [
  {
    key: "products",
    permission: "products.import",
    event: "products.imported",
    config: {
      downloadTemplate: productsApi.downloadImportTemplate,
      preview: productsApi.importPreview,
      commit: productsApi.importCommit,
      // Create missing categories/brands/tags; copy images (on by default for a Woo file).
      options: { autoCreate: true, mirrorImages: true },
    },
  },
  {
    key: "inventory",
    permission: "stock.import",
    features: ["inventoryTracking"],
    event: "stock.imported",
    config: {
      downloadTemplate: inventoryApi.downloadImportTemplate,
      preview: inventoryApi.importPreview,
      commit: inventoryApi.importCommit,
    },
  },
  {
    key: "customers",
    permission: "customers.import",
    event: "customers.imported",
    config: {
      downloadTemplate: customersApi.downloadImportTemplate,
      preview: customersApi.importPreview,
      commit: customersApi.importCommit,
    },
  },
  {
    key: "suppliers",
    permission: "suppliers.import",
    // Supplier writes are gated on `purchases`, like the rest of buying.
    features: ["purchases"],
    event: "suppliers.imported",
    config: {
      downloadTemplate: suppliersApi.downloadImportTemplate,
      preview: suppliersApi.importPreview,
      commit: suppliersApi.importCommit,
    },
  },
];

export function useImportExportAccess() {
  const { user } = useAuthStore();

  return useMemo(() => {
    const features = user?.organization?.features;
    const can = (permission: string) => user?.permissions?.includes(permission) ?? false;
    const imports = IMPORTS.filter(
      (resource) =>
        can(resource.permission) && (!resource.features || areAllFeaturesEnabled(features, resource.features)),
    );
    const exports = {
      products: can("products.export"),
      stock: can("stock.export") && isFeatureEnabled(features, "inventoryTracking"),
      // Reports → Export Data, which moved here.
      records: can("reports.view"),
    };
    // A migration writes products AND customers, so it needs both.
    const move = can("products.import") && can("customers.import");
    // The backend's history permissions: any import, or `products.edit` for the tags sheet.
    const history = imports.length > 0 || can("products.edit");

    return {
      imports,
      exports,
      move,
      history,
      /** Absent is not empty: decide nothing until the session's permissions have arrived. */
      known: Array.isArray(user?.permissions),
      any: imports.length > 0 || Object.values(exports).some(Boolean) || move,
    };
  }, [user]);
}
