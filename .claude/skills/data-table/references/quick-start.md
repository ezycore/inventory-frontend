# DataTable Quick Start

Minimal new resource list page in 4 steps.

## 1. Columns

```tsx
// components/brands/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { AvatarCell } from "@/ui/components/dataTable/cells/avatar-cell";
import { DateCell } from "@/ui/components/dataTable/cells";
import { Badge } from "@/ui/components/badge";
import type { Brand } from "@/types";

export const brandColumns: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <AvatarCell
        imageUrl={row.original.logo_url}
        name={row.getValue("name")}
        isActive={row.original.status === "active"}
      />
    ),
  },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>
        {row.getValue("status")}
      </Badge>
    ),
  },
  { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <DateCell value={row.getValue("createdAt")} /> },
];
```

## 2. Form config (DynamicForm)

```ts
// components/brands/form-config.ts
import type { DynamicFormConfig } from "@/ui/components/form/type";

export const brandFormConfig: DynamicFormConfig = {
  fields: [
    { name: "name", type: "input", label: "Name", required: true },
    { name: "description", type: "textarea", label: "Description" },
    { name: "logo", type: "file-upload", label: "Logo", accept: "image/*", maxFiles: 1 },
    { name: "status", type: "select", label: "Status", required: true, options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]},
  ],
};

export const brandDefaultValues = { name: "", description: "", status: "active" };
```

## 3. Filter config

```ts
// components/brands/filters.ts
import type { FilterConfig } from "@/types/DataTable";

export const brandFilterConfig: FilterConfig = {
  fields: [
    { name: "status", label: "Status", type: "select", options: [
      { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" },
    ]},
    { name: "createdAt", label: "Created Date", type: "date-range" },
  ],
  viewMode: "popover",
  columns: 2,
};
```

## 4. Page

```tsx
// app/(protected)/brands/page.tsx
"use client";
import { DataTable } from "@/ui/components/dataTable";
import { brandColumns } from "@/components/brands/columns";
import { brandFormConfig, brandDefaultValues } from "@/components/brands/form-config";
import { brandFilterConfig } from "@/components/brands/filters";
import { useCreateBrand, useUpdateBrand, useDeleteBrand, useBulkDeleteBrands, brandService } from "@/services/api/modules/brands";
import { queryKeys } from "@/services/api/query-keys";
import { useMemo } from "react";

export default function BrandsPage() {
  const operations = useMemo(() => ({
    getAllData: brandService.getAll,
    queryKey: queryKeys.brands.all(),
    formConfig: brandFormConfig,
    defaultValues: brandDefaultValues,
    createMutation: useCreateBrand(),
    updateMutation: useUpdateBrand(),
    deleteMutation: useDeleteBrand(),
    bulkDeleteMutation: useBulkDeleteBrands(),
    entityName: "Brand",
    isViewAvailable: true,
  }), []);

  return (
    <DataTable
      cardTitle={(n) => `All Brands (${n})`}
      columns={brandColumns}
      filterConfig={brandFilterConfig}
      searchConfig={{ globalSearch: true, placeholder: "Search brands..." }}
      sortingConfig={{
        sortOptions: [{ field: "name", label: "Name" }, { field: "createdAt", label: "Created" }],
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc",
      }}
      defaultPageSize={10}
      pageSizes={[10, 20, 50, 100]}
      selectable
      enableSorting
      operations={operations}
    />
  );
}
```

That's it — Add modal, Edit/View/Delete cell icons, bulk delete, search, filter drawer, pagination, sort dropdown, error boundary, and query invalidation are all wired automatically.
