# Quick Start

## 1. Define config (outside component / module-level)

```ts
// components/brands/form-config.ts
import type { DynamicFormConfig } from "@/ui/components/form/type";

export const brandFormConfig: DynamicFormConfig = {
  fields: [
    { name: "name", type: "input", label: "Brand Name", required: true, columnSpan: 12,
      validation: { minLength: 2, maxLength: 80 } },
    { name: "description", type: "textarea", label: "Description", rows: 3, columnSpan: 12 },
    { name: "images", type: "file-upload", label: "Brand Image",
      accept: "image/*", maxFiles: 1, columnSpan: 12 },
    { name: "status", type: "select", label: "Status", required: true, columnSpan: 12,
      defaultValue: "active",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

export const brandDefaultValues = { name: "", description: "", images: [], status: "active" as const };
```

## 2. Use in component

```tsx
"use client";
import DynamicForm from "@/ui/components/form";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { useCreateBrand } from "@/services/api";
import { brandFormConfig, brandDefaultValues } from "@/components/brands/form-config";

export function CreateBrandDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { form, config } = useDynamicForm(brandFormConfig, brandDefaultValues);
  const createMutation = useCreateBrand();

  return (
    <DynamicForm
      openInside="drawer"
      open={open}
      onOpenChange={onOpenChange}
      title="Create Brand"
      form={form}
      config={config}
      mutationHook={createMutation}
      submitLabel="Create"
      actionsPlacement="top"
    />
  );
}
```

## 3. Standard CRUD page (DataTable / DataCard handles forms internally)

```tsx
const sharedOperations = {
  formConfig: brandFormConfig,
  defaultValues: brandDefaultValues,
  getAllData: brandsApi.getAll,
  createMutation: useCreateBrand(),
  updateMutation: useUpdateBrand(),
  deleteMutation: useDeleteBrand(),
  queryKey: [...queryKeys.brands.all()],
  entityName: "Brand",
};

<DataTable operations={sharedOperations} columns={columns} filters={filters} />
```
