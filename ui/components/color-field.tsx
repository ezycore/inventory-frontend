"use client";
// coding-standard: maintained

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
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  layout?: "stacked" | "inline";
  /** Swatch colour when `value` is empty — never written back on its own. */
  fallback?: string;
  className?: string;
}) {
  const swatch = (
    <input
      type="color"
      value={value || fallback}
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} hex value`}
          className="h-9 font-mono text-sm"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {swatch}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} hex value`}
          className="font-mono text-sm"
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
