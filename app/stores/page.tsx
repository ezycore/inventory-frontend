"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Store as StoreType } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTable } from "@/ui/components/dataTable";

// Hooks & API
import {
  useCreateStore,
  useDeleteStore,
  useUpdateStore,
} from "@/hooks/queries";
import { storesApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import PageHeader from "@/ui/components/header";
import { FilterConfig } from "@/types/DataTable";

// Column definitions
const columns: ColumnDef<StoreType>[] = [
  {
    accessorKey: "name",
    header: "Store Name",
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
const storeFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Store Name",
      placeholder: "Enter store name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "location",
      type: "input",
      label: "Location",
      placeholder: "Enter store location",
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

// Filter configuration for stores
const storeFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search store",
      type: "text",
      placeholder: "Search by store name...",
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
  placeholder: "Search stores by name, location, manager, or status...",
};

const defaultValues = {
  name: "",
  location: "",
  manager: "",
  contact_number: "",
  email: "",
  status: "active" as const,
}

export default function StoresPage() {

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Stores Management" subTitle="Manage your retail store locations and their details." />

      <DataTable
        cardTitle={(dataLength: number) => `All Stores (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={storeFilterConfig}
        columns={columns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false, contact_number: false }}
        enableRowHover={true}
        rowClassName={(row: StoreType) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        operations={{
          formConfig: storeFormConfig,
          defaultValues: defaultValues,
          getAllData: storesApi.getAll,
          createMutation: useCreateStore(),
          updateMutation: useUpdateStore(),
          deleteMutation: useDeleteStore(),
          queryKey: [...queryKeys.stores.all()],
          entityName: "Store",
          isViewAvailable: true,
          editTooltip: "Edit Store",
          deleteTooltip: "Delete Store",
          viewTooltip: "View Store Details",
          prepareSubmitData: (data: StoreType, isEdit: boolean, item: StoreType) => ({
            ...data,
            ...(isEdit && item ? { id: item._id } : {}),
          }),
        }}
      />
    </div>
  );
}
