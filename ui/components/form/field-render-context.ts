// coding-standard: maintained
import type { FieldDependency, FormFieldConfig } from "./type";

/**
 * Everything a field renderer (field-*-inputs.tsx) needs to draw one input.
 * FormField computes this once from its hooks and hands it to the dispatcher
 * (field-renderer.tsx) so the render functions stay pure and testable.
 */
export interface FieldRenderContext {
  field: FormFieldConfig;
  /**
   * DOM id for this field's control, and the target of the `<Label htmlFor>`
   * FormField renders above it. Every renderer must put it on the element the
   * label should focus — otherwise the label points at nothing, which is the
   * state all of them were in: clicking a label focused the wrapper div and a
   * screen reader announced an unlabelled input.
   *
   * Built from `useId()` + the field name rather than the name alone, because
   * two forms mounted at once (an inline form behind a dialog) would otherwise
   * both claim `id="name"` and the label would resolve to whichever rendered
   * first.
   */
  fieldId: string;
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
