// coding-standard: maintained
import { ReactNode } from "react";
import { Control, UseFormReturn } from "react-hook-form";

// Public form-engine API is re-exported here so `@/ui/components/form/type`
// stays the single import surface; implementations live in their own modules.
export {
  generateSchemaFromConfig,
  useGeneratedSchema,
} from "./schema";
export { stripHiddenValues } from "./strip-hidden-values";

export type FormFieldType =
  | "input"
  | "textarea"
  | "richtext"
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
  /**
   * Static read-only text rendered in place of the input when the field is
   * locked in edit mode (its name is in `disabledFieldsInEdit`). Use for
   * `select`/`fuseSelect` fields whose value is an id — the locked control
   * would otherwise fetch the whole option list just to resolve one label, and
   * a Radix `<SelectValue>` shows nothing when the current id is not on the
   * fetched page. Receives all current form values. Select/fuseSelect only.
   */
  lockedDisplay?: (values: Record<string, any>) => ReactNode;
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
  /**
   * Decimal places a `number` field rounds to, forwarded to <NumberField>.
   * Declare it per field — money `2`, quantities/counts `0`, unit conversion
   * factors and other free floats omit it. The renderer never defaults it.
   */
  precision?: number;
  /** Show +/- stepper buttons on a `number` field. */
  showSteppers?: boolean;
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
  /**
   * Suppress the form's own submit/cancel row entirely. For callers that render
   * their own action bar outside the `<form>` — a native
   * `<button type="submit" form="<the form id>">` submits it identically, since
   * the internal button only calls the same handler. Give the form an `id`.
   */
  hideActions?: boolean;
  /**
   * Chrome around each titled section. `"card"` (default) keeps the bordered
   * Card. `"plain"` drops the card so sections read as one continuous column —
   * for single-purpose pages where competing boxes add nothing.
   */
  sectionChrome?: "card" | "plain";

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
