# DynamicForm — Config-Driven Form System

A powerful, configuration-driven form system built on top of **React Hook Form** and **Zod**. Define your entire form — fields, layout, validation, dependencies, and submission logic — through a single configuration object. No manual schema writing required.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Form Configuration (`DynamicFormConfig`)](#form-configuration-dynamicformconfig)
  - [Flat Fields](#flat-fields)
  - [Sections](#sections)
  - [Layout Options](#layout-options)
- [Field Types](#field-types)
- [Field Configuration (`FormFieldConfig`)](#field-configuration-formfieldconfig)
  - [Basic Properties](#basic-properties)
  - [Validation](#validation)
  - [Column Span & Layout](#column-span--layout)
  - [Select Field Features](#select-field-features)
  - [File Upload Features](#file-upload-features)
  - [Multi-Select Features](#multi-select-features)
  - [Custom Components](#custom-components)
- [Auto-Generated Zod Schema](#auto-generated-zod-schema)
- [Field Dependencies (`dependsOn`)](#field-dependencies-dependson)
- [API-Driven Select Options (`optionsApi`)](#api-driven-select-options-optionsapi)
- [Auto-Fill Fields](#auto-fill-fields)
- [Quick-Add (Creatable Selects)](#quick-add-creatable-selects)
- [Render Modes](#render-modes)
  - [Regular (Inline) Form](#regular-inline-form)
  - [Drawer Mode](#drawer-mode)
  - [Modal Mode](#modal-mode)
- [Submission Patterns](#submission-patterns)
  - [Simple `onSubmit`](#simple-onsubmit)
  - [Mutation Hook](#mutation-hook)
- [View Mode (Read-Only)](#view-mode-read-only)
- [Edit Mode & Disabled Fields](#edit-mode--disabled-fields)
- [Content Loading State](#content-loading-state)
- [Dynamic / Conditional Configs](#dynamic--conditional-configs)
- [Custom Fields Manager](#custom-fields-manager)
- [Operations Pattern (DataTable / DataCard)](#operations-pattern-datatable--datacard)
- [`DynamicFormProps` Full Reference](#dynamicformprops-full-reference)
- [`FormFieldConfig` Full Reference](#formfieldconfig-full-reference)

---

## Quick Start

```tsx
import DynamicForm from "@/ui/components/form";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// 1. Define your config (outside component for stable reference)
const formConfig: DynamicFormConfig = {
  fields: [
    { name: "name", type: "input", label: "Name", required: true, columnSpan: 6 },
    { name: "email", type: "input", label: "Email", required: true, columnSpan: 6, validation: { email: true } },
    { name: "status", type: "select", label: "Status", columnSpan: 12, options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]},
  ],
};

// 2. Use the hook (auto-generates Zod schema + react-hook-form)
function MyPage() {
  const { form, config } = useDynamicForm(formConfig, { status: "active" });

  return (
    <DynamicForm
      form={form}
      config={config}
      onSubmit={(data) => console.log(data)}
      submitLabel="Save"
    />
  );
}
```

That's it — validation schema, form state, and rendering are all handled automatically.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    DynamicFormConfig                     │
│  (fields or sections with FormFieldConfig[])            │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
   useDynamicForm()          generateSchemaFromConfig()
   (hook)                    (auto Zod schema)
          │                         │
          ▼                         ▼
   ┌─────────────┐         ┌──────────────┐
   │  useForm()  │◄────────│ zodResolver  │
   │  (RHF)      │         └──────────────┘
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │          <DynamicForm />            │
   │  Renders: inline | drawer | modal   │
   │  ┌───────────────────────────────┐  │
   │  │  FormContent                  │  │
   │  │  ┌─────────────────────────┐  │  │
   │  │  │ FormSectionComponent    │  │  │
   │  │  │  ┌───────────────────┐  │  │  │
   │  │  │  │  FormField (memo) │  │  │  │
   │  │  │  │  (per field type) │  │  │  │
   │  │  │  └───────────────────┘  │  │  │
   │  │  └─────────────────────────┘  │  │
   │  └───────────────────────────────┘  │
   └─────────────────────────────────────┘
```

**Key files:**

| File | Purpose |
|------|---------|
| `ui/components/form/type.ts` | All TypeScript types + interfaces (re-exports the schema API) |
| `ui/components/form/schema.ts` | `generateSchemaFromConfig()` (+ `schema-visibility.ts`, `strip-hidden-values.ts`) |
| `ui/components/form/index.tsx` | Main `DynamicForm` component (drawer/modal/inline rendering) |
| `ui/components/form/form-field.tsx` | `FormField` + per-type inputs (`field-renderer.tsx`, `field-*-inputs.tsx`), `form-section.tsx`, `form-content.tsx` |
| `ui/components/form/dependency-utils.ts` | Field dependency evaluation logic |
| `ui/components/form/custom-fields-manager.tsx` | Dynamic custom field builder UI |
| `hooks/use-dynamic-form.ts` | `useDynamicForm` hook (schema generation + form creation) |
| `config/quickAddConfig.ts` | Quick-add module registry for creatable selects |

---

## Form Configuration (`DynamicFormConfig`)

A form config can be structured in two ways: **flat fields** or **grouped sections**. Use one or the other — not both.

```ts
interface DynamicFormConfig {
  sections?: FormSection[];       // Grouped fields with titles/icons
  fields?: FormFieldConfig[];     // Flat list of fields
  layout?: {
    maxColumns?: number;          // Default: 12 (CSS grid)
    gap?: number;
    sectionSpacing?: number;
  };
  generateSchema?: boolean;       // Auto-generate Zod schema (default: true)
}
```

### Flat Fields

Best for simple forms (brands, categories, units, etc.):

```ts
const brandFormConfig: DynamicFormConfig = {
  fields: [
    { name: "name", type: "input", label: "Brand Name", required: true, columnSpan: 12 },
    { name: "description", type: "textarea", label: "Description", rows: 3, columnSpan: 12 },
    { name: "images", type: "file-upload", label: "Brand Image", columnSpan: 12, accept: "image/*", maxFiles: 1 },
    { name: "status", type: "select", label: "Status", required: true, defaultValue: "active",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};
```

### Sections

For complex multi-section forms (products, signup, settings, etc.):

```ts
const signupFormConfig: DynamicFormConfig = {
  sections: [
    {
      title: "Personal Information",
      description: "Manage your personal details",
      icon: <User className="h-5 w-5 text-blue-600" />,
      collapsible: false,
      fields: [
        { name: "firstName", type: "input", label: "First Name", required: true, columnSpan: 6 },
        { name: "lastName", type: "input", label: "Last Name", required: true, columnSpan: 6 },
        { name: "email", type: "input", label: "Email", required: true, columnSpan: 6, validation: { email: true } },
        { name: "password", type: "password", label: "Password", required: true, columnSpan: 6 },
      ],
    },
    {
      title: "Organization Details",
      icon: <Building className="h-5 w-5 text-green-600" />,
      collapsible: true,
      defaultOpen: true,
      fields: [
        { name: "orgName", type: "input", label: "Organization Name", required: true, columnSpan: 6 },
        { name: "industry", type: "select", label: "Industry", columnSpan: 6, options: [...] },
      ],
    },
  ],
};
```

**`FormSection` properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Section heading |
| `description` | `string` | — | Subtitle below heading |
| `icon` | `ReactNode` | — | Icon displayed next to title |
| `collapsible` | `boolean` | `false` | Allow collapsing the section |
| `defaultOpen` | `boolean` | `true` | Initial collapse state |
| `fields` | `FormFieldConfig[]` | *required* | Fields in this section |
| `className` | `string` | — | Additional CSS classes |

### Layout Options

Fields use a **12-column CSS grid**. Each field's `columnSpan` determines how many columns it occupies. The grid is responsive:
- **Mobile**: All fields are `col-span-12` (full width)
- **Tablet (sm)**: Fields use `col-span-6` (half width)
- **Desktop (lg)**: Fields use their configured `columnSpan`

---

## Field Types

| Type | Description | Renders |
|------|-------------|---------|
| `input` | Standard text input | `<Input />` |
| `number` | Numeric input with step support | `<Input type="number" />` |
| `password` | Password input with show/hide toggle | `<Password />` |
| `textarea` | Multi-line text area | `<Textarea />` |
| `select` | Dropdown or multi-select | `<AdvancedSelect />` |
| `radio-group` | Radio button group | `<RadioGroup />` |
| `checkbox` | Single checkbox | `<Checkbox />` |
| `switch` | Toggle switch | `<Switch />` |
| `date` | Date picker | `<DatePicker />` |
| `file-upload` | File upload with drag & drop and preview | `<FileUpload />` |
| `custom` | Render your own component | `customComponent` prop |
| `custom-fields` | Dynamic custom field manager | Custom field builder |

---

## Field Configuration (`FormFieldConfig`)

### Basic Properties

```ts
{
  name: "fieldName",          // Form field name (maps to form state key)
  type: "input",              // One of FormFieldType
  label: "Field Label",       // Display label
  placeholder: "Enter...",    // Placeholder text
  required: true,             // Makes field required + adds Zod validation
  disabled: false,            // Permanently disable field
  hidden: false,              // Permanently hide field
  defaultValue: "active",     // Default value (picked up by useDynamicForm)
  description: "Help text",   // Description (not often used — see helperText)
  helperText: "Shown below field", // Helper text below the field
}
```

### Validation

Validation rules are defined in a `validation` object. These generate the corresponding Zod schema automatically:

```ts
{
  validation: {
    min: 0,              // Minimum number value
    max: 100,            // Maximum number value
    minLength: 1,        // Minimum string length
    maxLength: 500,      // Maximum string length
    pattern: /^[A-Z]/,   // Regex pattern
    email: true,         // Email validation
    url: true,           // URL validation (allows empty string)
    custom: (value) => { // Custom validator (return error string or undefined)
      if (value < 0) return "Must be positive";
    },
  },
}
```

**Validation → Zod mapping:**

| Validation Prop | Applicable Types | Generated Zod |
|-----------------|------------------|---------------|
| `min` | `number` | `z.number().min(n)` |
| `max` | `number` | `z.number().max(n)` |
| `minLength` | `input`, `textarea` | `z.string().min(n)` |
| `maxLength` | `input`, `textarea` | `z.string().max(n)` |
| `pattern` | `input`, `textarea` | `z.string().regex(pattern)` |
| `email` | `input` | `z.string().email()` |
| `url` | `input` | `z.string().refine(urlCheck)` |
| `required: true` | `input`, `textarea` | `z.string().min(1, "X is required")` |

### Column Span & Layout

```ts
{
  columnSpan: 6,   // How many grid columns (out of 12) this field occupies
  className: "",   // Additional CSS classes on the field wrapper
}
```

**Valid `columnSpan` values:** `1 | 2 | 3 | 4 | 6 | 8 | 12`

Common patterns:
- `12` → Full width (default)
- `6` → Half width (two fields per row)
- `4` → One-third width (three fields per row)
- `3` → Quarter width (four fields per row)

### Select Field Features

```ts
{
  name: "category",
  type: "select",
  label: "Category",
  
  // Static options
  options: [
    { value: "electronics", label: "Electronics" },
    { value: "clothing", label: "Clothing", disabled: true },
  ],
  
  // OR dynamic API-driven options
  optionsApi: "/categories/active",
  itemsCreateCallback: (response) => {
    return response.data.items.map(item => ({
      value: item._id,
      label: item.name,
    }));
  },
  
  // Multi-select mode
  mode: "multiple",
  
  // Return full object instead of just value string
  labelInValue: true,
  
  // Quick-add inline creation
  creatable: true,
  quickAddModule: "category", // Maps to quickAddConfig entry
  
  // Action button next to select
  action: {
    icon: <Plus />,
    label: "Add New",
    variant: "outline",
    onClick: () => openCreateModal(),
    // OR navigate via href
    href: "/categories/create",
  },
}
```

### File Upload Features

```ts
{
  name: "images",
  type: "file-upload",
  label: "Product Images",
  accept: "image/*",          // MIME type filter
  maxFiles: 5,                // Max number of files (default: 1)
  maxSize: 5 * 1024 * 1024,   // Max file size in bytes (default: 5MB)
  multiple: true,             // Allow multiple file selection
  fileTypes: ["jpg", "png"],  // Allowed extensions (display only)
  dropzoneText: "Upload product images", // Custom dropzone message
  showPreview: true,          // Show thumbnail previews (default: true)
}
```

**File upload handles three value formats:**
- `File` objects (newly uploaded)
- String URLs (existing files)
- Image objects (`{ url, thumbnailUrl, publicId }`)

### Multi-Select Features

```ts
{
  name: "tags",
  type: "select",
  mode: "multiple",
  maxCount: 5,                // Max selectable items
  modalPopover: true,         // Use modal popover for selection
  variant: "default",         // "default" | "secondary" | "destructive" | "inverted"
}
```

### Custom Components

Render any component inside the form grid:

```ts
{
  name: "customData",
  type: "custom",
  label: "My Custom Field",
  customComponent: MyCustomInput,
  customProps: { theme: "dark", limit: 10 },
}
```

Your custom component receives:
- All standard controller field props (`value`, `onChange`, `onBlur`, `ref`)
- `control` — the react-hook-form control
- `error` — validation error message
- Everything from `customProps`

---

## Auto-Generated Zod Schema

The system automatically generates a Zod schema from your field config. **You never need to write a schema manually.**

```ts
// This:
const config: DynamicFormConfig = {
  fields: [
    { name: "name", type: "input", required: true, label: "Name", validation: { minLength: 1, maxLength: 100 } },
    { name: "price", type: "number", required: true, label: "Price", validation: { min: 0 } },
    { name: "status", type: "select", label: "Status", options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]},
  ],
};

// Auto-generates equivalent of:
z.object({
  name: z.string().min(1, "Name is required").max(100, "Maximum 100 characters allowed"),
  price: z.number().min(0, "Minimum value is 0"),
  status: z.enum(["active", "inactive"]).optional(),
});
```

**Field type → Zod type mapping:**

| Field Type | zodType Override | Generated Zod Type |
|------------|------------------|--------------------|
| `input`, `textarea`, `password` | — | `z.string()` |
| `number` | `"number"` | `z.number()` |
| `checkbox`, `switch` | `"boolean"` | `z.boolean()` |
| `select` (single) | — | `z.enum([...])` or `z.string()` |
| `select` (multiple) | — | `z.array(z.enum([...]))` or `z.array(z.string())` |
| `date` | — | `z.string().pipe(z.coerce.date())` |
| `file-upload` | — | `z.array(z.any())` |
| `radio-group` | — | `z.enum([...])` or `z.string()` |
| `custom` | — | `z.array(z.any()).optional()` |
| `custom-fields` | — | `z.array(z.object({...})).optional()` |

Override the auto Zod type with `zodType`:
```ts
{ name: "quantity", type: "input", label: "Qty", zodType: "number" }
// Generates z.number() instead of z.string()
```

---

## Field Dependencies (`dependsOn`)

Make fields react to other fields — hide, show, enable, or disable based on conditions.

```ts
interface FieldDependency {
  field: string;             // Field name to watch
  matchWithProp?: string;    // Property to extract from watched value (for objects)
  condition?: DependencyCondition; // Comparison operator (default: "eq")
  value?: any;               // Value to compare against
  action?: DependencyAction; // What to do when condition matches (default: "disable")
}
```

### Conditions

| Condition | Description | Example |
|-----------|-------------|---------|
| `eq` | Equals | `{ condition: "eq", value: "percentage" }` |
| `ne` | Not equals | `{ condition: "ne", value: "none" }` |
| `gt` | Greater than | `{ condition: "gt", value: 0 }` |
| `gte` | Greater than or equal | `{ condition: "gte", value: 1 }` |
| `lt` | Less than | `{ condition: "lt", value: 100 }` |
| `lte` | Less than or equal | `{ condition: "lte", value: 50 }` |
| `in` | Value in array | `{ condition: "in", value: ["a", "b"] }` |
| `notIn` | Value not in array | `{ condition: "notIn", value: ["x"] }` |
| `truthy` | Any truthy value | `{ condition: "truthy" }` |
| `falsy` | Any falsy value | `{ condition: "falsy" }` |

### Actions

| Action | Behavior |
|--------|----------|
| `disable` | Disable field when condition is **NOT** met |
| `enable` | Enable field when condition **IS** met |
| `hide` | Hide field when condition is **NOT** met |
| `show` | Show field when condition **IS** met |

### Examples

**Disable a field until another field is filled:**
```ts
{
  name: "variantId",
  type: "select",
  label: "Variant",
  dependsOn: {
    field: "productId",
    condition: "truthy",
    action: "disable",     // Enabled only when productId is truthy
  },
}
```

**Show a field only when a specific option is selected:**
```ts
{
  name: "discountValue",
  type: "number",
  label: "Discount %",
  dependsOn: {
    field: "discountType",
    condition: "eq",
    value: "percentage",
    action: "show",        // Visible only when discountType === "percentage"
  },
}
```

**Use `matchWithProp` with complex objects:**

When the watched field returns an object (e.g., a select with `labelInValue`), use `matchWithProp` to extract a specific property for comparison:

```ts
{
  name: "variantId",
  type: "select",
  label: "Variant",
  optionsApi: "/products/{{_id}}/variants",
  dependsOn: {
    field: "productId",
    matchWithProp: "variant_count",  // Extract variant_count from the productId object
    condition: "gt",
    value: 0,
    action: "disable",
  },
}
```

---

## API-Driven Select Options (`optionsApi`)

Instead of static options, load options from an API endpoint:

```ts
{
  name: "category",
  type: "select",
  label: "Category",
  optionsApi: "/categories/active",  // GET request to this endpoint
}
```

### Custom response mapping with `itemsCreateCallback`

Transform the API response into `{ value, label }` format:

```ts
{
  name: "locationIds",
  type: "select",
  mode: "multiple",
  optionsApi: "/locations/active",
  itemsCreateCallback: (response) => {
    const items = response?.data?.items || [];
    return items.map((item) => ({
      value: item._id,
      label: `${item.name} (${item.locationType})`,
    }));
  },
}
```

### Dynamic API URL with `{{placeholder}}`

Use template syntax to include other field values in the API path:

```ts
{
  name: "variantId",
  type: "select",
  label: "Variant",
  optionsApi: "/products/{{productId}}/variants",  // Resolves at runtime
  dependsOn: {
    field: "productId",
    condition: "truthy",
    action: "disable",
  },
}
```

The `{{productId}}` placeholder is resolved from the current form state. The API call is only made when:
1. The dependency condition is met
2. The placeholder value is available

---

## Auto-Fill Fields

When a user selects an option from a select field, automatically populate other form fields with data from the selected option:

```ts
{
  name: "customerId",
  type: "select",
  label: "Customer",
  optionsApi: "/sales/customers",
  labelInValue: true,  // Important: return full object, not just value
  autoFillFields: ["discountType", "discountValue", "email"],
  // When a customer is selected, the form will auto-fill discountType,
  // discountValue, and email from the selected option's matching properties
}
```

**How it works:**
1. User selects a customer option (e.g., `{ value: "123", label: "John", discountType: "percentage", discountValue: 10, email: "john@..." }`)
2. The system checks each field name in `autoFillFields`
3. For each name, it looks for a matching property on the selected option object
4. If found, it calls `setValue(fieldName, value)` to populate that field

---

## Quick-Add (Creatable Selects)

Allow users to create new options inline without leaving the form:

```ts
// In your field config:
{
  name: "categoryId",
  type: "select",
  label: "Category",
  optionsApi: "/categories/active",
  creatable: true,               // Enable quick-add
  quickAddModule: "category",    // Maps to quickAddConfig entry
}
```

Register modules in `config/quickAddConfig.ts`:

```ts
export const quickAddConfig: Record<string, QuickAddModuleConfig> = {
  category: {
    formConfig: categoryFormConfig,  // The form config for the create modal
    useMutation: useCreateCategory,  // Mutation hook
    title: "Add New Category",
    submitLabel: "Create Category",
    optionsApiPath: "/categories",   // API path to invalidate cache after creation
  },
  brand: {
    formConfig: brandFormConfig,
    useMutation: useCreateBrand,
    title: "Add New Brand",
    submitLabel: "Create Brand",
    optionsApiPath: "/brands",
  },
};
```

When the user clicks the "quick add" button in the select, a modal opens with the configured form. After successful creation, the select options are refreshed and the new item is auto-selected.

---

## Render Modes

`DynamicForm` supports three rendering modes controlled by the `openInside` prop.

### Regular (Inline) Form

Default — renders the form inline in the page:

```tsx
<DynamicForm
  form={form}
  config={config}
  onSubmit={handleSubmit}
  submitLabel="Save"
  actionsPlacement="bottom"  // "top" | "bottom" | "both"
/>
```

### Drawer Mode

Renders in a slide-out sheet from the right:

```tsx
<DynamicForm
  openInside="drawer"
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Edit Product"
  form={form}
  config={config}
  mutationHook={updateMutation}
  onSuccess={handleSuccess}
  submitLabel="Save Changes"
  actionsPlacement="top"  // Actions in the header for drawer
/>
```

Drawer specs:
- Slides in from the right
- Width: `80vw` on tablet, max `880px`
- Scrollable content area
- Actions can be placed in header (`top`) or bottom

### Modal Mode

Renders in a centered dialog:

```tsx
<DynamicForm
  openInside="modal"
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Create Brand"
  form={form}
  config={config}
  mutationHook={createMutation}
  onSuccess={handleSuccess}
  modalSize="lg"  // "sm" | "md" | "lg" | "xl" | "full"
/>
```

Modal sizes:
| Size | Max Width |
|------|-----------|
| `sm` | `max-w-md` |
| `md` | `max-w-lg` |
| `lg` | `max-w-2xl` |
| `xl` | `max-w-4xl` |
| `full` | `90vw` |

---

## Submission Patterns

### Simple `onSubmit`

```tsx
<DynamicForm
  form={form}
  config={config}
  onSubmit={(data) => {
    console.log("Form data:", data);
    // Transform data if needed — return value is used by mutationHook
  }}
/>
```

### Mutation Hook

Pass a TanStack Query mutation directly — the form handles loading states, success/error callbacks, and auto-closing:

```tsx
const createProductMutation = useCreateProduct();

<DynamicForm
  form={form}
  config={config}
  mutationHook={createProductMutation}
  onSubmit={(data) => {
    // Optional: transform data before mutation
    return { ...data, slug: slugify(data.name) };
  }}
  onSuccess={(result, data) => {
    toast.success("Product created!");
    router.push(`/products/${result._id}`);
  }}
  onFailed={(error, data) => {
    toast.error(error.message);
  }}
  resetAfterSubmit={true}  // Reset form after successful submit (default: true)
/>
```

**Mutation flow:**
1. React Hook Form validates all fields
2. `onSubmit` is called to optionally transform data
3. `mutationHook.mutate()` is called with the (transformed) data
4. On success: `onSuccess` callback → `onOpenChange(false)` → `form.reset()`
5. On error: `onFailed` callback

The submit button automatically:
- Shows "Submitting..." during mutation
- Is disabled when: submitting, content loading, or form is not dirty

---

## View Mode (Read-Only)

Display form data as read-only text instead of editable inputs:

```tsx
<DynamicForm
  form={form}
  config={config}
  viewMode={true}
  openInside="modal"
  open={isViewOpen}
  onOpenChange={setIsViewOpen}
  title="Product Details"
/>
```

In view mode:
- All fields render as text/labels instead of inputs
- Required asterisks (`*`) are hidden
- Error messages are hidden
- Checkbox → "Yes" / "No"
- Select → shows the selected option's label
- File upload → shows image previews with "View" links
- Modal shows a "Close" button instead of submit/cancel

---

## Edit Mode & Disabled Fields

Disable specific fields when editing an existing record:

```tsx
<DynamicForm
  form={form}
  config={config}
  isEditMode={true}
  disabledFieldsInEdit={["email", "username"]}
  // email and username fields will be disabled when isEditMode is true
/>
```

---

## Content Loading State

Show a skeleton placeholder while fetching data to populate the form:

```tsx
<DynamicForm
  form={form}
  config={config}
  contentLoading={isLoading}  // True while fetching entity data
/>
```

When `contentLoading` is true, the form renders skeleton cards that match the section layout. The submit button is also disabled during loading.

---

## Dynamic / Conditional Configs

For forms that change structure based on feature flags or runtime data, use factory functions:

```ts
export const getProductFormConfig = (isUOMEnabled: boolean): DynamicFormConfig => {
  const fields: FormFieldConfig[] = [
    { name: "name", type: "input", label: "Product Name", required: true, columnSpan: 6 },
    { name: "sku", type: "input", label: "SKU", required: true, columnSpan: 6 },
    { name: "quantity", type: "number", label: "Quantity", required: true, columnSpan: 6 },
  ];

  if (isUOMEnabled) {
    fields.push({
      name: "convertedQuantity",
      type: "number",
      label: "Converted Quantity",
      columnSpan: 6,
    });
  }

  fields.push(
    { name: "costPrice", type: "number", label: "Cost Price", columnSpan: 4 },
    { name: "salePrice", type: "number", label: "Sale Price", columnSpan: 4 },
  );

  return { fields };
};

// Usage:
const config = useMemo(() => getProductFormConfig(isUOMEnabled), [isUOMEnabled]);
const { form } = useDynamicForm(config);
```

> **Performance tip:** Keep config references stable. Define configs outside components or use `useMemo`. Unstable references cause the schema to regenerate on every render.

---

## Custom Fields Manager

The `custom-fields` field type provides a UI for end-users to dynamically add their own fields to a form at runtime. Users can:

- Add custom fields of various types (text, number, email, URL, date, textarea, select, checkbox, radio)
- Set labels, placeholders, required flag, and column size
- Add options for select/radio fields
- Reorder fields via drag & drop
- Edit and delete fields

```ts
{
  name: "customFields",
  type: "custom-fields",
  label: "Custom Fields",
  columnSpan: 12,
  maxCount: 20,  // Max number of custom fields
}
```

---

## Operations Pattern (DataTable / DataCard)

The most common usage pattern in the app — pages define a `sharedOperations` object that is passed to `DataTable` or `DataCard`, which internally handles CRUD forms:

```tsx
// app/(protected)/taxes/page.tsx
const sharedOperations = {
  formConfig: taxFormConfig,           // DynamicFormConfig
  defaultValues,                       // Default form values
  getAllData: taxesApi.getAll,          // API function to list entities
  createMutation: useCreateTax(),      // TanStack mutation for create
  updateMutation: useUpdateTax(),      // TanStack mutation for update
  deleteMutation: useDeleteTax(),      // TanStack mutation for delete
  queryKey: [...queryKeys.taxes.all()],
  entityName: "Tax",
};

// DataCard/DataTable internally renders DynamicForm in drawer/modal:
<DataCard
  operations={sharedOperations}
  columns={columns}
  filters={filters}
  // ...
/>
```

This pattern means you define your form config once and the DataTable/DataCard handles:
- Create form (modal/drawer)
- Edit form (drawer with pre-filled values)
- View form (read-only modal)
- Delete confirmation
- Form state management

---

## `DynamicFormProps` Full Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `DynamicFormConfig` | *required* | Form structure configuration |
| `form` | `UseFormReturn<any>` | *required* | React Hook Form instance (from `useDynamicForm` or `useForm`) |
| `className` | `string` | — | Additional CSS classes |
| `onFieldChange` | `(name, value) => void` | — | Callback when any field value changes |
| `viewMode` | `boolean` | `false` | Render form as read-only |
| `openInside` | `"drawer" \| "modal"` | — | Container mode (omit for inline) |
| `open` | `boolean` | — | Open state for drawer/modal |
| `onOpenChange` | `(open) => void` | — | Open state change handler |
| `title` | `string` | — | Drawer/modal title |
| `submitLabel` | `string` | `"Submit"` | Submit button text |
| `cancelLabel` | `string` | `"Cancel"` | Cancel button text |
| `onSubmit` | `(data) => any` | — | Form submit handler (can transform data) |
| `onCancel` | `() => void` | — | Cancel handler (defaults to closing drawer/modal) |
| `isSubmitting` | `boolean` | `false` | Manual submitting state |
| `mutationHook` | `{ mutate, isPending }` | — | TanStack Query mutation object |
| `onSuccess` | `(result, data) => void` | — | Called after successful mutation |
| `onFailed` | `(error, data) => void` | — | Called after failed mutation |
| `contentLoading` | `boolean` | `false` | Show skeleton instead of form |
| `modalSize` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"lg"` | Modal dialog size |
| `actionsPlacement` | `"top" \| "bottom" \| "both"` | `"bottom"` | Where to render action buttons |
| `resetAfterSubmit` | `boolean` | `true` | Reset form after successful submit |
| `hideCancel` | `boolean` | `false` | Hide the cancel button |
| `disabledFieldsInEdit` | `string[]` | — | Field names to disable in edit mode |
| `isEditMode` | `boolean` | `false` | Whether the form is in edit mode |

---

## `FormFieldConfig` Full Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| **Basic** | | | |
| `name` | `string` | *required* | Field name in form state |
| `type` | `FormFieldType` | *required* | Field type |
| `label` | `string` | *required* | Display label |
| `placeholder` | `string` | — | Placeholder text |
| `required` | `boolean` | `false` | Field required |
| `disabled` | `boolean` | `false` | Field disabled |
| `hidden` | `boolean` | `false` | Field hidden |
| `defaultValue` | `any` | — | Default value |
| `helperText` | `string` | — | Help text below field |
| **Layout** | | | |
| `columnSpan` | `1\|2\|3\|4\|6\|8\|12` | `12` | Grid columns to span |
| `className` | `string` | — | Additional CSS classes |
| **Validation** | | | |
| `validation.min` | `number` | — | Min numeric value |
| `validation.max` | `number` | — | Max numeric value |
| `validation.minLength` | `number` | — | Min string length |
| `validation.maxLength` | `number` | — | Max string length |
| `validation.pattern` | `RegExp` | — | Regex pattern |
| `validation.email` | `boolean` | — | Email validation |
| `validation.url` | `boolean` | — | URL validation |
| `validation.custom` | `(value) => string \| undefined` | — | Custom validator |
| **Schema** | | | |
| `zodType` | `"string"\|"number"\|"boolean"\|"array"\|"object"\|"date"\|"file"` | — | Override Zod type |
| `arrayOf` | `"string"\|"number"\|"file"\|"any"` | — | Array element type |
| `enumValues` | `readonly string[]` | — | Enum values for schema |
| **Select** | | | |
| `options` | `SelectOption[]` | — | Static options |
| `optionsApi` | `string` | — | API endpoint for options |
| `itemsCreateCallback` | `(response) => SelectOption[]` | — | Transform API response |
| `labelInValue` | `boolean` | — | Return full option object |
| `mode` | `"single"\|"multiple"` | `"single"` | Selection mode |
| `creatable` | `boolean` | — | Enable quick-add modal |
| `quickAddModule` | `string` | — | Quick-add module name |
| `autoFillFields` | `string[]` | — | Fields to auto-fill from selection |
| `action` | `object` | — | Action button config next to select |
| **File Upload** | | | |
| `accept` | `string` | `"*"` | MIME type filter |
| `maxFiles` | `number` | `1` | Max number of files |
| `maxSize` | `number` | `5MB` | Max file size (bytes) |
| `multiple` | `boolean` | — | Allow multiple files |
| `fileTypes` | `string[]` | — | Allowed extensions |
| `dropzoneText` | `string` | — | Custom dropzone text |
| `showPreview` | `boolean` | `true` | Show file previews |
| **Textarea** | | | |
| `rows` | `number` | `3` | Textarea rows |
| **Number** | | | |
| `step` | `number` | — | Number input step |
| **Multi-select** | | | |
| `maxCount` | `number` | — | Max selected items |
| `modalPopover` | `boolean` | — | Use modal popover |
| `variant` | `string` | `"default"` | Badge variant |
| **Dependency** | | | |
| `dependsOn` | `FieldDependency` | — | Field dependency config |
| **Custom** | | | |
| `customComponent` | `React.ComponentType` | — | Custom component to render |
| `customProps` | `Record<string, any>` | — | Props passed to custom component |
| **Callbacks** | | | |
| `onChange` | `(value) => void` | — | Value change callback |
| `onValueChange` | `(value) => void` | — | Select value change callback |
