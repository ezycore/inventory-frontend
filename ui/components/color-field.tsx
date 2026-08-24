"use client";
// coding-standard: maintained

import { useId } from "react";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { cn } from "@/ui/lib/utils";

/**
 * Native colour swatch + hex text box, kept in step.
 *
 * The one colour control in the app: it replaced two near-identical copies (the
 * storefront theme's brand/accent rows and the announcement bar's background/text
 * fields) that had drifted to different swatch sizes and input heights. Extend
 * this instead of writing a third.
 *
 * `layout="inline"` is the compact label-beside-swatch form for dense rails;
 * the default stacks a `<Label>` above so it lines up with sibling form fields.
 * An empty `value` is legal (it means "inherit / auto") — the swatch shows
 * `fallback` while the text box stays empty, so clearing the field is possible.
 */
export function ColorField({
  label,
  value,
  onChange,
  hint,
  layout = "stacked",
  fallback = "#000000",
  allowEmpty = true,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  layout?: "stacked" | "inline";
  /** Swatch colour when `value` is empty — never written back on its own. */
  fallback?: string;
  /** Whether blank means inherit / automatic for this setting. */
  allowEmpty?: boolean;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const valid = isValidHexColor(value, allowEmpty);
  const swatch = (
    <input
      type="color"
      value={isHexColor(value) ? value : fallback}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`${label} swatch`}
      className={cn(
        "flex-none cursor-pointer rounded-lg border bg-background",
        layout === "inline" ? "h-9 w-9" : "h-9 w-12",
      )}
    />
  );

  if (layout === "inline") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <span className="w-14 flex-none text-sm text-muted-foreground">
          {label}
        </span>
        {swatch}
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} hex value`}
          aria-invalid={!valid}
          aria-describedby={!valid ? errorId : undefined}
          className="h-9 font-mono text-sm"
        />
        {!valid ? <span id={errorId} className="sr-only">Use a 6-digit hex colour such as #2563eb.</span> : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {swatch}
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} hex value`}
          aria-invalid={!valid}
          aria-describedby={!valid ? errorId : undefined}
          className="font-mono text-sm"
        />
      </div>
      {!valid ? (
        <p id={errorId} className="text-xs text-destructive">
          Use a 6-digit hex colour such as #2563eb.
        </p>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** CSS colours accepted by Customize and by the API. */
export const isHexColor = (value: string): boolean =>
  /^#[0-9a-fA-F]{6}$/.test(value.trim());

export const isValidHexColor = (value: string, allowEmpty = true): boolean =>
  (allowEmpty && value.trim() === "") || isHexColor(value);
