// coding-standard: maintained

import type { FieldDependencyConfig, SelectOption } from "@/ui/components/form/type";

/**
 * Public surface of `FuseAdvancedSelect`. Kept in its own module so the value
 * hook and the field components can share it without importing the component
 * (which imports them back).
 */

export interface LabelValueOption {
  label: string;
  value: string;
}

export type FuseSelectValue =
  | string
  | string[]
  | LabelValueOption
  | LabelValueOption[];

export type FuseSelectMode = "single" | "multiple";

export interface FuseAdvancedSelectProps {
  // Core select properties
  /** DOM id for the combobox input — the target of a `<Label htmlFor>`. */
  id?: string;
  value?: FuseSelectValue;
  onValueChange?: (value: FuseSelectValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  /** When true, onChange returns {label, value} object(s) instead of just value string(s) */
  labelInValue?: boolean;
  /** "single" (default) or "multiple" */
  mode?: FuseSelectMode;

  // Options — either static or API-driven
  options?: SelectOption[];
  /** API endpoint. Supports template syntax: '/products/{{productId}}/variants' */
  optionsApi?: string;

  // Dependency system (used by DynamicForm)
  dependsOn?: FieldDependencyConfig;

  // Multi-select display
  maxCount?: number;

  // Quick-add functionality
  creatable?: boolean;
  quickAddModule?: string;
  itemsCreateCallback?: (response: any) => SelectOption[];

  /** Called once on mount with the current value (used for auto-fill on initial render) */
  onMount?: (value: FuseSelectValue | undefined) => void;

  /**
   * Name of a boolean field on the fetched options that marks the default option
   * (e.g. "isDefault", "isDefaultSales"). When set and the field is empty, the
   * matching option is auto-selected once so create forms come pre-filled.
   */
  defaultFlag?: string;
}
