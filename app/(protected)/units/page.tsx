"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Unit } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { DateCell } from "@/ui/components/dataTable/cells";
import PageHeader from "@/ui/components/header";

// Hooks & API
import { useCreateUnit, useDeleteUnit, useUpdateUnit } from "@/hooks/queries";
import { unitsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys-products";
import { FilterConfig } from "@/types/DataTable";

const columns: ColumnDef<Unit>[] = [
  { accessorKey: "name", header: "Unit Name" },
  { accessorKey: "shortName", header: "Short Name" },
  { accessorKey: "status", header: "Status" },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated Date",
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];

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
  ],
};

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

const defaultValues = { name: "", shortName: "", status: "active" as const };

export default function UnitsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader title="Units" subTitle="Manage measurement units" />

      <DataTable
        cardTitle={(n: number) => `All Units (${n})`}
        defaultPageSize={10}
        pageSizes={[2, 10, 20, 50, 100]}
        filterConfig={unitFilterConfig}
        columns={columns}
        selectable
        searchConfig={{
          globalSearch: true,
          placeholder: "Search units by name or short name...",
        }}
        enableSorting
        operations={{
          formConfig: unitFormConfig,
          defaultValues,
          getAllData: unitsApi.getAll,
          createMutation: useCreateUnit(),
          updateMutation: useUpdateUnit(),
          deleteMutation: useDeleteUnit(),
          queryKey: [...queryKeys.units.all()],
          entityName: "Unit",
        }}
      />
    </div>
  );
}
