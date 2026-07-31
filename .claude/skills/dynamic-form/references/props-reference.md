# Props Reference

## `DynamicFormProps`

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `config` | `DynamicFormConfig` | required | `sections` OR `fields`, never both |
| `form` | `UseFormReturn<any>` | required | From `useDynamicForm` |
| `onFieldChange` | `(name, value, allValues) => void` | — | Global field-change hook |
| `viewMode` | `boolean` | `false` | Read-only render |
| `openInside` | `"drawer" \| "modal"` | — | Omit for inline |
| `open` / `onOpenChange` | — | — | Required for drawer/modal |
| `title` | `string` | — | Drawer/modal header |
| `submitLabel` / `cancelLabel` | `string` | `"Submit"` / `"Cancel"` | |
| `onSubmit` | `(data) => any` | — | Transformer when used with `mutationHook` |
| `onCancel` | `() => void` | — | Defaults to `onOpenChange(false)` |
| `isSubmitting` | `boolean` | `false` | Manual loading override |
| `mutationHook` | `{ mutate, isPending }` | — | TanStack mutation; auto-closes + resets on success |
| `onSuccess` / `onFailed` | `(result/error, data) => void` | — | Callbacks |
| `contentLoading` | `boolean` | `false` | Skeleton instead of fields |
| `modalSize` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"lg"` | |
| `actionsPlacement` | `"top" \| "bottom" \| "both"` | `"bottom"` | Drawer header vs footer |
| `resetAfterSubmit` | `boolean` | `true` | Reset form after success |
| `hideCancel` | `boolean` | `false` | |
| `hideActions` | `boolean` | `false` | No submit/cancel row at all — you render your own bar outside the `<form>` and submit via `<button type="submit" form="<form id>">`. Example: `app/(auth)/signup/page.tsx` |
| `sectionChrome` | `"card" \| "plain"` | `"card"` | `"plain"` = sections without the `Card` wrapper, one continuous column. Collapsible sections ignore it |
| `isEditMode` | `boolean` | `false` | Combine with `disabledFieldsInEdit` |
| `disabledFieldsInEdit` | `string[]` | — | Lock fields in edit |

**Submit button is disabled when:** `isSubmitting || mutationHook?.isPending || contentLoading || !form.formState.isDirty`.

**With `hideActions`, that guard is yours to reproduce.** An external button is a plain `<Button>` — it does not inherit the dirty/submitting checks. The signup page deliberately omits the `isDirty` guard so the CTA is never dead on arrival, and relies on schema validation to block an empty submit.

## `FormFieldConfig`

### Basic
`name` `type` `label` `placeholder` `required` `disabled` `hidden` `defaultValue` `description` `helperText` `className` `columnSpan`

### Validation (`validation: {...}`)
`min` `max` `minLength` `maxLength` `pattern` `patternMessage` `email` `url` `custom`

### Schema overrides
`zodType` (`"string"|"number"|"boolean"|"array"|"object"|"date"|"file"`) · `arrayOf` · `enumValues`

### Select
`options` · `optionsApi` · `itemsCreateCallback` · `labelInValue` · `mode` (`"single"|"multiple"`) · `creatable` · `quickAddModule` · `autoFillFields` · `copyValueTo` · `action: { icon, label, variant, disabled, onClick, href, renderItem }`

### Multi-select
`maxCount` · `modalPopover` · `variant`

### File upload
`accept` · `maxFiles` (default 1) · `maxSize` (default 5MB) · `multiple` · `fileTypes` · `dropzoneText` · `showPreview` (default true)

### Textarea / Number
`rows` · `step`

### Dependency
```ts
dependsOn: {
  field: string;                    // name to watch
  matchWithProp?: string;           // dotted prop path on watched value
  condition?: "eq"|"ne"|"gt"|"gte"|"lt"|"lte"|"in"|"notIn"|"truthy"|"falsy"; // default "eq"
  value?: any;                      // compare target
  action?: "disable"|"enable"|"hide"|"show"; // default "disable"
}
```

### Conditional required
```ts
// Makes the field required ONLY when condition is met.
// The asterisk renders live; Zod validates via superRefine.
// No action field — action is always "require".
requiredWhen: {
  field: string;
  matchWithProp?: string;
  condition?: "eq"|"ne"|"gt"|"gte"|"lt"|"lte"|"in"|"notIn"|"truthy"|"falsy";
  value?: any;
}
```

Combine with `dependsOn` to both enable and require the field under the same condition (see the `variantId` recipe in `SKILL.md`).

## `FormSection`

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | `string` | required | Section heading |
| `description` | `string` | — | Helper text below title |
| `icon` | `ReactNode` | — | Icon left of title |
| `fields` | `FormFieldConfig[]` | required | All fields in this section |
| `collapsible` | `boolean` | `false` | Render as collapsible card |
| `defaultOpen` | `boolean` | `true` | Initially expanded |
| `className` | `string` | — | Custom CSS classes |
| `dependsOn` | `FieldDependency` | — | Hide/show entire section based on another field |

**Section-level `dependsOn`:** When condition is not met, the entire section (card + all fields) returns `null`. Useful for grouping UOM, advanced, or conditional sections. See recipes for example.

### Dynamic UI
`suffix` · `prefix` · `helperText` (each accepts `string` OR `(allValues) => string|undefined`)

### Edit behavior
`hideInEdit` (`boolean` — field returns `null` in edit mode) · `lockedDisplay` (`(allValues) => ReactNode`)

**`lockedDisplay`** — for a `select`/`fuseSelect` whose `name` is in the form's `disabledFieldsInEdit`. In edit mode that field renders as a static read-only box showing `lockedDisplay(allValues)` **instead of mounting the select**, so its `optionsApi` is never fetched. Without it a locked id-valued select fetches its whole option list, and a Radix `<SelectValue>` still shows nothing when the current id is not on the fetched page. Derive the label from a sibling value the edit row already carries (e.g. inventory flattens the product name to `values.name`, variant attrs to `values.attributes`). Ignored for non-select fields and outside edit-lock.

### Custom
`customComponent` · `customProps` · `onChange` · `onValueChange`

## Field type → Zod (auto)

| type / `zodType` | Generated |
|------|-----------|
| `input` `textarea` `password` | `z.string()` (+ required → `min(1)`) |
| `number` | `z.number()` |
| `checkbox` `switch` (`zodType: "boolean"`) | `z.boolean()` |
| `select` single | `z.string().min(1).refine(in options)` if required, else optional refine |
| `select` multiple | `z.array(z.enum([...]))` or `z.array(z.string())` |
| `radio-group` | same as select |
| `date` | `z.string().pipe(z.coerce.date())` |
| `file-upload` (`array` + `arrayOf:"file"`) | `z.array(z.any())` |
| `custom` | `z.array(z.any()).optional()` |
| `custom-fields` | `z.array(z.object({ name, type, value?, label?, ... })).optional()` |

Dot-notation field names build nested `z.object()` automatically. Nested groups are `.optional()`.

## `useDynamicForm` defaults

- Required text/select/radio/password/textarea fields without `defaultValue` → auto `""` (avoids `expected string, received undefined`).
- Form mode: `onTouched`; `reValidateMode: onChange`.
- Schema + defaults are memoized on the `config` reference — keep config stable.
