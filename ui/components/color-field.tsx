"use client";
// coding-standard: maintained

import { useId } from "react";
import { X } from "lucide-react";
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
 *
 * **An empty `value` is a real answer** — "inherit", "automatic", "no backdrop" —
 * and three things have to be true for a merchant to reach it, because a native
 * colour input has no concept of "none" and always paints something:
 *
 * 1. **The empty swatch looks empty.** It shows a checkerboard, not `fallback`.
 *    A white `fallback` behind an empty field is indistinguishable from a white
 *    value that was actually chosen, so the control silently answered a question
 *    the merchant had not asked.
 * 2. **There is a way back to it.** Clicking the swatch always writes a hex, so
 *    without a clear button the only route to empty is selecting the text and
 *    deleting it — discoverable by nobody.
 * 3. **The `hint` renders in BOTH layouts.** `inline` accepted `hint` and threw
 *    it away, which is how the logo backdrop shipped with "Leave empty for no
 *    backdrop (transparent)" written in the source and visible nowhere.
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
  /** Nothing chosen, on a field where that is a legal answer. */
  const empty = allowEmpty && value.trim() === "";

  const swatch = (
    <span
      className={cn(
        "relative flex-none overflow-hidden rounded-lg border",
        layout === "inline" ? "h-9 w-9" : "h-9 w-12",
      )}
      // The transparency checkerboard, drawn on the WRAPPER so the native input
      // can be faded out over it — `input[type=color]` always paints its own
      // value and has no empty state of its own.
      style={
        empty
          ? {
              backgroundImage:
                "linear-gradient(45deg,#c8ccd2 25%,transparent 25%,transparent 75%,#c8ccd2 75%)," +
                "linear-gradient(45deg,#c8ccd2 25%,transparent 25%,transparent 75%,#c8ccd2 75%)",
              backgroundSize: "10px 10px",
              backgroundPosition: "0 0, 5px 5px",
              backgroundColor: "#ffffff",
            }
          : undefined
      }
    >
      <input
        type="color"
        value={isHexColor(value) ? value : fallback}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} swatch`}
        // `opacity-0`, not `hidden`: the input still takes the click and opens
        // the picker, so the checkerboard IS the button.
        className={cn(
          "h-full w-full cursor-pointer border-0 bg-transparent p-0",
          empty && "opacity-0",
        )}
      />
    </span>
  );

  /* Only when there is something to clear, and only where empty means
     something. On `allowEmpty={false}` fields (brand, accent) blank is not an
     answer the API accepts, so offering it would be offering an invalid state. */
  const clear =
    allowEmpty && value.trim() !== "" ? (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label={`Clear ${label.toLowerCase()}`}
        title="Clear — leave it automatic"
        className="flex-none rounded-md p-1.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    ) : null;

  if (layout === "inline") {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center gap-2.5">
          <span className="w-14 flex-none text-sm text-muted-foreground">
            {label}
          </span>
          {swatch}
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={empty ? "None" : undefined}
            aria-label={`${label} hex value`}
            aria-invalid={!valid}
            aria-describedby={!valid ? errorId : undefined}
            className="h-9 font-mono text-sm"
          />
          {clear}
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

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {swatch}
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={empty ? "None" : undefined}
          aria-label={`${label} hex value`}
          aria-invalid={!valid}
          aria-describedby={!valid ? errorId : undefined}
          className="font-mono text-sm"
        />
        {clear}
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
