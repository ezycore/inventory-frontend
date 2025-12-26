"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Inventory } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTable } from "@/ui/components/dataTable";
import { Badge } from "@/ui/components/badge";

// Hooks & API
import {
  useCreateInventory,
  useDeleteInventory,
  useUpdateInventory,
} from "@/hooks/queries";
import { inventoryApi, productsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import PageHeader from "@/ui/components/header";
import { FilterConfig } from "@/types/DataTable";

// Column definitions
const columns: ColumnDef<Inventory>[] = [
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original.product;
      return product ? product.name : "-";
    },
  },
  {
    accessorKey: "variant",
    header: "Variant",
    cell: ({ row }) => {
      const variant = row.original.variant;
      if (!variant) return "-";
      
      // Display variant attributes if available
      if (variant.attributes) {
        const attrs = Object.entries(variant.attributes)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
        return attrs || "-";
      }
      return variant.sku || "-";
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const location = row.original.location;
      return location ? location.name : "-";
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number;
      const isLowStock = row.original.is_low_stock;
      return (
        <span className={isLowStock ? "text-red-600 font-semibold" : ""}>
          {quantity}
        </span>
      );
    },
  },
  {
    accessorKey: "quantity_alert",
    header: "Alert Level",
  },
  {
    accessorKey: "ideal_quantity",
    header: "Ideal Quantity",
  },
  {
    accessorKey: "is_low_stock",
    header: "Stock Status",
    cell: ({ row }) => {
      const isLowStock = row.getValue("is_low_stock");
      return isLowStock ? (
        <Badge variant="destructive">Low Stock</Badge>
      ) : (
        <Badge variant="default">Normal</Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("created_at")} />,
  },
  {
    accessorKey: "updated_at",
    header: "Updated Date",
    cell: ({ row }) => <DateCell value={row.getValue("updated_at")} />,
  },
];

// Form configuration with dependent select
const inventoryFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "product_id",
      type: "select",
      label: "Product",
      placeholder: "Select product",
      required: true,
      columnSpan: 6,
      optionsApi: "/products",
      validation: { minLength: 1 },
    },
    {
      name: "variant_id",
      type: "select",
      label: "Variant",
      placeholder: "Select variant (if applicable)",
      columnSpan: 6,
      dependsOn: "product_id",
      dependsOnTemplate: "/products/:id/variants",
      helperText: "Select a product first to see variants",
    },
    {
      name: "location_id",
      type: "select",
      label: "Location",
      placeholder: "Select location",
      required: true,
      columnSpan: 6,
      optionsApi: "/locations",
      validation: { minLength: 1 },
    },
    {
      name: "quantity",
      type: "number",
      label: "Quantity",
      placeholder: "Enter quantity",
      required: true,
      columnSpan: 6,
      validation: { min: 0 },
    },
    {
      name: "quantity_alert",
      type: "number",
      label: "Alert Level",
      placeholder: "Enter alert level",
      required: true,
      columnSpan: 6,
      validation: { min: 0 },
    },
    {
      name: "ideal_quantity",
      type: "number",
      label: "Ideal Quantity",
      placeholder: "Enter ideal quantity",
      required: true,
      columnSpan: 6,
      validation: { min: 0 },
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
const inventoryFilterConfig: FilterConfig = {
  fields: [
    {
      name: "product_id",
      label: "Product",
      type: "select",
      placeholder: "All products",
      columnSpan: 1,
      options: [], // Will be populated dynamically via API
    },
    {
      name: "location_id",
      label: "Location",
      type: "select",
      placeholder: "All locations",
      columnSpan: 1,
      options: [], // Will be populated dynamically via API
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      columnSpan: 1,
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
  placeholder: "Search inventory by product, location, or variant...",
};

const defaultValues = {
  product_id: "",
  variant_id: "",
  location_id: "",
  quantity: 0,
  quantity_alert: 0,
  ideal_quantity: 0,
  status: "active" as const,
};

const prepareSubmitData = (
  data: Inventory,
  isEdit: boolean,
  item: Inventory
) => {
  const submitData: any = {
    product_id: data.product_id,
    location_id: data.location_id,
    quantity: Number(data.quantity),
    quantity_alert: Number(data.quantity_alert),
    ideal_quantity: Number(data.ideal_quantity),
    status: data.status,
  };

  // Only include variant_id if it has a value
  if (data.variant_id && data.variant_id !== "") {
    submitData.variant_id = data.variant_id;
  }

  if (isEdit && item) {
    submitData.id = item._id;
  }

  return submitData;
};

export default function InventoryPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Inventory Management"
        subTitle="Manage your inventory levels across all locations."
      />

      <DataTable
        cardTitle={(dataLength: number) => `All Inventory (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={inventoryFilterConfig}
        columns={columns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false }}
        enableRowHover={true}
        rowClassName={(row: Inventory) =>
          row.is_low_stock ? "bg-red-50 opacity-90" : ""
        }
        operations={{
          formConfig: inventoryFormConfig,
          defaultValues: defaultValues,
          getAllData: inventoryApi.getAll,
          createMutation: useCreateInventory(),
          updateMutation: useUpdateInventory(),
          deleteMutation: useDeleteInventory(),
          queryKey: [...queryKeys.inventory.all()],
          entityName: "Inventory",
          isViewAvailable: true,
          editTooltip: "Edit Inventory",
          deleteTooltip: "Delete Inventory",
          viewTooltip: "View Inventory Details",
          transformEditData: (item: Inventory) => {
            return {
              ...item,
              product_id: item.product_id || "",
              variant_id: item.variant_id || "",
              location_id: item.location_id || "",
            };
          },
          prepareSubmitData: (data: Inventory, isEdit: boolean, item: Inventory) =>
            prepareSubmitData(data, isEdit, item),
        }}
      />
    </div>
  );
}
