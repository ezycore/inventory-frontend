// coding-standard: maintained
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import { cn } from "@ui/lib/utils";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { Password } from "../input-password";
import type { FieldRenderContext } from "./field-render-context";

// Loaded on demand: TipTap is heavy and the form engine is in every form's bundle.
const RichTextEditor = dynamic(
  () => import("@/components/shared/rich-text-editor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[230px] w-full animate-pulse rounded-md border border-input bg-muted/40" />
    ),
  },
);

/** `input` and `number` — shares prefix/suffix affix chrome. */
export function renderTextInput(ctx: FieldRenderContext): ReactNode {
  const { field, control, error, effectiveDisabled, handleChange, allValues } = ctx;
  const suffixValue =
    typeof field.suffix === "function" ? field.suffix(allValues) : field.suffix;
  const prefixValue =
    typeof field.prefix === "function" ? field.prefix(allValues) : field.prefix;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <div className="relative w-full">
          {prefixValue && (
            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-muted-foreground select-none">
              {prefixValue}
            </span>
          )}
          <Input
            {...controllerField}
            value={controllerField.value ?? ""}
            type={field.type === "number" ? "number" : "text"}
            placeholder={field.placeholder}
            disabled={effectiveDisabled}
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.step}
            onChange={(e) => {
              const rawValue = e.target.value;
              let value;

              if (field.type === "number") {
                // Allow empty string for clearing the field
                if (rawValue === "" || rawValue === null || rawValue === undefined) {
                  value = "";
                } else {
                  const parsed = parseFloat(rawValue);
                  value = isNaN(parsed) ? "" : parsed;
                }
              } else {
                value = rawValue;
              }

              controllerField.onChange(value);
              handleChange(value);
            }}
            className={cn(
              "w-full",
              prefixValue ? "pl-8" : "",
              suffixValue ? "pr-14" : "",
              error ? "border-red-500" : "",
            )}
          />
          {suffixValue && (
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs font-medium text-muted-foreground select-none">
              {suffixValue}
            </span>
          )}
        </div>
      )}
    />
  );
}

export function renderTextarea(ctx: FieldRenderContext): ReactNode {
  const { field, control, error, effectiveDisabled, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <Textarea
          {...controllerField}
          value={controllerField.value ?? ""}
          placeholder={field.placeholder}
          disabled={effectiveDisabled}
          rows={field.rows || 3}
          onChange={(e) => {
            controllerField.onChange(e.target.value);
            handleChange(e.target.value);
          }}
          className={cn("w-full", error ? "border-red-500" : "")}
        />
      )}
    />
  );
}

export function renderRichText(ctx: FieldRenderContext): ReactNode {
  const { field, control, error, effectiveDisabled, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <RichTextEditor
          value={controllerField.value ?? ""}
          onChange={(json) => {
            controllerField.onChange(json);
            handleChange(json);
          }}
          disabled={effectiveDisabled}
          className={cn("w-full", error ? "border-red-500" : "")}
        />
      )}
    />
  );
}

export function renderPassword(ctx: FieldRenderContext): ReactNode {
  const { field, control, error, effectiveDisabled, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <Password
          {...controllerField}
          type={"password"}
          placeholder={field.placeholder}
          disabled={effectiveDisabled}
          min={field.validation?.min}
          max={field.validation?.max}
          onChange={(e) => {
            controllerField.onChange(e.target.value);
            handleChange(e.target.value);
          }}
          className={cn("w-full", error ? "border-red-500" : "")}
        />
      )}
    />
  );
}
