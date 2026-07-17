// coding-standard: maintained
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { AdvancedSelect } from "../advanced-select";
import { FuseAdvancedSelect } from "../fuse-advanced-select";
import { resolveApiTemplate } from "./dependency-utils";
import type { FieldRenderContext } from "./field-render-context";

/**
 * `select` and `fuseSelect`. Both resolve a `{{template}}` optionsApi against
 * the primary dependency and run the same autofill/copy-value side effects on
 * change and on mount — that shared logic lives here once.
 */

// optionsApi with a {{placeholder}} only resolves once the dependency group is
// met (shouldDisable=false) and has a value; otherwise the API isn't called.
function resolveOptionsApi(ctx: FieldRenderContext): string | undefined {
  const { field, primaryDependency, dependencyWatchedValue, shouldDisable } = ctx;
  if (field.optionsApi && primaryDependency && field.optionsApi.includes("{{")) {
    if (dependencyWatchedValue && !shouldDisable) {
      return resolveApiTemplate(field.optionsApi, dependencyWatchedValue) ?? undefined;
    }
    return undefined;
  }
  return field.optionsApi;
}

// Autofill `autoFillFields` from the selected option's matching props and copy
// the raw value to `copyValueTo` targets. Used by both onMount and onValueChange.
function buildAutoFillHandler(ctx: FieldRenderContext) {
  const { field, watch, setValue, onFieldChange } = ctx;
  const { autoFillFields, copyValueTo } = field;
  return (value: any) => {
    const allValues = watch();
    if (autoFillFields && Array.isArray(autoFillFields) && value) {
      const selectedOption =
        typeof value === "object" && value !== null ? value : null;
      if (selectedOption) {
        autoFillFields.forEach((fieldName) => {
          const valueToSet = (selectedOption as Record<string, any>)[fieldName];
          if (valueToSet !== undefined) {
            setValue(fieldName, valueToSet, { shouldValidate: false, shouldDirty: true });
            if (onFieldChange) onFieldChange(fieldName, valueToSet, allValues);
          }
        });
      }
    }
    if (copyValueTo && Array.isArray(copyValueTo) && value !== undefined) {
      copyValueTo.forEach((targetField) => {
        setValue(targetField, value, { shouldValidate: false, shouldDirty: true });
        if (onFieldChange) onFieldChange(targetField, value, allValues);
      });
    }
  };
}

export function renderSelect(ctx: FieldRenderContext): ReactNode {
  const { field, control, error, effectiveDisabled, isEditMode, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => {
        const resolvedOptionsApi = resolveOptionsApi(ctx);
        const { dependsOn, autoFillFields, copyValueTo, ...selectProps } = field;
        const handleAutoFill = buildAutoFillHandler(ctx);
        return (
          <AdvancedSelect
            value={controllerField.value}
            onMount={(mountedValue) => handleAutoFill(mountedValue)}
            onValueChange={(value) => {
              controllerField.onChange(value);
              handleChange(value);
              if (field.onValueChange) field.onValueChange(value);
            }}
            className={error ? "border-red-500" : ""}
            {...selectProps}
            optionsApi={resolvedOptionsApi}
            // Only prefill the default on create — never auto-fill on edit.
            defaultFlag={isEditMode ? undefined : field.defaultFlag}
            disabled={effectiveDisabled}
            error={error}
          />
        );
      }}
    />
  );
}

export function renderFuseSelect(ctx: FieldRenderContext): ReactNode {
  const { field, control, error, effectiveDisabled, isEditMode, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => {
        const resolvedOptionsApi = resolveOptionsApi(ctx);
        const { dependsOn, autoFillFields, copyValueTo, ...selectProps } = field;
        const handleAutoFill = buildAutoFillHandler(ctx);
        return (
          <FuseAdvancedSelect
            value={controllerField.value}
            onMount={(mountedValue) => handleAutoFill(mountedValue)}
            onValueChange={(value) => {
              controllerField.onChange(value);
              handleChange(value);
              if (field.onValueChange) field.onValueChange(value);
            }}
            className={error ? "border-red-500" : ""}
            {...selectProps}
            optionsApi={resolvedOptionsApi}
            // Only prefill the default on create — never auto-fill on edit.
            defaultFlag={isEditMode ? undefined : field.defaultFlag}
            disabled={effectiveDisabled}
            error={error}
          />
        );
      }}
    />
  );
}
