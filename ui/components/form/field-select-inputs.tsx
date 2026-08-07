// coding-standard: maintained
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { AdvancedSelect } from "../advanced-select";
import { FuseAdvancedSelect } from "../fuse-advanced-select";
import { resolveApiTemplate } from "./dependency-utils";
import type { FieldRenderContext } from "./field-render-context";
import type { FormFieldConfig } from "./type";
import { shouldUseSearchableSelect } from "../select-strategy";

/**
 * `select` and `fuseSelect`. Both resolve a `{{template}}` optionsApi against
 * the primary dependency and run the same autofill/copy-value side effects on
 * change and on mount — that shared logic lives here once.
 *
 * Both types render through one prop surface via one of two drop-in components:
 * the plain <AdvancedSelect> (Radix dropdown, no search) or the searchable
 * <FuseAdvancedSelect> (Fuse.js combobox). `select` picks between them
 * automatically (see shouldUseSearch) so a remote or long list gets search
 * without the author having to choose; `fuseSelect` always forces search.
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

/**
 * Reset the fields this one invalidates when it changes (`clearFieldsOnChange`).
 *
 * Deliberately NOT part of `buildAutoFillHandler`: that one also runs `onMount`,
 * and clearing a dependent field while an EDIT form is hydrating would wipe the
 * stored value before the user touched anything. This runs on change only.
 */
function buildClearHandler(ctx: FieldRenderContext) {
  const { field, watch, setValue, onFieldChange } = ctx;
  return () => {
    const targets = field.clearFieldsOnChange;
    if (!targets?.length) return;
    const allValues = watch();
    targets.forEach((targetField) => {
      setValue(targetField, undefined, {
        shouldValidate: false,
        shouldDirty: true,
      });
      if (onFieldChange) onFieldChange(targetField, undefined, allValues);
    });
  };
}

// Form and filter bar choose between the plain and searchable select the same
// way — the heuristic lives once in select-strategy.ts.
function shouldUseSearch(field: FormFieldConfig): boolean {
  return shouldUseSearchableSelect({
    mode: field.mode,
    optionsApi: field.optionsApi,
    optionCount: field.options?.length ?? 0,
  });
}

// The <Controller> body is identical for both components (FuseAdvancedSelect is
// a drop-in for AdvancedSelect), so it lives here once and takes the component
// to render. Typed against FuseAdvancedSelect, whose props are a subset of
// AdvancedSelect's — so AdvancedSelect is assignable here too.
function renderAdvancedSelect(
  ctx: FieldRenderContext,
  Component: typeof FuseAdvancedSelect,
): ReactNode {
  const { field, control, error, effectiveDisabled, isEditMode, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => {
        const resolvedOptionsApi = resolveOptionsApi(ctx);
        const {
          dependsOn,
          autoFillFields,
          copyValueTo,
          clearFieldsOnChange,
          ...selectProps
        } = field;
        const handleAutoFill = buildAutoFillHandler(ctx);
        const handleClear = buildClearHandler(ctx);
        return (
          <Component
            value={controllerField.value}
            onMount={(mountedValue) => handleAutoFill(mountedValue)}
            onValueChange={(value) => {
              controllerField.onChange(value);
              handleClear();
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

// type: "select" — auto-upgrades to the searchable variant when the list is
// remote or long (shouldUseSearch); a short static enum stays a plain dropdown.
export function renderSelect(ctx: FieldRenderContext): ReactNode {
  const Component = shouldUseSearch(ctx.field) ? FuseAdvancedSelect : AdvancedSelect;
  return renderAdvancedSelect(ctx, Component);
}

// type: "fuseSelect" — an explicit opt-in that always uses the searchable
// combobox (e.g. a short static list an author still wants typeahead on).
export function renderFuseSelect(ctx: FieldRenderContext): ReactNode {
  return renderAdvancedSelect(ctx, FuseAdvancedSelect);
}
