// coding-standard: maintained
import { FC, memo, useId, useMemo, type ReactNode } from "react";
import { useFormState, useWatch } from "react-hook-form";
import Link from "next/link";
import { Info } from "lucide-react";
import { cn } from "@ui/lib/utils";
import { Button } from "../button";
import { Label } from "../label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { useSelectOptions } from "@/services/api";
import type { FormFieldConfig } from "./type";
import {
  evaluateDependencyCondition,
  evaluateFieldDependencies,
  normalizeDependencies,
} from "./dependency-utils";
import { getColumnClass, getNestedValue } from "./form-utils";
import { renderField } from "./field-renderer";
import { renderFieldViewMode } from "./field-view-mode";
import type { FieldRenderContext } from "./field-render-context";

/**
 * Read-only box for a select locked in edit mode. Shows `field.lockedDisplay`
 * (a label derived from sibling form values) so the locked control never has to
 * fetch its option list to resolve one id → label. Falls back to the raw value.
 */
function renderLockedDisplay(
  field: FormFieldConfig,
  allValues: Record<string, any>,
  fieldValue: any,
): ReactNode {
  const display = field.lockedDisplay ? field.lockedDisplay(allValues) : fieldValue;
  return (
    <div className="flex min-h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      {display || "—"}
    </div>
  );
}

/**
 * One form field: resolves its live error, dependency-driven hidden/disabled
 * state, conditional-required flag, and optionsApi enrichment, then delegates
 * the actual input to field-renderer.tsx (or field-view-mode.tsx in viewMode).
 * Memoized — errors are read live via useFormState so the parent's stale
 * formState prop doesn't need comparing.
 */
export const FormField: FC<{
  field: FormFieldConfig;
  control: any;
  formState: any;
  watch: any;
  setValue: any;
  onFieldChange?: (fieldName: string, value: any, allValues: any) => void;
  viewMode?: boolean;
  disabledFieldsInEdit?: string[];
  isEditMode?: boolean;
  allFields?: FormFieldConfig[]; // All fields to look up dependency field config
}> = memo(({
  field,
  control,
  watch,
  setValue,
  onFieldChange,
  viewMode = false,
  disabledFieldsInEdit,
  isEditMode = false,
  allFields = [],
}) => {
  // IMPORTANT: subscribe to this field's error directly via useFormState.
  // The `formState` prop passed from the parent is stale (parent doesn't
  // re-render when errors change), which caused validation messages to
  // lag one keystroke behind. Reading from useFormState ensures this
  // component re-renders the moment its own error changes.
  const { errors: liveErrors } = useFormState({ control, name: field.name });
  const error = getNestedValue(liveErrors, field.name)?.message;

  // Check if field should be disabled in edit mode
  const isFieldDisabledInEdit = isEditMode && disabledFieldsInEdit?.includes(field.name);

  // Use useWatch for better performance - only subscribes to specific fields
  const fieldValue = useWatch({ control, name: field.name });

  // Watch all form values when suffix/prefix/helperText/lockedDisplay is a
  // function so they can react.
  const needsAllValues =
    typeof field.suffix === "function" ||
    typeof field.prefix === "function" ||
    typeof field.helperText === "function" ||
    typeof field.lockedDisplay === "function";
  const allValues = useWatch({ control, disabled: !needsAllValues }) || {};

  // Normalize dependsOn to an array (single condition or AND-group)
  const dependencies = useMemo(
    () => normalizeDependencies(field.dependsOn),
    [field.dependsOn]
  );
  const dependencyFieldNames = useMemo(
    () => dependencies.map((d) => d.field),
    [dependencies]
  );

  // Watch every dependency field's value (array, aligned with `dependencies`)
  const dependencyRawValues = useWatch({
    control,
    name: dependencyFieldNames.length ? dependencyFieldNames : [field.name],
    disabled: dependencies.length === 0,
  }) as any[];

  // The first (primary) dependency drives optionsApi template + select enrichment
  const primaryDependency = dependencies[0];
  const primaryRawValue = dependencyRawValues?.[0];

  // Find the primary dependency field's configuration
  const dependencyField = useMemo(() => {
    if (!primaryDependency) return null;
    return allFields.find(f => f.name === primaryDependency.field);
  }, [primaryDependency, allFields]);

  // Fetch API options for dependency field if it uses optionsApi
  // This will use cached data from TanStack Query if already fetched
  const { data: dependencyApiOptions } = useSelectOptions(
    dependencyField?.optionsApi || null,
    dependencyField?.itemsCreateCallback
  );

  // Enrich the primary dependency value with full option data if it's a select field
  const dependencyWatchedValue = useMemo(() => {
    if (!primaryDependency || !primaryRawValue) return primaryRawValue;

    // If value is already an object with all the data we need, use it
    if (typeof primaryRawValue === 'object' && primaryRawValue !== null) {
      return primaryRawValue;
    }

    // If dependency field has static options, look up from config
    if (dependencyField?.type === 'select' && dependencyField.options) {
      const fullOption = dependencyField.options.find(opt => opt.value === primaryRawValue);
      return fullOption || primaryRawValue;
    }

    // If dependency field has optionsApi, look up from API data
    if (dependencyField?.type === 'select' && dependencyApiOptions) {
      const fullOption = dependencyApiOptions.find(opt => opt.value === primaryRawValue);
      return fullOption || primaryRawValue;
    }

    return primaryRawValue;
  }, [primaryRawValue, primaryDependency, dependencyField, dependencyApiOptions]);

  // Values aligned with `dependencies`: primary uses the enriched value, the
  // rest compare their raw watched value (booleans/numbers need no enrichment).
  const evaluatedDependencyValues = useMemo(
    () =>
      dependencies.map((_, i) =>
        i === 0 ? dependencyWatchedValue : dependencyRawValues?.[i]
      ),
    [dependencies, dependencyWatchedValue, dependencyRawValues]
  );

  // Evaluate all dependencies (AND) and determine field state
  const { shouldHide, shouldDisable } = evaluateFieldDependencies(
    evaluatedDependencyValues,
    dependencies
  );

  // Watch requiredWhen dependency field for conditional required state
  const requiredWhenRawValue = useWatch({
    control,
    name: field.requiredWhen?.field ?? field.name,
    disabled: !field.requiredWhen,
  });

  // Evaluate whether the field is currently required based on requiredWhen
  const isConditionallyRequired = useMemo(() => {
    if (!field.requiredWhen) return false;
    // Reuse the already-enriched value when requiredWhen watches the same field
    // as the primary dependency.
    const val =
      field.requiredWhen.field === primaryDependency?.field
        ? dependencyWatchedValue
        : requiredWhenRawValue;
    return evaluateDependencyCondition(val, field.requiredWhen);
  }, [field.requiredWhen, primaryDependency, requiredWhenRawValue, dependencyWatchedValue]);

  // `useId` returns a colon-wrapped token (":r7:"); colons are legal in an id
  // but hostile in a CSS selector, so they come out.
  //
  // Called ABOVE the hidden-field early return below: a `dependsOn` field
  // flips between hidden and shown as the form is filled in, and a hook that
  // only runs on the shown pass changes the hook order between renders.
  const uid = useId().replace(/:/g, "");
  const fieldId = `${uid}-${field.name}`;

  // Determine effective disabled state
  const effectiveDisabled = field.disabled || isFieldDisabledInEdit || shouldDisable;

  // Hide field if dependency condition requires it
  if (field.hidden || shouldHide || (isEditMode && field.hideInEdit)) return null;

  const handleChange = (value: any) => {
    if (field.onChange) field.onChange(value);
    if (onFieldChange) {
      // Get all current form values
      const allValues = watch();
      onFieldChange(field.name, value, allValues);
    }
  };

  const renderContext: FieldRenderContext = {
    field,
    fieldId,
    control,
    watch,
    setValue,
    onFieldChange,
    error,
    effectiveDisabled,
    isEditMode,
    allValues,
    handleChange,
    primaryDependency,
    dependencyWatchedValue,
    shouldDisable,
  };

  // A locked field with an explicit display renders as static context rather
  // than an input. Selects retain this behavior by default so their option
  // lists are not fetched just to resolve one label.
  const isLockedField =
    !!isFieldDisabledInEdit &&
    (!!field.lockedDisplay || field.type === "select" || field.type === "fuseSelect");

  const fieldInput = viewMode
    ? renderFieldViewMode(field, fieldValue)
    : isLockedField
      ? renderLockedDisplay(field, allValues, fieldValue)
      : renderField(renderContext);

  return (
    <div
      className={cn(
        getColumnClass(field.columnSpan || 12),
        "w-full min-w-0 flex flex-col",
        field.className
      )}
    >
      {field.type !== "checkbox" && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Label
              htmlFor={fieldId}
              className="text-sm gap-1 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.label}
              {!viewMode && (field.required || isConditionallyRequired) && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            {field.tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`More info about ${field.label}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-center">
                  {field.tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}        <div className="w-full min-w-0 flex-1">
        {field.type === "select" && field.action ? (
          <div className="flex gap-2 w-full">
            {fieldInput}
            {!viewMode && field.action.renderItem ? (
              field.action.renderItem()
            ) : field.action.href ? (
              <Link href={field.action.href}>
                <Button
                  type="button"
                  variant={field.action.variant || "outline"}
                  size="icon"
                  disabled={field.action.disabled}
                >
                  {field.action.icon}
                </Button>
              </Link>
            ) : field.action.onClick ? (
              <Button
                type="button"
                variant={field.action.variant || "outline"}
                size="icon"
                onClick={field.action.onClick}
                disabled={field.action.disabled}
              >
                {field.action.icon}
              </Button>
            ) : null}
          </div>
        ) : (
          fieldInput
        )}
      </div>
      {(() => {
        const helperTextValue =
          typeof field.helperText === "function"
            ? field.helperText(allValues)
            : field.helperText;
        return helperTextValue ? (
          <p className="text-xs text-muted-foreground mt-1.5">{helperTextValue}</p>
        ) : null;
      })()}
      {!viewMode && error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo. Errors are read live via useFormState
  // inside the component, so we don't need to compare them here. Only
  // re-render when the field config, view mode, or edit-disabled state
  // actually changes.
  return (
    prevProps.field === nextProps.field &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.isEditMode === nextProps.isEditMode &&
    prevProps.disabledFieldsInEdit === nextProps.disabledFieldsInEdit
  );
});

FormField.displayName = "FormField";
