import { brandFormConfig } from "@/components/brands/form-config";
import { categoryFormConfig } from "@/components/categories/form-config";
import { customerFormConfig } from "@/components/customers/form-config";
import { discountFormConfig } from "@/components/discounts/form-config";
import { supplierFormConfig } from "@/components/suppliers/form-config";
import { tagFormConfig } from "@/components/tags/form-config";
import {
  useCreateBrand,
  useCreateCategory,
  useCreateCustomer,
  useCreateDiscount,
  useCreateSupplier,
  useCreateTag,
} from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { QueryKey } from "@tanstack/react-query";

/**
 * Quick-Add Module Configuration
 *
 * Centralized configuration for quick-add modals in select fields.
 * When a select field has `creatable: true`, it will use this config
 * to render an inline modal for creating new options.
 *
 * Each module defines:
 * - formConfig: The form fields to show in the modal
 * - useMutation: The mutation hook to create the entity
 * - title: Modal title
 * - queryRoot: the resource root to invalidate after creation, so the dropdown that
 *   opened the modal picks the new row up. It is a registry root, not a URL: the
 *   dropdown's own key is `[<root>, "options", <url>]`, so one root covers every
 *   projection of it (see `services/api/modules/use-select-options.ts`).
 */

export interface QuickAddModuleConfig {
  formConfig: DynamicFormConfig;
  useMutation: () => any;
  title: string;
  submitLabel: string;
  queryRoot: () => QueryKey;
}

export const quickAddConfig: Record<string, QuickAddModuleConfig> = {
  category: {
    formConfig: categoryFormConfig,
    useMutation: useCreateCategory,
    title: "Add New Category",
    submitLabel: "Create Category",
    queryRoot: queryKeys.categories.all,
  },
  brand: {
    formConfig: brandFormConfig,
    useMutation: useCreateBrand,
    title: "Add New Brand",
    submitLabel: "Create Brand",
    queryRoot: queryKeys.brands.all,
  },
  tag: {
    formConfig: tagFormConfig,
    useMutation: useCreateTag,
    title: "Add New Tag",
    submitLabel: "Create Tag",
    queryRoot: queryKeys.tags.all,
  },
  customer: {
    formConfig: customerFormConfig,
    useMutation: useCreateCustomer,
    title: "Add New Customer",
    submitLabel: "Create Customer",
    queryRoot: queryKeys.customers.all,
  },
  supplier: {
    formConfig: supplierFormConfig,
    useMutation: useCreateSupplier,
    title: "Add New Supplier",
    submitLabel: "Create Supplier",
    queryRoot: queryKeys.suppliers.all,
  },
  discount: {
    formConfig: discountFormConfig,
    useMutation: useCreateDiscount,
    title: "Add New Discount",
    submitLabel: "Create Discount",
    queryRoot: queryKeys.discounts.all,
  }
  // Add more modules as needed:
  // brand: { ... },
  // unit: { ... },
  // tax: { ... },
};
