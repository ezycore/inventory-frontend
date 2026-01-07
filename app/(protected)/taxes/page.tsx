"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Tax } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { DateCell } from "@/ui/components/dataTable/cells";
import PageHeader from "@/ui/components/header";

// Hooks & API
import { useCreateTax, useDeleteTax, useUpdateTax } from "@/hooks/queries";
import { taxesApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys-products";
import { FilterConfig } from "@/types/DataTable";

const columns: ColumnDef<Tax>[] = [
  { accessorKey: "name", header: "Tax Name" },
  { accessorKey: "rate", header: "Rate" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "status", header: "Status" },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
];

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
  ],
};

const taxFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search taxes",
      type: "text",
      placeholder: "Search taxes...",
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
};

export default function TaxesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader title="Taxes" subTitle="Manage tax rates" />

      <DataTable
        cardTitle={(n: number) => `All Taxes (${n})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={taxFilterConfig}
        columns={columns}
        selectable
        searchConfig={{
          globalSearch: true,
          placeholder: "Search taxes by name or rate...",
        }}
        enableSorting
        operations={{
          formConfig: taxFormConfig,
          defaultValues,
          getAllData: taxesApi.getAll,
          createMutation: useCreateTax(),
          updateMutation: useUpdateTax(),
          deleteMutation: useDeleteTax(),
          queryKey: [...queryKeys.taxes.all()],
          entityName: "Tax",
        }}
      />
    </div>
  );
}
