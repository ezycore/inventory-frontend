import { brandFormConfig } from "@/components/brands/form-config";
import { categoryFormConfig } from "@/components/categories/form-config";
import { customerFormConfig } from "@/components/customers/form-config";
import { supplierFormConfig } from "@/components/suppliers/form-config";
import { useCreateBrand, useCreateCategory, useCreateCustomer, useCreateSupplier } from "@/services/api";
import type { DynamicFormConfig } from "@/ui/components/form/type";

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
 * - optionsApiPath: API path to invalidate after creation
 */

export interface QuickAddModuleConfig {
  formConfig: DynamicFormConfig;
  useMutation: () => any;
  title: string;
  submitLabel: string;
  optionsApiPath: string;
}

export const quickAddConfig: Record<string, QuickAddModuleConfig> = {
  category: {
    formConfig: categoryFormConfig,
    useMutation: useCreateCategory,
    title: "Add New Category",
    submitLabel: "Create Category",
    optionsApiPath: "/categories?all=true&fields=_id,name",
  },
  brand: {
    formConfig: brandFormConfig,
    useMutation: useCreateBrand,
    title: "Add New Brand",
    submitLabel: "Create Brand",
    optionsApiPath: "/brands?all=true&fields=_id,name",
  },
  customer: {
    formConfig: customerFormConfig,
    useMutation: useCreateCustomer,
    title: "Add New Customer",
    submitLabel: "Create Customer",
    optionsApiPath: "/sales/customers?all=true&fields=_id,name,defaultDiscountId",
  },
  supplier: {
    formConfig: supplierFormConfig,
    useMutation: useCreateSupplier,
    title: "Add New Supplier",
    submitLabel: "Create Supplier",
    optionsApiPath: "/suppliers",
  },
  // Add more modules as needed:
  // brand: { ... },
  // unit: { ... },
  // tax: { ... },
};
