// coding-standard: maintained
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import { cn } from "@ui/lib/utils";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { Password } from "../input-password";
import { FieldAffix, affixPadding, resolveAffix } from "./field-affix";
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

/** `input` — text only. Numbers go through `renderNumberInput` (NumberField). */
export function renderTextInput(ctx: FieldRenderContext): ReactNode {
  const { field, fieldId, control, error, effectiveDisabled, handleChange, allValues } = ctx;
  const prefix = resolveAffix(field.prefix, allValues);
  const suffix = resolveAffix(field.suffix, allValues);
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <FieldAffix prefix={prefix} suffix={suffix}>
          <Input
            {...controllerField}
            id={fieldId}
            value={controllerField.value ?? ""}
            type="text"
            placeholder={field.placeholder}
            disabled={effectiveDisabled}
            onChange={(e) => {
              controllerField.onChange(e.target.value);
              handleChange(e.target.value);
            }}
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

export function renderTextarea(ctx: FieldRenderContext): ReactNode {
  const { field, fieldId, control, error, effectiveDisabled, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <Textarea
          {...controllerField}
          id={fieldId}
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
          legacyFormat={field.legacyFormat}
          maxLength={field.validation?.maxLength}
          imageUpload={field.imageUpload}
          className={cn("w-full", error ? "border-red-500" : "")}
        />
      )}
    />
  );
}

export function renderPassword(ctx: FieldRenderContext): ReactNode {
  const { field, fieldId, control, error, effectiveDisabled, handleChange } = ctx;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <Password
          {...controllerField}
          id={fieldId}
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
