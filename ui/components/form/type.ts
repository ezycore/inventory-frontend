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

export interface FormFieldConfig {
  // Basic field properties
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
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
  itemsCreateCallback?: (response: any) => SelectOption[];
  // Quick-add functionality for select fields
  creatable?: boolean; // Enable quick-add modal for creating new options
  quickAddModule?: string; // Module name from quickAddConfig (e.g., 'category', 'brand')

  /**
   * Unified field dependency configuration
   * Controls field visibility and disabled state based on another field
   */
  dependsOn?: FieldDependency;

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
  /** Hide/show the entire section based on another field's value */
  dependsOn?: FieldDependency;
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

// Schema generation utility
export const generateSchemaFromConfig = (
  config: DynamicFormConfig,
): z.ZodSchema<any> => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};
  const nestedMap: Record<string, Record<string, any>> = {};

  // Get all fields - either from sections or plain fields
  const allFields: FormFieldConfig[] = [];
  if (config.sections) {
    config.sections.forEach((section) => {
      allFields.push(...section.fields);
    });
  } else if (config.fields) {
    allFields.push(...config.fields);
  }

  allFields.forEach((field) => {
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
        !field.labelInValue
      ) {
        fieldSchema = (fieldSchema as z.ZodString).min(
          1,
          `${field.label} is required`,
        );
      }
    } else if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    // Support dot-notation field names for nested schemas
    const keys = field.name.split('.');
    if (keys.length === 1) {
      schemaObject[field.name] = fieldSchema;
    } else {
      // Collect nested fields in a separate plain-object tree
      const rootKey = keys[0];
      if (!nestedMap[rootKey]) {
        nestedMap[rootKey] = {};
      }
      let current = nestedMap[rootKey];
      for (let i = 1; i < keys.length - 1; i++) {
        if (!current[keys[i]] || current[keys[i]] instanceof z.ZodType) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, any>;
      }
      current[keys[keys.length - 1]] = fieldSchema;
    }
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
  const requiredWhenFields = allFields.filter((f) => f.requiredWhen);
  if (requiredWhenFields.length === 0) {
    return baseSchema;
  }

  // Inline condition evaluator (mirrors evaluateDependencyCondition in dependency-utils.ts)
  const evalRequiredWhen = (data: Record<string, any>, field: FormFieldConfig): boolean => {
    const dep = field.requiredWhen!;
    const rawWatched = data[dep.field];
    let watched = rawWatched;
    if (dep.matchWithProp && rawWatched && typeof rawWatched === "object") {
      watched = rawWatched[dep.matchWithProp] ?? rawWatched;
    }
    const cmp = dep.value;
    switch (dep.condition ?? "eq") {
      case "eq":     return watched === cmp;
      case "ne":     return watched !== cmp;
      case "gt":     return Number(watched) > Number(cmp);
      case "gte":    return Number(watched) >= Number(cmp);
      case "lt":     return Number(watched) < Number(cmp);
      case "lte":    return Number(watched) <= Number(cmp);
      case "in":     return Array.isArray(cmp) && cmp.includes(watched);
      case "notIn":  return Array.isArray(cmp) && !cmp.includes(watched);
      case "truthy":
        if (watched === null || watched === undefined) return false;
        if (typeof watched === "string" && watched.trim() === "") return false;
        return Boolean(watched);
      case "falsy":
        if (watched === null || watched === undefined) return true;
        if (typeof watched === "string" && watched.trim() === "") return true;
        return !Boolean(watched);
      default:       return false;
    }
  };

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

// Hook to use generated schema
export const useGeneratedSchema = (config: DynamicFormConfig) => {
  return generateSchemaFromConfig(config);
};
