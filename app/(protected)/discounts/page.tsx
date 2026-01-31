"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Discount } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { DateCell } from "@/ui/components/dataTable/cells";
import PageHeader from "@/ui/components/header";

// Hooks & API
import { useCreateDiscount, useDeleteDiscount, useUpdateDiscount } from "@/services/api/queries";
import { discountsApi } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { FilterConfig } from "@/types/DataTable";

const columns: ColumnDef<Discount>[] = [
  { accessorKey: "name", header: "Discount Name" },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const value = row.getValue("value") as number;
      return type === "percentage" ? `${value}%` : `₹${value}`;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return type === "percentage" ? "Percentage" : "Fixed";
    },
  },
  {
    accessorKey: "applicableTo",
    header: "Applicable To",
    cell: ({ row }) => {
      const applicable = row.getValue("applicableTo") as string;
      const labels: Record<string, string> = {
        sales: "Sales",
        purchase: "Purchase",
        both: "Both",
      };
      return labels[applicable] || applicable;
    },
  },
  { accessorKey: "status", header: "Status" },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
];

const discountFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Discount Name",
      placeholder: "Enter discount name",
      required: true,
      columnSpan: 12,
    },
    {
      name: "value",
      type: "number",
      label: "Discount Value",
      placeholder: "Enter discount value",
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
        { value: "fixed", label: "Fixed Amount" },
      ],
    },
    {
      name: "applicableTo",
      type: "select",
      label: "Applicable To",
      required: true,
      columnSpan: 6,
      options: [
        { value: "both", label: "Both (Sales & Purchase)" },
        { value: "sales", label: "Sales Only" },
        { value: "purchase", label: "Purchase Only" },
      ],
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
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "Optional description for this discount",
      columnSpan: 12,
    },
  ],
};

const discountFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search discounts",
      type: "text",
      placeholder: "Search discounts...",
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      placeholder: "All types",
      options: [
        { label: "Percentage", value: "percentage" },
        { label: "Fixed", value: "fixed" },
      ],
    },
    {
      name: "applicableTo",
      label: "Applicable To",
      type: "select",
      placeholder: "All",
      options: [
        { label: "Sales", value: "sales" },
        { label: "Purchase", value: "purchase" },
        { label: "Both", value: "both" },
      ],
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
  value: 0,
  type: "percentage" as const,
  applicableTo: "both" as const,
  status: "active" as const,
  description: "",
};

export default function DiscountsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Discounts"
        subTitle="Manage discount rates for sales and purchases"
      />

      <DataTable
        cardTitle={(n: number) => `All Discounts (${n})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={discountFilterConfig}
        columns={columns}
        selectable
        searchConfig={{
          globalSearch: true,
          placeholder: "Search discounts by name...",
        }}
        enableSorting
        operations={{
          formConfig: discountFormConfig,
          defaultValues,
          getAllData: discountsApi.getAll,
          createMutation: useCreateDiscount(),
          updateMutation: useUpdateDiscount(),
          deleteMutation: useDeleteDiscount(),
          queryKey: [...queryKeys.discounts.all()],
          entityName: "Discount",
        }}
      />
    </div>
  );
}
