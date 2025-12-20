"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Warehouse } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTable } from "@/ui/components/dataTable";

// Hooks & API
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useUpdateWarehouse,
} from "@/hooks/queries";
import { warehousesApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import PageHeader from "@/ui/components/header";
import { FilterConfig } from "@/types/DataTable";

// Column definitions
const columns: ColumnDef<Warehouse>[] = [
  {
    accessorKey: "name",
    header: "Warehouse Name"
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "manager",
    header: "Manager",
  },
  {
    accessorKey: "contact_number",
    header: "Contact",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
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

// Form configuration
const warehouseFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Warehouse Name",
      placeholder: "Enter warehouse name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "location",
      type: "input",
      label: "Location",
      placeholder: "Enter warehouse location",
      required: true,
      columnSpan: 12,
    },
    {
      name: "manager",
      type: "input",
      label: "Manager",
      placeholder: "Enter manager name",
      required: true,
      columnSpan: 12,
    },
    {
      name: "contact_number",
      type: "input",
      label: "Contact Number",
      placeholder: "Enter contact number",
      columnSpan: 6,
    },
    {
      name: "email",
      type: "input",
      label: "Email",
      placeholder: "Enter email address",
      columnSpan: 6,
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

// Filter configuration for warehouses
const warehouseFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search warehouse",
      type: "text",
      placeholder: "Search by warehouse name...",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "Search by location...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      columnSpan: 2,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      name: "createdAt",
      label: "Created Date",
      type: "date-range",
      placeholder: "Select date range",
      columnSpan: 2,
    },
    {
      name: "updatedAt",
      label: "Updated Date",
      type: "date",
      placeholder: "Select date",
      columnSpan: 2,
    },
  ],
  viewMode: 'popover',
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};

const searchConfig = {
  globalSearch: true,
  placeholder: "Search warehouses by name, location, manager, or status...",
};

const defaultValues = {
  name: "",
  location: "",
  manager: "",
  contact_number: "",
  email: "",
  status: "active" as const,
}

export default function WarehousesPage() {

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Warehouses Management" subTitle="Manage your warehouse facilities and their operations." />

      <DataTable
        cardTitle={(dataLength: number) => `All Warehouses (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={warehouseFilterConfig}
        columns={columns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false, contact_number: false }}
        enableRowHover={true}
        rowClassName={(row: Warehouse) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        operations={{
          formConfig: warehouseFormConfig,
          defaultValues: defaultValues,
          getAllData: warehousesApi.getAll,
          createMutation: useCreateWarehouse(),
          updateMutation: useUpdateWarehouse(),
          deleteMutation: useDeleteWarehouse(),
          queryKey: [...queryKeys.warehouses.all()],
          entityName: "Warehouse",
          isViewAvailable: true,
          editTooltip: "Edit Warehouse",
          deleteTooltip: "Delete Warehouse",
          viewTooltip: "View Warehouse Details",
          prepareSubmitData: (data: Warehouse, isEdit: boolean, item: Warehouse) => ({
            ...data,
            ...(isEdit && item ? { id: item._id } : {}),
          }),
        }}
      />
    </div>
  );
}
