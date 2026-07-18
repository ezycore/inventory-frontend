// coding-standard: maintained
import type { FieldDependency, FormFieldConfig } from "./type";

/**
 * Everything a field renderer (field-*-inputs.tsx) needs to draw one input.
 * FormField computes this once from its hooks and hands it to the dispatcher
 * (field-renderer.tsx) so the render functions stay pure and testable.
 */
export interface FieldRenderContext {
  field: FormFieldConfig;
  control: any;
  watch: any;
  setValue: any;
  onFieldChange?: (fieldName: string, value: any, allValues: any) => void;
  error?: string;
  effectiveDisabled: boolean;
  isEditMode: boolean;
  allValues: Record<string, any>;
  handleChange: (value: any) => void;
  /** Primary dependency + its enriched value, for optionsApi template resolution. */
  primaryDependency?: FieldDependency;
  dependencyWatchedValue: any;
  shouldDisable: boolean;
}
