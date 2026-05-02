---
name: dynamic-form
description: 'Build, edit, debug, or audit config-driven forms in EasyStock frontend using DynamicForm + useDynamicForm + auto-generated Zod schema. USE WHEN: creating a new resource form (brand/category/product/customer/etc.), adding fields/sections, wiring up select with optionsApi, configuring field dependencies (dependsOn), enabling quick-add creatable selects, autofill from selected option, drawer/modal/inline rendering, view-mode (read-only), edit-mode disabled fields, file upload, custom-fields manager, troubleshooting "X is required" / "expected string, received undefined" Zod errors, dot-notation nested fields, template optionsApi like /products/{{productId}}/variants, suffix/prefix/helperText functions. Touches files under ui/components/form/, hooks/use-dynamic-form.ts, config/quickAddConfig.ts, components/<resource>/form-config.ts.'
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
| [ui/components/form/helper.tsx](ui/components/form/helper.tsx) | `FormField` (per-type rendering), `FormSectionComponent`, `FormContent` |
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
4. For dependent selects (e.g., variants per product), use template syntax: `optionsApi: "/products/{{productId}}/variants"` plus a `dependsOn` clause. Placeholder is resolved from the watched field's value (or `value`/`_id`/`id` if it's an object). Resolves to `null` when missing → API not called.

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
- **DON'T** put `dependsOn`/`autoFillFields`/`copyValueTo` directly into rendered select props — they are stripped before passing to `AdvancedSelect`.

## Field Type Cheatsheet

`input` `number` `password` `textarea` `select` `radio-group` `checkbox` `switch` `date` `file-upload` `custom` `custom-fields`

`columnSpan`: `1|2|3|4|6|8|12` (responsive: full on mobile, half on sm, configured on lg).

## Validation Cheatsheet

```ts
validation: { min, max, minLength, maxLength, pattern, patternMessage, email: true, url: true, custom: (v) => string|undefined }
```
Required text fields produce `"<Label> is required"` (not Zod's default). Select required uses string + refine for friendly messages.

## Common Pitfalls

- **"Submit button stays disabled"** — submit is gated on `formState.isDirty`. Either change a value or set `defaultValues` differently from current values during edit.
- **"expected string, received undefined"** — required field without `defaultValue` and not in the auto-`""` list (e.g., `number`). Add `defaultValue: 0` or remove `required`.
- **API not called for templated `optionsApi`** — placeholder value is missing/empty, OR the dependency `condition` is not met (template only resolves when `shouldDisable === false`).
- **Dependency comparing an ID string against an object property** — use `matchWithProp: "variant_count"` (the helper auto-enriches string values to full options when the dependency field is a `select`).
- **Validation message lags one keystroke** — already fixed; `FormField` reads errors via `useFormState` not props. Don't revert.
- **Quick-add modal does nothing** — `quickAddModule` key not registered in `quickAddConfig.ts`.

## References

- [./references/quick-start.md](./references/quick-start.md) — minimal new-form example
- [./references/recipes.md](./references/recipes.md) — dependency, autofill, templated API, file upload, view mode
- [./references/props-reference.md](./references/props-reference.md) — full `DynamicFormProps` and `FormFieldConfig` tables
- [docs/DYNAMIC_FORM.md](docs/DYNAMIC_FORM.md) — long-form docs (architecture diagrams, schema mapping)
