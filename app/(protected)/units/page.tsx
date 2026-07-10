"use client";
// coding-standard: maintained

// Types
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DataCard } from "@/ui/components/dataCard";
import PageHeader from "@/ui/components/header";
import UnitCardView from "@/components/units/cardview";
import UnitCardLoading from "@/components/units/card-loading";

// Hooks & API
import { useCreateUnit, useDeleteUnit, useUpdateUnit } from "@/services/api";
import { unitsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { FilterConfig } from "@/types/DataTable";

// ── Form config ─────────────────────────────────────────────────────────
const unitFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Unit Name",
      placeholder: "Enter unit name",
      required: true,
      columnSpan: 12,
    },
    {
      name: "shortName",
      type: "input",
      label: "Short Name",
      placeholder: "e.g. pcs, kg",
      columnSpan: 12,
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
      label: "Set as default unit",
      description: "Pre-selected on new product forms",
      columnSpan: 12,
      defaultValue: false,
    },
  ],
};

// ── Filter config ───────────────────────────────────────────────────────
const unitFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search units",
      type: "text",
      placeholder: "Search units...",
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
  shortName: "",
  status: "active" as const,
  isDefault: false,
};

const searchConfig = {
  globalSearch: true,
  placeholder: "Search units by name or short name...",
};

export default function UnitsPage() {
  const sharedOperations = {
    formConfig: unitFormConfig,
    defaultValues,
    getAllData: unitsApi.getAll,
    createMutation: useCreateUnit(),
    updateMutation: useUpdateUnit(),
    deleteMutation: useDeleteUnit(),
    queryKey: [...queryKeys.units.all()],
    entityName: "Unit" as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Units"
        subTitle="Measurement units used across your products and inventory."
      />

      {/* Card View */}
      <DataCard
        cardTitle={(n) => `All Units (${n})`}
        defaultPageSize={12}
        pageSizes={[12, 24, 48]}
        layoutConfig={{
          layout: "grid",
          columns: { default: 1, sm: 2, lg: 3 },
          gap: "md",
        }}
        filterConfig={unitFilterConfig}
        searchConfig={searchConfig}
        renderCard={UnitCardView}
        loadingRenderCard={UnitCardLoading}
        operations={sharedOperations}
      />
    </div>
  );
}
