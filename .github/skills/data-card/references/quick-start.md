# DataCard Quick Start

Minimal new card-grid page in 3 steps.

## 1. Reuse the resource's form / mutations / fetcher

Same `formConfig`, `defaultValues`, `useCreate*`, `useUpdate*`, `useDelete*`, `service.getAll` you'd use for a `DataTable`.

## 2. Card config (fields + image)

```ts
// components/brands/card-config.ts
import type { CardFieldConfig, CardImageConfig } from "@/types/DataCard";
import type { Brand } from "@/types";

export const brandCardFields: CardFieldConfig<Brand>[] = [
  { key: "name", isTitle: true },
  { key: "description", isSubtitle: true },
  { key: "status", isBadge: true, badgeVariant: (v) => v === "active" ? "default" : "secondary" },
  { key: "productCount", label: "Products" },
  { key: "createdAt", label: "Created", inFooter: true, render: (v) => new Date(v).toLocaleDateString() },
];

export const brandCardImage: CardImageConfig<Brand> = {
  src: (row) => row.logo_url || row.images?.[0]?.thumbnail?.url || "",
  alt: "name",
  aspectRatio: "video",
  fallback: (row) => row.name?.charAt(0)?.toUpperCase(),
};
```

## 3. Page

```tsx
// app/(protected)/brands/page.tsx
"use client";
import { DataCard } from "@/ui/components/dataCard";
import { brandCardFields, brandCardImage } from "@/components/brands/card-config";
import { brandFormConfig, brandDefaultValues } from "@/components/brands/form-config";
import { brandFilterConfig } from "@/components/brands/filters";
import { brandService, useCreateBrand, useUpdateBrand, useDeleteBrand, useBulkDeleteBrands } from "@/services/api/modules/brands";
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
    <DataCard
      cardTitle={(n) => `All Brands (${n})`}
      variant="default"
      layoutConfig={{ layout: "grid", columns: { default: 1, sm: 2, lg: 3, xl: 4 }, gap: "md" }}
      fields={brandCardFields}
      imageConfig={brandCardImage}
      filterConfig={brandFilterConfig}
      searchConfig={{ globalSearch: true, placeholder: "Search brands..." }}
      sortingConfig={{
        sortOptions: [{ field: "name", label: "Name" }, { field: "createdAt", label: "Created" }],
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc",
      }}
      defaultPageSize={12}
      pageSizes={[6, 12, 24, 48]}
      selectable
      operations={operations}
      emptyMessage="No brands yet"
    />
  );
}
```

That's it — Add modal, Edit/Delete/View dropdown actions per card, bulk delete, search, filter drawer, pagination, layout switcher, sort dropdown, error boundary, and query invalidation are all wired automatically.
