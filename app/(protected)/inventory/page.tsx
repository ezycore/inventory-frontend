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
} from "@/services/api";
import { inventoryApi, productsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
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
      const isLowStock = row.original.isLowStock;
      return (
        <span className={isLowStock ? "text-red-600 font-semibold" : ""}>
          {quantity}
        </span>
      );
    },
  },
  {
    accessorKey: "quantityAlert",
    header: "Alert Level",
  },
  {
    accessorKey: "isLowStock",
    header: "Stock Status",
    cell: ({ row }) => {
      const isLowStock = row.getValue("isLowStock");
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

// Form configuration with dependent select
const inventoryFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "productId",
      type: "select",
      label: "Product",
      placeholder: "Select product",
      creatable: true,
          quickAddModule: "brand",
      required: true,
      columnSpan: 6,
      optionsApi: "/products",
      validation: { minLength: 1 },
    },
    {
      name: "variantId",
      type: "select",
      label: "Variant",
      placeholder: "Select variant (if applicable)",
      columnSpan: 6,
      optionsApi: "/products/{{productId}}/variants",
      dependsOn: {
        field: "productId",
        condition: "truthy",
        action: "disable",
      },
      helperText: "Select a product first to see variants",
    },
    {
      name: "quantity",
      type: "number",
      label: "Quantity",
      placeholder: "Enter quantity",
      columnSpan: 6,
      validation: { min: 0 },
    },
    {
      name: "quantityAlert",
      type: "number",
      label: "Alert Level",
      placeholder: "Enter alert level",
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
      name: "productId",
      label: "Product",
      type: "select",
      placeholder: "All products",
      columnSpan: 1,
      options: [], // Will be populated dynamically via API
    },
    {
      name: "locationId",
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
  productId: "",
  variantId: "",
  locationId: "",
  quantity: 0,
  quantityAlert: 0,
  status: "active" as const,
};

const prepareSubmitData = (
  data: Inventory,
  isEdit: boolean,
  item: Inventory
) => {
  const submitData: any = {
    productId: data.productId,
    locationId: data.locationId,
    quantity: Number(data.quantity),
    quantityAlert: Number(data.quantityAlert),
    status: data.status,
  };

  // Only include variantId if it has a value
  if (data.variantId && data.variantId !== "") {
    submitData.variantId = data.variantId;
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
          row.isLowStock ? "bg-red-50 opacity-90" : ""
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
              productId: item.productId || "",
              variantId: item.variantId || "",
              locationId: item.locationId || "",
            };
          },
          prepareSubmitData: (data: Inventory, isEdit: boolean, item: Inventory) =>
            prepareSubmitData(data, isEdit, item),
        }}
      />
    </div>
  );
}
