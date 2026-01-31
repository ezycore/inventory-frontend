"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Location as LocationType } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { UserCountCell } from "@/components/locations/UserCountCell";
import { DataTable } from "@/ui/components/dataTable";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";

// Hooks & API
import {
  useCreateLocation,
  useDeleteLocation,
  useUpdateLocation,
} from "@/services/api/queries";
import { locationsApi } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { FilterConfig } from "@/types/DataTable";
import PageHeader from "@/ui/components/header";

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
    accessorKey: "locationType",
    header: "Type",
  },
  {
    accessorKey: "users",
    header: "Users",
    cell: ({ row }) => <UserCountCell users={row.original.users} />,
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
      name: "locationType",
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
      name: "userIds",
      type: "select",
      label: "Assign Users",
      optionsApi: "/users",
      mode: "multiple",
      columnSpan: 12,
      required: false,
      description:
        "Select users to assign to this location (admins have access to all locations automatically)",
      itemsCreateCallback: (response) => {
        const items = response?.data?.items || [];
        return items
          .filter((item: { role?: string }) => item.role !== "admin") // Filter out admins
          .map(
            (item: {
              _id?: string;
              fullName?: string;
              email?: string;
              role?: string;
            }) => ({
              value: item._id,
              label: `${item.fullName} <${item.email}> - ${item.role}`,
            }),
          );
      },
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
  ],
  viewMode: "popover",
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
  locationType: "store" as const,
  status: "active" as const,
};

export default function LocationsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Locations Management"
        subTitle="Manage your stores and warehouses in one place."
      />

      <DataTable
        cardTitle={(dataLength: number) => `All Locations (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={locationFilterConfig}
        columns={columns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false }}
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
          prepareSubmitData: (
            data: LocationType,
            isEdit: boolean,
            item: LocationType,
          ) => ({
            ...data,
            ...(isEdit && item ? { id: item._id } : {}),
          }),
        }}
      />
    </div>
  );
}
