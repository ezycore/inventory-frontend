// coding-standard: maintained
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { DatePicker } from "../date-picker";
import type { FieldRenderContext } from "./field-render-context";

/** `date`, `custom` (customComponent or registered renderer), `custom-fields`. */

export function renderDate(ctx: FieldRenderContext): ReactNode {
  const { field, control, effectiveDisabled, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <DatePicker
          date={controllerField.value}
          onSelect={(value) => {
            controllerField.onChange(value);
            handleChange(value);
          }}
          placeholder={field.placeholder || "Pick a date"}
          outputFormat={field.outputFormat}
          disabled={effectiveDisabled}
        />
      )}
    />
  );
}

// Look up a custom renderer registered on window.__customFieldRenderers by name.
function getRegisteredRenderer(name: string): React.ComponentType<any> | null {
  if (typeof window !== "undefined" && (window as any).__customFieldRenderers) {
    return (window as any).__customFieldRenderers[name] ?? null;
  }
  return null;
}

export function renderCustom(ctx: FieldRenderContext): ReactNode {
  const { field, control, setValue, error, handleChange } = ctx;

  // First check for a customComponent prop.
  if (field.customComponent) {
    const CustomComponent = field.customComponent;
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: controllerField }) => (
          <CustomComponent
            {...controllerField}
            {...field.customProps}
            control={control}
            setValue={setValue}
            onChange={(value: any) => {
              controllerField.onChange(value);
              handleChange(value);
            }}
            error={error}
          />
        )}
      />
    );
  }

  // Otherwise, a custom field renderer registered by field name.
  const CustomRenderer = getRegisteredRenderer(field.name);
  if (CustomRenderer) {
    return (
      <CustomRenderer
        control={control}
        name={field.name}
        maxCount={field.maxCount}
        error={error}
      />
    );
  }
  return null;
}

export function renderCustomFields(ctx: FieldRenderContext): ReactNode {
  const { field, control } = ctx;

  // Component-registry approach — check for a registered renderer.
  const CustomRenderer = getRegisteredRenderer(field.name);
  if (CustomRenderer) {
    return (
      <CustomRenderer
        control={control}
        name={field.name}
        maxCount={field.maxCount}
        error={ctx.error}
      />
    );
  }

  // Fallback placeholder when no custom renderer is found.
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <div className="p-4 border-2 border-dashed border-muted rounded-lg">
          <p className="text-center text-muted-foreground">
            Custom field: {field.name}
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Type: {field.type} | Register a custom renderer to display this field
          </p>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Current value: {JSON.stringify(controllerField.value) || "[]"}
          </p>
        </div>
      )}
    />
  );
}
