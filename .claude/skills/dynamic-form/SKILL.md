---
name: dynamic-form
description: 'Build, edit, debug, or audit config-driven forms in EzyCore frontend using DynamicForm + useDynamicForm + auto-generated Zod schema. USE WHEN: creating a new resource form (brand/category/product/customer/etc.), adding fields/sections, wiring up select with optionsApi, configuring field dependencies (dependsOn), enabling quick-add creatable selects, autofill from selected option, drawer/modal/inline rendering, view-mode (read-only), edit-mode disabled fields, file upload, custom-fields manager, troubleshooting "X is required" / "expected string, received undefined" Zod errors, dot-notation nested fields, template optionsApi like /products/{{productId}}/variants, suffix/prefix/helperText functions. Touches files under ui/components/form/, hooks/use-dynamic-form.ts, config/quickAddConfig.ts, components/<resource>/form-config.ts.'
---

# DynamicForm Skill

Config-driven forms built on React Hook Form + Zod. Define fields, layout, validation, dependencies, and submission in a single config object. Schema is auto-generated.

## When to Use
- Creating/modifying any resource form (CRUD pages using DataTable/DataCard, drawers, modals)
- Adding select fields backed by API (`optionsApi`) or static options
- Wiring conditional fields (`dependsOn`: hide/show/enable/disable)
- Enabling inline "quick add" for select options (`creatable` + `quickAddModule`)
- Autofilling fields from a selected option (`autoFillFields`, `copyValueTo`)
- Rendering forms in drawer / modal / inline / view mode
- Debugging Zod validation messages, `isDirty` submit-button issues, dependency template URLs

## Files Map (read these before editing)

| File | Purpose |
|------|---------|
| [ui/components/form/type.ts](ui/components/form/type.ts) | All types + `generateSchemaFromConfig()` |
| [ui/components/form/index.tsx](ui/components/form/index.tsx) | `DynamicForm` component (drawer/modal/inline) |
| [ui/components/form/form-field.tsx](ui/components/form/form-field.tsx) | per-field orchestration; per-type inputs in `field-renderer.tsx` + `field-*-inputs.tsx`, sections in `form-section.tsx`, layout in `form-content.tsx` |
| [ui/components/form/form-section.tsx](ui/components/form/form-section.tsx) | `FormSectionComponent` — section chrome + `dependsOn` gating |
| [ui/components/form/form-content.tsx](ui/components/form/form-content.tsx) | `FormContent` — lays the sections out |
| [ui/components/form/dependency-utils.ts](ui/components/form/dependency-utils.ts) | `evaluateFieldDependency`, `resolveApiTemplate` |
| [ui/components/form/custom-fields-manager.tsx](ui/components/form/custom-fields-manager.tsx) | End-user dynamic field builder |
| [hooks/use-dynamic-form.ts](hooks/use-dynamic-form.ts) | `useDynamicForm` — schema + form |
| [config/quickAddConfig.ts](config/quickAddConfig.ts) | Quick-add module registry |
| [components/<resource>/form-config.ts](components) | Per-resource form configs (the file you usually edit) |
| [docs/DYNAMIC_FORM.md](docs/DYNAMIC_FORM.md) | Full long-form documentation |

## Procedure: Add a new form for a resource

1. Create `components/<resource>/form-config.ts` exporting a `DynamicFormConfig` and `defaultValues`.
2. Use **flat `fields`** for simple CRUD; use **`sections`** when grouping >6 fields or you need icons/collapsible groups. Never mix `sections` and `fields` — pick one.
3. In the page/component, call `useDynamicForm(formConfig, defaultValues)` to get `{ form, config }`. **Define `formConfig` outside the component or `useMemo` it** — unstable refs regenerate the schema every render.
4. Render `<DynamicForm form={form} config={config} mutationHook={createMutation} onSuccess={...} />`. Prefer `mutationHook` over `onSubmit` so loading/close/reset are handled automatically.
5. For the standard CRUD page pattern, pass a `sharedOperations` object to `DataTable`/`DataCard` — it owns the create/edit/view/delete drawers internally.

See [./references/quick-start.md](./references/quick-start.md) and [./references/recipes.md](./references/recipes.md) for copy-paste examples.

## Procedure: Wire an API-driven select

1. Set `type: "select"`, `optionsApi: "/path"`. Response `{success,data,…}` is unwrapped automatically; the default mapping expects `data.items` shaped like `{ value, label, ... }`.
2. If your API shape differs, provide `itemsCreateCallback: (response) => SelectOption[]`.
3. To get the **full option object** as the form value (needed for `autoFillFields`, `dependsOn` with `matchWithProp`, or template URLs), set `labelInValue: true`.
   - When `labelInValue: true`, the form value is the **entire option object** (with `value`, `label`, and any extra fields). The schema generator produces `z.any().refine(val => val?.value?.length > 0)` so Zod accepts the object while still enforcing "required".
   - In `prepareSubmitData`, always extract the ID: `const id = typeof raw === "object" ? raw.value : raw`.
   - **Never** send the raw object to the API — it must be unwrapped before mutation.
4. For dependent selects (e.g., variants per product), use template syntax: `optionsApi: "/products/{{productId}}/variants"` plus a `dependsOn` clause. Placeholder is resolved from the watched field's value (or `value`/`_id`/`id` if it's an object). Resolves to `null` when missing → API not called.
   - A template also works inside a **query string**: `selectOptions("categories", { parentId: "{{value}}" })` is how the product form lists the sub-categories of the chosen category. Use `{{value}}` when the watched field holds a plain id — the enriched option object exposes it under `value`.
5. **A dependent select needs `clearFieldsOnChange` on its PARENT.** Once the parent changes, the child's stored value belongs to the old parent and is no longer in its own option list — the form then silently posts a stale pair and only the server notices. Declare it on the parent field:
   ```ts
   { name: "categoryId", type: "select", clearFieldsOnChange: ["subcategoryId"], … }
   ```
   It fires on **change only**, never on mount — clearing while an edit form hydrates would wipe the stored value before the user touched anything.

## Procedure: Add field dependency

```ts
{
  name: "variantId",
  type: "select",
  optionsApi: "/products/{{_id}}/variants",
  dependsOn: {
    field: "productId",        // field to watch
    matchWithProp: "_id",      // optional: extract from object value
    condition: "truthy",       // eq|ne|gt|gte|lt|lte|in|notIn|truthy|falsy
    value: undefined,          // compare value (omit for truthy/falsy)
    action: "disable",         // disable|enable|hide|show
  },
}
```

Action semantics: `disable`/`hide` apply when condition is **NOT** met; `enable`/`show` apply when condition **IS** met. `evaluateFieldDependency` enriches the watched value with the full option (from static `options` or cached API options) so `matchWithProp` works on string IDs too.

## Procedure: Make a field conditionally required

Use `requiredWhen` when a field should become both enabled **and** required based on another field's value (e.g., `variantId` is required only when the selected product has variants).

```ts
{
  name: "variantId",
  type: "select",
  label: "Variant",
  optionsApi: "/products/{{_id}}/variants",
  // Disable when product has no variants (variant_count <= 0)
  dependsOn: {
    field: "productId",
    condition: "gt",
    matchWithProp: "variant_count",
    value: 0,
    action: "disable",
  },
  // Required when product HAS variants (variant_count > 0)
  requiredWhen: {
    field: "productId",
    condition: "gt",
    matchWithProp: "variant_count",
    value: 0,
  },
}
```

- The `*` asterisk appears in the label only when the condition is met (live UI update).
- The Zod schema uses `superRefine` for cross-field validation — the field's own schema stays optional, and the refinement enforces the required check at form submission.
- `requiredWhen` shares the same `FieldDependency` shape as `dependsOn` (same `condition`/`matchWithProp`/`value` options). No `action` field is needed — action is always "require".

## Procedure: Hide/show an entire section

If you have a group of related fields that should only appear under certain conditions (e.g., "UOM Conversion" only for single products), use **section-level `dependsOn`** instead of repeating `dependsOn` on every field in the section:

```ts
{
  title: "UOM Conversion",
  icon: <span>📦</span>,
  collapsible: true,
  dependsOn: {
    field: "productType",
    value: "single",
    condition: "eq",
    action: "show",    // show section when productType === "single"
  },
  fields: [
    { name: "enableUOMConversion", type: "checkbox", ... },
    { name: "purchaseUnit.unitId", type: "select", dependsOn: { field: "enableUOMConversion", condition: "truthy", action: "show" }, ... },
    // ... more UOM fields
  ]
}
```

When the section's `dependsOn` condition is not met, the **entire section renders as `null`** — all its fields are hidden. Individual field `dependsOn` still works within the section (no need to add section-level to every field).

## Procedure: Enable inline "quick add"

1. On the select field set `creatable: true` and `quickAddModule: "<key>"`.
2. Register the module in [config/quickAddConfig.ts](config/quickAddConfig.ts):
   ```ts
   <key>: { formConfig, useMutation, title, submitLabel, optionsApiPath }
   ```
3. After successful create, options are refetched and the new item is auto-selected.

## Procedure: View / edit modes

- **View (read-only):** `viewMode={true}`. Inputs render as text, no asterisks/errors, modal shows "Close".
- **Edit:** `isEditMode={true}` + `disabledFieldsInEdit={["email","slug"]}` to lock immutable fields.
- **Skeleton while fetching entity:** `contentLoading={isLoading}`.

## Critical Conventions (DO / DON'T)

- **DO** keep the form config reference stable (top-level `const` or `useMemo`).
- **DO** set `defaultValue` on every required field, or rely on `useDynamicForm`'s auto-`""` for required text/select/radio (prevents "expected string, received undefined" errors).
- **DO** use `mutationHook` for create/update — it auto-closes the drawer/modal and resets the form.
- **DO** use dot-notation (`saleUnit.unitId`) for nested values — schema builds nested `z.object(...)` automatically.
- **DON'T** write Zod schemas by hand — they're generated. Override per-field with `zodType` only when needed.
- **DON'T** mix `sections` and `fields` in the same config.
- **DON'T** call `onSubmit` AND `mutationHook` for the same flow expecting both — `onSubmit` is treated as a transformer when `mutationHook` is set.
- **DON'T** put `dependsOn`/`autoFillFields`/`copyValueTo`/`clearFieldsOnChange` directly into rendered select props — they are stripped before passing to `AdvancedSelect`. Add any new config-only key to that destructure in `field-select-inputs.tsx`, or React warns about an unknown DOM prop.
- **DO** reach for `mode: "multiple"` on a `select` for a many-to-many field (product tags). It routes to `MultiSelect` via `AdvancedSelect` — there is no separate field type, and adding one would be wrong.

## Field Type Cheatsheet

`input` `number` `password` `textarea` `select` `radio-group` `checkbox` `switch` `date` `file-upload` `custom` `custom-fields`

`columnSpan`: `1|2|3|4|6|8|12` (responsive: full on mobile, half on sm, configured on lg).

`number` renders the shared `NumberField`, never a native `type="number"`. Always declare
`precision` — `2` for money/percentages, `0` for base-unit quantities/counts/days, omit for
conversion factors and free floats. The renderer deliberately has no default.

`date` renders the shared `DatePicker` (`ui/components/date-picker.tsx`), whose caption is
**month + year dropdowns** by default (`captionLayout="dropdown"`) — a two-year campaign or a
long-dated batch expiry is two clicks, not two dozen on the next-month arrow. ⚠ The picker
therefore always passes an explicit `startMonth`/`endMonth`: react-day-picker's own fallback for
an unbounded dropdown caption is a **date-of-birth** range (100 years back, ending this December),
which would make any date after 31 Dec unreachable. The default window is ±`DEFAULT_NAV_YEARS`
(10) around today, narrowed by `fromDate`/`toDate` when given and stretched to contain the current
value so editing an old row still opens on its month.

⚠ **Those dropdowns are the app's Radix `Select`, not react-day-picker's.** Its stock caption is a
native `<select>` held at `opacity-0` over a styled label — so the trigger picks up the theme and
the list it *opens* is the browser's OS menu, which no stylesheet can reach. `CalendarDropdown` in
`ui/components/calendar.tsx` overrides `components.Dropdown` (one override covers month **and**
year — `MonthsDropdown` and `YearsDropdown` both delegate to it). Don't "simplify" it back to the
native select; `ui/components/__tests__/calendar-caption.test.tsx` fails if one reappears. The
`dropdown_root`/`dropdown` entries in the calendar's class map are inert for the same reason.

⚠ **`nav` must keep `pointer-events-none`, and the two arrows `pointer-events-auto`.** DayPicker
renders the nav bar as an `absolute inset-x-0 top-0 w-full` sibling *before* the months — an
invisible full-width sheet lying exactly over the 32px caption row, holding only the arrows at its
two ends. Anything in-flow in that caption is buried under its empty middle. The trap is that this
was harmless for years: the native `<select>` it replaced was itself `absolute` and later in the
DOM, so it painted **above** the bar. Swapping in an ordinary button silently killed every click on
month and year, with nothing on screen to explain it. Same applies to anything else added to the
caption later.

## Validation Cheatsheet

```ts
validation: { min, max, minLength, maxLength, pattern, patternMessage, email: true, url: true, custom: (v) => string|undefined }
```
Required text fields produce `"<Label> is required"` (not Zod's default). Select required uses string + refine for friendly messages.

## Common Pitfalls

- **`labelInValue` field submits a full object instead of an ID** — `labelInValue: true` intentionally stores the whole option object in form state. Always unwrap in `prepareSubmitData`: `const id = typeof raw === "object" ? raw.value : raw`. Without `prepareSubmitData`, the full object reaches the API. The schema generator handles this by using `z.any().refine(...)` for required `labelInValue` selects so Zod won't reject the object.
- **"Submit button stays disabled"** — submit is gated on `formState.isDirty`. Either change a value or set `defaultValues` differently from current values during edit.
- **"expected string, received undefined"** — required field without `defaultValue` and not in the auto-`""` list (e.g., `number`). Add `defaultValue: 0` or remove `required`.
- **A cleared `number` field submits `null`, not `""`** — that is the `NumberField` contract, and the generated schema normalizes both to "no value". A required number that is emptied fails with `"<Label> is required"`. Don't add a `zodType` or `.nullable()` shim for it.
- **API not called for templated `optionsApi`** — placeholder value is missing/empty, OR the dependency `condition` is not met (template only resolves when `shouldDisable === false`).
- **Dependency comparing an ID string against an object property** — use `matchWithProp: "variant_count"` (the helper auto-enriches string values to full options when the dependency field is a `select`).
- **Validation message lags one keystroke** — already fixed; `FormField` reads errors via `useFormState` not props. Don't revert.
- **Quick-add modal does nothing** — `quickAddModule` key not registered in `quickAddConfig.ts`.

## References

- [./references/quick-start.md](./references/quick-start.md) — minimal new-form example
- [./references/recipes.md](./references/recipes.md) — dependency, autofill, templated API, file upload, view mode
- [./references/props-reference.md](./references/props-reference.md) — full `DynamicFormProps` and `FormFieldConfig` tables
- [docs/DYNAMIC_FORM.md](docs/DYNAMIC_FORM.md) — long-form docs (architecture diagrams, schema mapping)
