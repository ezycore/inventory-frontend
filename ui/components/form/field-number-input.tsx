// coding-standard: maintained
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { cn } from "@ui/lib/utils";
import { NumberField } from "../number-field";
import { FieldAffix, affixPadding, resolveAffix } from "./field-affix";
import type { FieldRenderContext } from "./field-render-context";

/**
 * Coerce whatever the form currently holds into `NumberField`'s `number | null`.
 * Stored values may be `""` (legacy config defaults) or a string coming back
 * from an API payload; both mean "no usable number" once they fail to parse.
 */
function toFieldValue(raw: unknown): number | null {
  if (raw === "" || raw === null || raw === undefined) return null;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * `number` — the shared NumberField, never a native `type="number"`. Clearing
 * the input emits `null`; the generated schema maps that to "no value" so an
 * optional number can be emptied and a required one reports "is required".
 *
 * `precision` is intentionally NOT defaulted here: this renderer serves money,
 * counts and unit factors alike, so each config declares its own.
 */
export function renderNumberInput(ctx: FieldRenderContext): ReactNode {
  const { field, control, error, effectiveDisabled, handleChange, allValues } = ctx;
  const prefix = resolveAffix(field.prefix, allValues);
  const suffix = resolveAffix(field.suffix, allValues);

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <FieldAffix prefix={prefix} suffix={suffix}>
          <NumberField
            name={controllerField.name}
            value={toFieldValue(controllerField.value)}
            onChange={(value) => {
              controllerField.onChange(value);
              handleChange(value);
            }}
            onBlur={controllerField.onBlur}
            placeholder={field.placeholder}
            disabled={effectiveDisabled}
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.step}
            precision={field.precision}
            showSteppers={field.showSteppers}
            className={cn(
              "w-full",
              affixPadding(prefix, suffix),
              error ? "border-red-500" : "",
            )}
          />
        </FieldAffix>
      )}
    />
  );
}
