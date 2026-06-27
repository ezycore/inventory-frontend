"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/services/stores";

// Types
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DataCard } from "@/ui/components/dataCard";
import PageHeader from "@/ui/components/header";
import TaxCardView from "@/components/taxes/cardview";
import TaxCardLoading from "@/components/taxes/card-loading";

// Hooks & API
import { useCreateTax, useDeleteTax, useUpdateTax } from "@/services/api";
import { taxesApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { FilterConfig } from "@/types/DataTable";

// ── Form config ─────────────────────────────────────────────────────────
const taxFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Tax Name",
      placeholder: "Enter tax name",
      required: true,
      columnSpan: 12,
    },
    {
      name: "rate",
      type: "number",
      label: "Rate",
      placeholder: "Enter tax rate",
      required: true,
      columnSpan: 6,
    },
    {
      name: "type",
      type: "select",
      label: "Type",
      required: true,
      columnSpan: 6,
      options: [
        { value: "percentage", label: "Percentage" },
        { value: "fixed", label: "Fixed" },
      ],
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 12,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      name: "isDefault",
      type: "checkbox",
      label: "Set as default tax",
      description: "Pre-selected on new product forms",
      columnSpan: 12,
      defaultValue: false,
    },
  ],
};

// ── Filter config ───────────────────────────────────────────────────────
const taxFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search taxes",
      type: "text",
      placeholder: "Search taxes...",
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      placeholder: "All types",
      options: [
        { label: "Percentage", value: "percentage" },
        { label: "Fixed", value: "fixed" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ],
  viewMode: "popover",
};

const defaultValues = {
  name: "",
  rate: 0,
  type: "percentage" as const,
  status: "active" as const,
  isDefault: false,
};

const searchConfig = {
  globalSearch: true,
  placeholder: "Search taxes by name or rate...",
};

export default function TaxesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isTaxEnabled = user?.organization?.features?.tax ?? false;

  // Tax management is feature-gated. Direct URL hits redirect home when off
  // (the nav entry is already hidden and the API returns 403).
  useEffect(() => {
    if (user && !isTaxEnabled) {
      router.replace("/");
    }
  }, [user, isTaxEnabled, router]);

  const sharedOperations = {
    formConfig: taxFormConfig,
    defaultValues,
    getAllData: taxesApi.getAll,
    createMutation: useCreateTax(),
    updateMutation: useUpdateTax(),
    deleteMutation: useDeleteTax(),
    queryKey: [...queryKeys.taxes.all()],
    entityName: "Tax" as const,
  };

  if (!isTaxEnabled) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Tax Management"
        subTitle="Configure and manage tax rates applied to your transactions"
      />

      {/* Card View */}
      <DataCard
        cardTitle={(n) => `All Taxes (${n})`}
        defaultPageSize={12}
        pageSizes={[12, 24, 48]}
        layoutConfig={{
          layout: "grid",
          columns: { default: 1, sm: 2, lg: 3 },
          gap: "md",
        }}
        filterConfig={taxFilterConfig}
        searchConfig={searchConfig}
        renderCard={TaxCardView}
        loadingRenderCard={TaxCardLoading}
        operations={sharedOperations}
      />
    </div>
  );
}
