"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Location as LocationType } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTable } from "@/ui/components/dataTable";

// Hooks & API
import {
  useCreateLocation,
  useDeleteLocation,
  useUpdateLocation,
  useLocations,
} from "@/hooks/queries";
import { locationsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import PageHeader from "@/ui/components/header";
import { FilterConfig } from "@/types/DataTable";

// Column definitions
const columns: ColumnDef<LocationType>[] = [
  {
    accessorKey: "name",
    header: "Location Name",
  },
  {
    accessorKey: "address",
    header: "Address",
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
    accessorKey: "location_type",
    header: "Type",
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
const locationFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Location Name",
      placeholder: "Enter location name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "address",
      type: "input",
      label: "Address",
      placeholder: "Enter address",
      required: true,
      columnSpan: 12,
    },
    {
      name: "location_type",
      type: "select",
      label: "Location Type",
      required: true,
      columnSpan: 12,
      options: [
        { value: "store", label: "Store" },
        { value: "warehouse", label: "Warehouse" },
      ],
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

// Filter configuration
const locationFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search location",
      type: "text",
      placeholder: "Search by name...",
    },
    {
      name: "address",
      label: "Address",
      type: "text",
      placeholder: "Search by address...",
    },
    {
      name: "location_type",
      label: "Type",
      type: "select",
      placeholder: "All types",
      columnSpan: 2,
      options: [
        { label: "Store", value: "store" },
        { label: "Warehouse", value: "warehouse" },
      ],
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
      name: "created_at",
      label: "Created Date",
      type: "date-range",
      placeholder: "Select date range",
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
  placeholder: "Search locations by name, address, manager, or status...",
};

const defaultValues = {
  name: "",
  address: "",
  location_type: 'store' as const,
  manager: "",
  contact_number: "",
  email: "",
  status: "active" as const,
}

export default function LocationsPage() {

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Locations Management" subTitle="Manage your stores and warehouses in one place." />

      <DataTable
        cardTitle={(dataLength: number) => `All Locations (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={locationFilterConfig}
        columns={columns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false, contact_number: false }}
        enableRowHover={true}
        rowClassName={(row: LocationType) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        operations={{
          formConfig: locationFormConfig,
          defaultValues: defaultValues,
          getAllData: locationsApi.getAll,
          createMutation: useCreateLocation(),
          updateMutation: useUpdateLocation(),
          deleteMutation: useDeleteLocation(),
          queryKey: [...queryKeys.locations.all()],
          entityName: "Location",
          isViewAvailable: true,
          editTooltip: "Edit Location",
          deleteTooltip: "Delete Location",
          viewTooltip: "View Location Details",
          prepareSubmitData: (data: LocationType, isEdit: boolean, item: LocationType) => ({
            ...data,
            ...(isEdit && item ? { id: item._id } : {}),
          }),
        }}
      />
    </div>
  );
}
