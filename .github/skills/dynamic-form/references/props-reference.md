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
| `isEditMode` | `boolean` | `false` | Combine with `disabledFieldsInEdit` |
| `disabledFieldsInEdit` | `string[]` | — | Lock fields in edit |

**Submit button is disabled when:** `isSubmitting || mutationHook?.isPending || contentLoading || !form.formState.isDirty`.

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

### Dynamic UI
`suffix` · `prefix` · `helperText` (each accepts `string` OR `(allValues) => string|undefined`)

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
