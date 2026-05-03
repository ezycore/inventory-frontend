# Recipes

## Dependent select (variants per product)

```ts
{
  name: "productId",
  type: "select",
  label: "Product",
  optionsApi: "/products",
  labelInValue: true,         // returns full object so we can read variant_count, _id
  required: true,
  columnSpan: 6,
},
{
  name: "variantId",
  type: "select",
  label: "Variant",
  optionsApi: "/products/{{_id}}/variants", // {{_id}} resolves from productId object
  columnSpan: 6,
  dependsOn: {
    field: "productId",
    matchWithProp: "variant_count",
    condition: "gt",
    value: 0,
    action: "disable",        // enabled only when product has variants
  },
}
```

## Show/hide field by another field's value

```ts
{
  name: "discountValue",
  type: "number",
  label: "Discount %",
  dependsOn: { field: "discountType", condition: "eq", value: "percentage", action: "show" },
}
```

## Hide/show an entire section

When multiple related fields should appear/disappear together, apply `dependsOn` at the **section level** instead of repeating it on every field:

```ts
{
  title: "UOM Conversion",
  icon: <span>📦</span>,
  collapsible: true,
  dependsOn: {
    field: "productType",
    value: "single",
    condition: "eq",
    action: "show",  // show section only for single products
  },
  fields: [
    {
      name: "enableUOMConversion",
      type: "checkbox",
      label: "Enable UOM Conversion",
    },
    {
      name: "purchaseUnit.unitId",
      type: "select",
      label: "Purchase Unit",
      dependsOn: { field: "enableUOMConversion", condition: "truthy", action: "show" },  // field-level dependency still works
    },
    // ... more UOM fields
  ]
}
```

When the section's condition is not met, the entire card is hidden (no fields render). This is cleaner than adding `dependsOn` to every field in the section.

## Auto-fill from selected option

```ts
{
  name: "customerId",
  type: "select",
  label: "Customer",
  optionsApi: "/sales/customers",
  labelInValue: true,                                  // required
  autoFillFields: ["email", "discountType", "discountValue"],
}
// Selecting a customer copies matching props from the option onto those form fields.
```

## Copy raw value into a nested target

```ts
{
  name: "unitId",
  type: "select",
  optionsApi: "/units",
  copyValueTo: ["saleUnit.unitId"],   // dot-notation path supported
}
```

## Inline quick-add for creatable select

```ts
// 1. Field
{ name: "categoryId", type: "select", label: "Category",
  optionsApi: "/categories/active",
  creatable: true,
  quickAddModule: "category" }

// 2. Register in config/quickAddConfig.ts
category: {
  formConfig: categoryFormConfig,
  useMutation: useCreateCategory,
  title: "Add New Category",
  submitLabel: "Create Category",
  optionsApiPath: "/categories",
}
```

## Action button next to select

```ts
{
  name: "supplierId", type: "select", optionsApi: "/suppliers",
  action: {
    icon: <Plus className="h-4 w-4" />,
    variant: "outline",
    href: "/suppliers/new",   // OR onClick: () => setOpen(true)
  },
}
```

## File upload (multi)

```ts
{
  name: "images", type: "file-upload", label: "Product Images",
  accept: "image/*", maxFiles: 5, maxSize: 5 * 1024 * 1024, multiple: true,
  fileTypes: ["jpg", "png", "webp"],
  dropzoneText: "Drop product images here",
}
// Accepts File | string URL | { url, thumbnailUrl, publicId } interchangeably.
```

## Dynamic suffix / prefix / helperText (function form)

```ts
{
  name: "quantityAlert", type: "number", label: "Alert Level", required: true,
  suffix: (values) => values?.productId?.unit?.shortName || "",
  helperText: (values) => {
    const baseUnit = values?.productId?.unit?.shortName;
    return baseUnit ? `Alert level is in ${baseUnit}.` : "Notify when stock falls.";
  },
}
```

## View-mode (read-only)

```tsx
<DynamicForm openInside="modal" open={open} onOpenChange={setOpen}
  title="Product Details" viewMode form={form} config={config} />
```

## Edit-mode with locked fields

```tsx
<DynamicForm form={form} config={config} mutationHook={updateMutation}
  isEditMode disabledFieldsInEdit={["email", "slug"]}
  contentLoading={isFetchingEntity} />
```

## Conditional config (factory)

```ts
export const getProductFormConfig = (isUOMEnabled: boolean): DynamicFormConfig => ({
  fields: [
    { name: "name", type: "input", label: "Name", required: true, columnSpan: 6 },
    ...(isUOMEnabled ? [{ name: "convertedQuantity", type: "number" as const, label: "Converted Qty", columnSpan: 6 }] : []),
  ],
});

// Memoize in the component:
const config = useMemo(() => getProductFormConfig(isUOMEnabled), [isUOMEnabled]);
const { form } = useDynamicForm(config);
```

## Sections with icons + collapsible

```ts
const config: DynamicFormConfig = {
  sections: [
    { title: "Personal", icon: <User className="h-5 w-5" />, fields: [...] },
    { title: "Address", icon: <Home className="h-5 w-5" />, collapsible: true, defaultOpen: false, fields: [...] },
  ],
};
```
