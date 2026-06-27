import { ReactNode } from "react";
import { Control, UseFormReturn } from "react-hook-form";
import { z } from "zod";

export type FormFieldType =
  | "input"
  | "textarea"
  | "select"
  | "fuseSelect"
  | "radio-group"
  | "checkbox"
  | "switch"
  | "file-upload"
  | "date"
  | "number"
  | "custom"
  | "custom-fields"
  | "password";

export type ColumnSpan = 1 | 2 | 3 | 4 | 6 | 8 | 12;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Secondary descriptive text. Shown when the field renders options as cards. */
  description?: string;
}

/**
 * Dependency condition operators for field dependencies
 */
export type DependencyCondition = 
  | "eq"     // equals
  | "ne"     // not equals
  | "gt"     // greater than
  | "gte"    // greater than or equal
  | "lt"     // less than
  | "lte"    // less than or equal
  | "in"     // value in array
  | "notIn"  // value not in array
  | "truthy" // any truthy value
  | "falsy";  // any falsy value

/**
 * Actions to take when dependency condition is met
 */
export type DependencyAction = "disable" | "hide" | "show" | "enable";

/**
 * Unified field dependency configuration
 * 
 * @example
 * // Simple disable when field is empty
 * dependsOn: {
 *   field: 'productId',
 *   condition: 'truthy',
 *   action: 'disable'
 * }
 * 
 * @example
 * // Hide field when another field equals specific value
 * dependsOn: {
 *   field: 'discountType',
 *   value: 'percentage',
 *   condition: 'eq',
 *   action: 'show'
 * }
 * 
 * @example
 * // Extract property from complex object (like select options)
 * dependsOn: {
 *   field: 'category',
 *   matchWithProp: '_id',
 *   condition: 'truthy',
 *   action: 'disable'
 * }
 */
export interface FieldDependency {
  /** Field name to watch */
  field: string;
  /** Property to extract from field value (useful for objects like {label, value, _id}) */
  matchWithProp?: string;
  /** Comparison operator (default: 'eq') */
  condition?: DependencyCondition;
  /** Value to compare against (optional for truthy/falsy) */
  value?: any;
  /** Action to take when condition matches (default: 'disable') */
  action?: DependencyAction;
}

/**
 * Field dependency configuration: a single condition, or an array of
 * conditions combined with AND semantics (every condition must pass).
 * When an array is given, the `action` (show/hide/disable/enable) is taken
 * from the FIRST entry — keep the same action intent across the group.
 * Note: select-option enrichment / `optionsApi` template resolution only
 * applies to the FIRST (primary) dependency; extra conditions compare the
 * raw watched value (ideal for booleans/numbers).
 *
 * @example
 * dependsOn: [
 *   { field: "addToInventory", condition: "truthy", action: "show" },
 *   { field: "hasExpiry", condition: "truthy" },
 *   { field: "openingStock", condition: "gt", value: 0 },
 * ]
 */
export type FieldDependencyConfig = FieldDependency | FieldDependency[];

export interface FormFieldConfig {
  // Basic field properties
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  hideInEdit?: boolean; // Hide this field when the form is in edit mode
  defaultValue?: any; // Default value for the field
  description?: string;
  mode?: "single" | "multiple"; // For select fields
  // Layout properties
  columnSpan?: ColumnSpan; // Grid columns to span (out of 12)
  className?: string;

  // Validation
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
    custom?: (value: any) => string | undefined;
    email?: boolean;
    url?: boolean;
  };

  // Schema generation properties
  zodType?:
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "object"
    | "date"
    | "file";
  arrayOf?: "string" | "number" | "file" | "any";
  enumValues?: readonly string[];
  // Type-specific properties
  labelInValue?: boolean; // For select fields
  options?: SelectOption[]; // For select fields (static options)
  /**
   * Layout for `radio-group` options.
   * - "inline" (default): compact horizontal radios with labels only.
   * - "cards": each option renders as a selectable bordered card showing the
   *   label, optional `description`, and optional `icon`.
   */
  optionLayout?: "inline" | "cards";
  /**
   * API endpoint for select field options
   * Supports template syntax with {{fieldName}} placeholders
   * Example: '/products/{{productId}}/variants'
   */
  optionsApi?: string;
  /**
   * Name of a boolean field on the fetched options that marks the default option
   * (e.g. "isDefault", "isDefaultSales"). When set and the field has no value, the
   * matching option is auto-selected once so create forms come pre-filled.
   * Requires the flag to be included in the `optionsApi` `fields=` projection.
   */
  defaultFlag?: string;
  itemsCreateCallback?: (response: any) => SelectOption[];
  // Quick-add functionality for select fields
  creatable?: boolean; // Enable quick-add modal for creating new options
  quickAddModule?: string; // Module name from quickAddConfig (e.g., 'category', 'brand')

  /**
   * Unified field dependency configuration
   * Controls field visibility and disabled state based on another field.
   * Accepts a single condition or an array (AND) — see {@link FieldDependencyConfig}.
   */
  dependsOn?: FieldDependencyConfig;

  /**
   * Makes this field required only when the specified condition is met.
   * Works independently of dependsOn — use this when the field is enabled
   * by a dependency and should also become required at the same time.
   *
   * @example
   * // variantId is required only when the selected product has variants
   * requiredWhen: {
   *   field: 'productId',
   *   matchWithProp: 'variant_count',
   *   condition: 'gt',
   *   value: 0,
   * }
   */
  requiredWhen?: FieldDependency;

  /**
   * Longer explanatory text shown in a hover tooltip via an info icon next to
   * the label. Use this (instead of `helperText`) for guidance that would
   * otherwise clutter the form under every field.
   */
  tooltip?: string;

  rows?: number; // For textarea
  accept?: string; // For file upload
  maxFiles?: number; // For file upload
  maxSize?: number; // For file upload (in bytes)
  multiple?: boolean; // For file upload and select
  step?: number; // For number inputs
  helperText?: string | ((values: Record<string, any>) => string | undefined);

  // Static suffix/prefix appended/prepended inside the input.
  // Useful for unit labels (e.g., "pcs", "$", "1 box = 10 pcs").
  // Function form receives the current form values for dynamic computation.
  suffix?: string | ((values: Record<string, any>) => string | undefined);
  prefix?: string | ((values: Record<string, any>) => string | undefined);

  // Multi-select specific properties
  maxCount?: number; // Maximum number of selected items
  modalPopover?: boolean; // Use modal popover for multi-select
  variant?: "default" | "secondary" | "destructive" | "inverted"; // Multi-select variant

  // File upload specific
  fileTypes?: string[]; // Array of allowed file extensions ['jpg', 'png', 'pdf']
  dropzoneText?: string; // Custom dropzone text
  showPreview?: boolean; // Show file preview (default: true)

  // Advanced select action properties
  action?: {
    icon?: ReactNode;
    label?: string;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    disabled?: boolean;
    onClick?: (props?: any) => void;
    href?: string; // For Next.js Link navigation (opens modal via intercepting routes)
    renderItem?: () => ReactNode; // Priority: if provided, other props ignored
  };

  // Custom properties
  customComponent?: React.ComponentType<any>;
  customProps?: Record<string, any>;

  // Auto-fill dependent fields (for select fields)
  // Array of field names that will be auto-filled from the selected option's matching properties
  // Example: autoFillFields: ['costPrice', 'price', 'salePrice']
  autoFillFields?: string[];

  // Copy the selected value to other fields (supports dot-notation paths)
  // Example: copyValueTo: ['saleUnit.unitId'] will set saleUnit.unitId to this field's value
  copyValueTo?: string[];

  // Output format for `date` fields (date-fns tokens). Forwarded to <DatePicker>.
  // Omit for a full ISO datetime; use "yyyy-MM-dd" to emit a local date-only value.
  outputFormat?: string;

  // Change handlers
  onChange?: (value: any) => void;
  onValueChange?: (value: any) => void; // For select components
}

export interface FormSection {
  title: string;
  description?: string;
  icon?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  fields: FormFieldConfig[];
  className?: string;
  /** Hide/show the entire section based on another field's value (single or AND-array) */
  dependsOn?: FieldDependencyConfig;
  /**
   * Optional content rendered on the right side of the section header
   * (e.g. a "Track stock" toggle). Receives the form `control` so it can
   * bind to a field via a Controller. In collapsible sections it sits left of
   * the collapse chevron and its clicks do not toggle the section.
   */
  headerAction?: (ctx: { control: Control<any> }) => ReactNode;
}

export interface DynamicFormConfig {
  // Either sections OR plain fields - not both
  sections?: FormSection[];
  fields?: FormFieldConfig[];
  layout?: {
    maxColumns?: number; // Default grid columns (default: 12)
    gap?: number; // Gap between fields
    sectionSpacing?: number; // Space between sections
  };
  // Auto-generated schema
  generateSchema?: boolean; // Whether to auto-generate Zod schema (default: true)
}

export interface DynamicFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  config: DynamicFormConfig;
  form: UseFormReturn<any>; // Complete form object from useForm
  className?: string;
  onFieldChange?: (fieldName: string, value: any, allValues: any) => void;

  // View mode - makes form read-only for viewing data
  viewMode?: boolean;

  // Container mode props
  openInside?: "drawer" | "modal";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: (data?: any) => any; // Can transform data before submission
  onCancel?: () => void;
  isSubmitting?: boolean;
  resetAfterSubmit?: boolean;
  hideCancel?: boolean;

  // Mutation-based form submission (alternative to onSubmit)
  mutationHook?: {
    mutate: (
      data: any,
      options?: {
        onSuccess?: (result: any) => void;
        onError?: (error: any) => void;
      },
    ) => void;
    isPending: boolean;
  }; // TanStack Query mutation hook result (e.g., useCreateProduct())
  onSuccess?: (result: any, data: any) => void; // Called on successful submission
  onFailed?: (error: any, data: any) => void; // Called on submission error

  // Content loading state
  contentLoading?: boolean; // Show skeleton instead of form when loading data

  // Modal specific props
  modalSize?: "sm" | "md" | "lg" | "xl" | "full";

  // Regular form actions props
  actionsPlacement?: "top" | "bottom" | "both";

  // Disabled fields in edit mode
  disabledFieldsInEdit?: string[];
  isEditMode?: boolean;
}

// Read a (possibly dot-notation) path out of a values object.
const getValueByPath = (
  obj: Record<string, any> | undefined,
  path: string,
): any => {
  if (!obj) return undefined;
  return path.split(".").reduce((acc: any, k) => (acc == null ? acc : acc[k]), obj);
};

// Inline dependency-condition evaluator — mirrors evaluateDependencyCondition in
// dependency-utils.ts. Kept inline (not imported) to avoid a runtime circular
// import: dependency-utils imports types from this module.
const evalDepCondition = (watched: any, dep: FieldDependency): boolean => {
  let v = watched;
  if (dep.matchWithProp && v && typeof v === "object") {
    v = dep.matchWithProp.includes(".")
      ? dep.matchWithProp.split(".").reduce((a: any, p) => a?.[p], v)
      : (v[dep.matchWithProp] ?? v);
  }
  const cmp = dep.value;
  switch (dep.condition ?? "eq") {
    case "eq":    return v === cmp;
    case "ne":    return v !== cmp;
    case "gt":    return Number(v) > Number(cmp);
    case "gte":   return Number(v) >= Number(cmp);
    case "lt":    return Number(v) < Number(cmp);
    case "lte":   return Number(v) <= Number(cmp);
    case "in":    return Array.isArray(cmp) && cmp.includes(v);
    case "notIn": return Array.isArray(cmp) && !cmp.includes(v);
    case "truthy":
      if (v === null || v === undefined) return false;
      if (typeof v === "string" && v.trim() === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return Boolean(v);
    case "falsy":
      if (v === null || v === undefined) return true;
      if (typeof v === "string" && v.trim() === "") return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return !Boolean(v);
    default:      return false;
  }
};

// True when a dependsOn group (single condition or AND-array) hides its target
// given the current values. Only hide/show actions affect visibility; the action
// is taken from the first entry (matches evaluateFieldDependencies semantics).
const dependencyHides = (
  values: Record<string, any>,
  dep?: FieldDependencyConfig,
): boolean => {
  if (!dep) return false;
  const list = Array.isArray(dep) ? dep : [dep];
  if (!list.length) return false;
  const action = list[0].action ?? "disable";
  if (action !== "hide" && action !== "show") return false;
  const allMet = list.every((d) =>
    evalDepCondition(getValueByPath(values, d.field), d),
  );
  return !allMet;
};

// Mirror of the render-time visibility check (helper.tsx:209). A field is hidden
// for schema purposes when statically hidden, or when its own / its section's
// dependsOn resolves to hidden against the current values. With no values (the
// static build) only statically-hidden fields are treated as hidden.
const isFieldHiddenForSchema = (
  field: FormFieldConfig,
  section: FormSection | undefined,
  values?: Record<string, any>,
): boolean => {
  if (field.hidden === true) return true;
  if (!values) return false;
  if (dependencyHides(values, field.dependsOn)) return true;
  if (section && dependencyHides(values, section.dependsOn)) return true;
  return false;
};

// Schema generation utility
//
// `values` makes the schema visibility-aware: a field hidden (statically, or via
// its / its section's dependsOn) keeps its key as `z.any().optional()` so its
// value still passes through on submit, but skips all validation — an invisible
// field can never block the form. Pass the live form values (the resolver does
// this) to honor conditional show/hide; omit them for a plain static schema.
export const generateSchemaFromConfig = (
  config: DynamicFormConfig,
  values?: Record<string, any>,
): z.ZodSchema<any> => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};
  const nestedMap: Record<string, Record<string, any>> = {};

  // Flatten fields, retaining section context for section-level dependsOn.
  const fieldEntries: { field: FormFieldConfig; section?: FormSection }[] = [];
  if (config.sections) {
    config.sections.forEach((section) =>
      section.fields.forEach((field) => fieldEntries.push({ field, section })),
    );
  } else if (config.fields) {
    config.fields.forEach((field) => fieldEntries.push({ field }));
  }

  // Place a built field schema at its (possibly dot-notation) name.
  const placeFieldSchema = (name: string, fieldSchema: z.ZodTypeAny) => {
    const keys = name.split(".");
    if (keys.length === 1) {
      schemaObject[name] = fieldSchema;
      return;
    }
    const rootKey = keys[0];
    if (!nestedMap[rootKey]) nestedMap[rootKey] = {};
    let current = nestedMap[rootKey];
    for (let i = 1; i < keys.length - 1; i++) {
      if (!current[keys[i]] || current[keys[i]] instanceof z.ZodType) {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, any>;
    }
    current[keys[keys.length - 1]] = fieldSchema;
  };

  fieldEntries.forEach(({ field, section }) => {
    // Hidden field: keep the key (value survives submit) but skip validation.
    if (isFieldHiddenForSchema(field, section, values)) {
      placeFieldSchema(field.name, z.any().optional());
      return;
    }

    let fieldSchema: z.ZodTypeAny;

    // Determine base schema type
    switch (field.zodType || field.type) {
      case "number":
        let numSchema = z.number();
        if (field.validation?.min !== undefined) {
          numSchema = numSchema.min(
            field.validation.min,
            `Minimum value is ${field.validation.min}`,
          );
        }
        if (field.validation?.max !== undefined) {
          numSchema = numSchema.max(
            field.validation.max,
            `Maximum value is ${field.validation.max}`,
          );
        }
        fieldSchema = numSchema;
        break;

      case "boolean":
      case "checkbox":
      case "switch":
        fieldSchema = z.boolean();
        break;

      case "array":
      case "file-upload":
        let arraySchema: z.ZodArray<any>;
        if (field.arrayOf === "file" || field.type === "file-upload") {
          arraySchema = z.array(z.any()); // File objects
        } else if (field.arrayOf === "string") {
          arraySchema = z.array(z.string());
        } else if (field.arrayOf === "number") {
          arraySchema = z.array(z.number());
        } else {
          arraySchema = z.array(z.any());
        }
        if (field.validation?.min !== undefined) {
          arraySchema = arraySchema.min(
            field.validation.min,
            `Minimum ${field.validation.min} items required`,
          );
        }
        if (field.validation?.max !== undefined) {
          arraySchema = arraySchema.max(
            field.validation.max,
            `Maximum ${field.validation.max} items allowed`,
          );
        }
        fieldSchema = arraySchema;
        break;

      case "date":
        fieldSchema = z.string().pipe(z.coerce.date());
        break;

      case "radio-group":
      case "select":
        if (field.mode === "multiple") {
          // Multi-select should be array of strings
          if (field.enumValues) {
            fieldSchema = z.array(
              z.enum(field.enumValues as [string, ...string[]]),
            );
          } else if (field.options) {
            const values = field.options.map((opt) => opt.value) as [
              string,
              ...string[],
            ];
            fieldSchema = z.array(z.enum(values));
          } else {
            fieldSchema = z.array(z.string());
          }
        } else if (field.labelInValue) {
          // labelInValue: true — form stores the full option object, not a plain ID string.
          // Validate that a selection was made by checking the nested .value property.
          const labelInValueLabel = field.label ?? "option";
          if (field.required) {
            fieldSchema = z.any().refine(
              (val) =>
                val !== null &&
                val !== undefined &&
                val !== "" &&
                (typeof val === "object"
                  ? typeof val.value === "string" && val.value.length > 0
                  : typeof val === "string" && val.length > 0),
              { message: `Please select ${labelInValueLabel}` },
            );
          } else {
            fieldSchema = z.any().optional();
          }
        } else {
          // Single select — use string + refine instead of z.enum() so Zod
          // produces readable messages instead of
          // "Invalid option: expected one of 'PHARMACY'|'GROCERY_STORE'|..."
          const selectValues: string[] = field.enumValues
            ? (field.enumValues as string[])
            : field.options
              ? field.options.map((opt) => opt.value)
              : [];
          const selectLabel = field.label ?? "option";

          if (selectValues.length > 0) {
            if (field.required) {
              // Required: empty string fails first with a friendly message
              fieldSchema = z
                .string()
                .min(1, `Please select ${selectLabel}`)
                .refine((val) => selectValues.includes(val), {
                  message: `Please select a valid ${selectLabel.toLowerCase()}`,
                });
            } else {
              // Optional: allow empty/undefined; if a value is given it must be valid
              fieldSchema = z
                .string()
                .refine((val) => !val || selectValues.includes(val), {
                  message: `Please select a valid ${selectLabel.toLowerCase()}`,
                });
            }
          } else {
            fieldSchema = z.string();
          }
        }
        break;

      case "custom":
        // Custom fields can contain any type of data (array of field definitions)
        fieldSchema = z.array(z.any()).optional();
        break;

      case "custom-fields":
        // Custom fields array with field definitions and values
        fieldSchema = z
          .array(
            z.object({
              name: z.string(),
              type: z.string(),
              value: z.any().optional(),
              label: z.string().optional(),
              placeholder: z.string().optional(),
              required: z.boolean().optional(),
              options: z
                .array(
                  z.object({
                    value: z.string(),
                    label: z.string(),
                  }),
                )
                .optional(),
            }),
          )
          .optional();
        break;

      default:
      case "string":
      case "input":
      case "textarea":
        let stringSchema = z.string();
        // "Required" check must come FIRST so an empty submission shows
        // "X is required" before any length/pattern check fires.
        if (field.required) {
          const isTextLike =
            field.zodType !== "number" &&
            field.zodType !== "boolean" &&
            field.zodType !== "array" &&
            field.zodType !== "date";
          if (isTextLike) {
            stringSchema = stringSchema.min(1, `${field.label} is required`);
          }
        }
        if (field.validation?.minLength !== undefined && field.validation.minLength > 1) {
          stringSchema = stringSchema.min(
            field.validation.minLength,
            `Minimum ${field.validation.minLength} characters required`,
          );
        }
        if (field.validation?.maxLength !== undefined) {
          stringSchema = stringSchema.max(
            field.validation.maxLength,
            `Maximum ${field.validation.maxLength} characters allowed`,
          );
        }
        if (field.validation?.pattern) {
          stringSchema = stringSchema.regex(
            field.validation.pattern,
            field.validation.patternMessage ?? "Invalid format",
          );
        }
        if (field.validation?.email) {
          stringSchema = stringSchema.email("Invalid email address");
        }
        if (field.validation?.url) {
          // Allow empty string or valid URL
          stringSchema = stringSchema.refine(
            (val) =>
              !val || val === "" || z.string().url().safeParse(val).success,
            { message: "Invalid URL" },
          );
        }
        fieldSchema = stringSchema;
        break;
    }

    // Handle required/optional
    if (field.required) {
      const isStringField =
        (field.type === "input" || field.type === "textarea") &&
        field.zodType !== "number" &&
        field.zodType !== "boolean" &&
        field.zodType !== "array" &&
        field.zodType !== "date";

      // String fields already had required injected inside the switch block above.
      // Only add it here for non-string required fields that don't have options/enums
      // (selects handle required inline too; labelInValue selects use z.any().refine()).
      if (
        !isStringField &&
        !field.options &&
        !field.enumValues &&
        !field.labelInValue &&
        fieldSchema instanceof z.ZodString
      ) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`);
      }
    } else if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    placeFieldSchema(field.name, fieldSchema);
  });

  // Recursively build z.object() from a nested plain-object map
  const buildZodObject = (map: Record<string, any>): z.ZodObject<any> => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [key, value] of Object.entries(map)) {
      if (value instanceof z.ZodType) {
        shape[key] = value;
      } else {
        // Nested object group — make it optional so partial fills don't fail
        shape[key] = buildZodObject(value).optional();
      }
    }
    return z.object(shape);
  };

  // Merge nested groups into schemaObject
  for (const [key, nested] of Object.entries(nestedMap)) {
    schemaObject[key] = buildZodObject(nested).optional();
  }

  const baseSchema = z.object(schemaObject);

  // Handle requiredWhen — fields that become required based on another field's value.
  // Uses superRefine for cross-field validation (avoids circular dep with dependency-utils.ts).
  const requiredWhenFields = fieldEntries
    .filter(
      ({ field, section }) =>
        field.requiredWhen && !isFieldHiddenForSchema(field, section, values),
    )
    .map((e) => e.field);
  if (requiredWhenFields.length === 0) {
    return baseSchema;
  }

  // Reuse the shared inline condition evaluator (dot-path aware).
  const evalRequiredWhen = (
    data: Record<string, any>,
    field: FormFieldConfig,
  ): boolean =>
    evalDepCondition(
      getValueByPath(data, field.requiredWhen!.field),
      field.requiredWhen!,
    );

  return baseSchema.superRefine((data, ctx) => {
    for (const field of requiredWhenFields) {
      if (!evalRequiredWhen(data as Record<string, any>, field)) continue;
      const fieldValue = (data as Record<string, any>)[field.name];
      const isEmpty =
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === "" ||
        (typeof fieldValue === "object" &&
          fieldValue !== null &&
          typeof fieldValue.value === "string" &&
          fieldValue.value === "");
      if (isEmpty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Please select ${field.label}`,
          path: [field.name],
        });
      }
    }
  });
};

// Delete a (possibly dot-notation) path from an object, then prune any parent
// objects left empty by the removal. Pruning is what keeps a nested group like
// `salesTax` from being submitted as `{}` — an empty subdoc would otherwise be
// $set on the backend, clobbering sibling keys and re-triggering schema defaults.
const deletePathAndPrune = (obj: Record<string, any>, path: string): void => {
  const keys = path.split(".");
  // Walk to the leaf, remembering each parent so we can prune upward.
  const parents: { container: Record<string, any>; key: string }[] = [];
  let current: any = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current == null || typeof current !== "object") return;
    parents.push({ container: current, key: keys[i] });
    current = current[keys[i]];
  }
  if (current == null || typeof current !== "object") return;
  delete current[keys[keys.length - 1]];

  // Prune now-empty parents from the leaf up.
  for (let i = parents.length - 1; i >= 0; i--) {
    const { container, key } = parents[i];
    const child = container[key];
    if (child && typeof child === "object" && Object.keys(child).length === 0) {
      delete container[key];
    } else {
      break;
    }
  }
};

// Remove values for fields that are conditionally hidden (their own or their
// section's `dependsOn` resolves to hidden) so they never reach the payload.
// Statically `hidden: true` fields are intentional plumbing (e.g. a value carried
// by a header toggle) and are preserved; disabled-but-visible fields are too,
// since `dependencyHides` only reacts to hide/show actions. Returns a new object —
// the input (live form values) is never mutated.
export const stripHiddenValues = (
  config: DynamicFormConfig,
  values: Record<string, any>,
): Record<string, any> => {
  const result = structuredClone(values);

  const fieldEntries: { field: FormFieldConfig; section?: FormSection }[] = [];
  if (config.sections) {
    config.sections.forEach((section) =>
      section.fields.forEach((field) => fieldEntries.push({ field, section })),
    );
  } else if (config.fields) {
    config.fields.forEach((field) => fieldEntries.push({ field }));
  }

  for (const { field, section } of fieldEntries) {
    if (field.hidden === true) continue; // intentional plumbing — keep
    const hidden =
      dependencyHides(values, field.dependsOn) ||
      (section ? dependencyHides(values, section.dependsOn) : false);
    if (hidden) deletePathAndPrune(result, field.name);
  }

  return result;
};

// Hook to use generated schema
export const useGeneratedSchema = (config: DynamicFormConfig) => {
  return generateSchemaFromConfig(config);
};
