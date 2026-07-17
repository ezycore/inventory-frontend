// coding-standard: maintained
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { cn } from "@ui/lib/utils";
import { Checkbox } from "../checkbox";
import { Label } from "../label";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Switch } from "../switch";
import type { FieldRenderContext } from "./field-render-context";

/** `checkbox`, `switch`, `radio-group` (inline or card layout). */

export function renderCheckbox(ctx: FieldRenderContext): ReactNode {
  const { field, control, effectiveDisabled, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.name}
            checked={controllerField.value ?? field.defaultValue ?? false}
            onCheckedChange={(checked) => {
              controllerField.onChange(checked);
              handleChange(checked);
            }}
            disabled={effectiveDisabled}
          />
          <Label htmlFor={field.name}>{field.label}</Label>
        </div>
      )}
    />
  );
}

export function renderSwitch(ctx: FieldRenderContext): ReactNode {
  const { field, control, effectiveDisabled, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <div className="flex items-center space-x-2">
          <Switch
            id={field.name}
            checked={controllerField.value}
            onCheckedChange={(checked) => {
              controllerField.onChange(checked);
              handleChange(checked);
            }}
            disabled={effectiveDisabled}
          />
          {/* <Label htmlFor={field.name}>{field.label}</Label> */}
        </div>
      )}
    />
  );
}

export function renderRadioGroup(ctx: FieldRenderContext): ReactNode {
  const { field, control, effectiveDisabled, handleChange } = ctx;
  const asCards = field.optionLayout === "cards";
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <RadioGroup
          className={cn(
            asCards
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
              : "flex items-center gap-5",
          )}
          value={controllerField.value}
          onValueChange={(value) => {
            controllerField.onChange(value);
            handleChange(value);
          }}
          disabled={effectiveDisabled}
        >
          {field.options?.map((option) => {
            if (asCards) {
              const checked = controllerField.value === option.value;
              return (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                    checked
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-input hover:bg-accent/50",
                    (effectiveDisabled || option.disabled) &&
                      "cursor-not-allowed opacity-60",
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    disabled={option.disabled}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm font-medium leading-none">
                      {option.label}
                    </div>
                    {option.description && (
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                </Label>
              );
            }
            return (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value}>{option.label}</Label>
              </div>
            );
          })}
        </RadioGroup>
      )}
    />
  );
}
