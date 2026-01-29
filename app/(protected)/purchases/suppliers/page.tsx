"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Supplier } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTable } from "@/ui/components/dataTable";

// Hooks & API
import {
  useCreateSupplier,
  useDeleteSupplier,
  useUpdateSupplier,
} from "@/hooks/queries";
import { suppliersApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import PageHeader from "@/ui/components/header";
import { FilterConfig } from "@/types/DataTable";

// Column definitions
const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "name",
    header: "Supplier Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "address",
    header: "Address",
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
const supplierFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Supplier Name",
      placeholder: "Enter supplier name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "email",
      type: "input",
      label: "Email",
      placeholder: "Enter email address",
      columnSpan: 6,
    },
    {
      name: "phone",
      type: "input",
      label: "Phone",
      placeholder: "Enter phone number",
      columnSpan: 6,
    },
    {
      name: "address",
      type: "textarea",
      label: "Address",
      placeholder: "Enter address",
      columnSpan: 12,
    },
    {
      name: "defaultDiscountId",
      type: "select",
      label: "Default Discount",
      placeholder: "Select a default discount (optional)",
      columnSpan: 6,
      optionsApi: "/discounts/purchase?all=true&status=active",
      description: "Applied automatically to purchases from this supplier",
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 6,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

// Filter configuration for suppliers
const supplierFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search supplier",
      type: "text",
      placeholder: "Search by supplier name...",
    },
    {
      name: "email",
      label: "Email",
      type: "text",
      placeholder: "Search by email...",
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
  placeholder: "Search suppliers by name, email, phone, or status...",
};

const defaultValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  defaultDiscountId: "",
  status: "active" as const,
}

export default function SuppliersPage() {

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Suppliers" subTitle="Manage your suppliers (purchases)" />

      <DataTable
        cardTitle={(dataLength: number) => `All Suppliers (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={supplierFilterConfig}
        columns={columns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ email: false, phone: false }}
        enableRowHover={true}
        rowClassName={(row: Supplier) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        operations={{
          formConfig: supplierFormConfig,
          defaultValues: defaultValues,
          getAllData: suppliersApi.getAll,
          createMutation: useCreateSupplier(),
          updateMutation: useUpdateSupplier(),
          deleteMutation: useDeleteSupplier(),
          queryKey: [...queryKeys.suppliers.all()],
          entityName: "Supplier",
          isViewAvailable: true,
          editTooltip: "Edit Supplier",
          deleteTooltip: "Delete Supplier",
          viewTooltip: "View Supplier Details",
          prepareSubmitData: (data: Supplier, isEdit: boolean, item: Supplier) => ({
            ...data,
            ...(isEdit && item ? { id: item._id } : {}),
          }),
        }}
      />
    </div>
  );
}
