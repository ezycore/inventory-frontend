"use client";
// coding-standard: maintained
import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@ui/lib/utils";
import { Input } from "@ui/components/input";
import { Button } from "@ui/components/button";

type NativeInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "min" | "max" | "step" | "size" | "type"
>;

export interface NumberFieldProps extends NativeInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /**
   * Decimal places to keep. Omit for unrestricted floats.
   *
   * `0` means whole units, and it TRUNCATES rather than rounds: a quantity field
   * must never commit more units than the digits typed. Rounding sent 3.7 to a
   * transfer as 4 and 2.5 to a return as 3 — moving stock and refunding money
   * the merchant never asked for, silently (QA-R14).
   */
  precision?: number;
  /** Show +/- stepper buttons. */
  showSteppers?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: { control: "h-8", button: "h-8 w-8", input: "h-8 text-sm", icon: "h-3.5 w-3.5" },
  md: { control: "h-9", button: "h-9 w-9", input: "h-9 text-base md:text-sm", icon: "h-4 w-4" },
  lg: { control: "h-11", button: "h-11 w-11", input: "h-11 text-base", icon: "h-5 w-5" },
} as const;

// Intermediate strings that are valid to type but not yet a number.
const PARTIAL = new Set(["", "-", ".", "-."]);
const NUMERIC_DRAFT = /^-?\d*\.?\d*$/;

function clamp(n: number, min?: number, max?: number): number {
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

function round(n: number, precision?: number): number {
  if (precision === undefined) return n;
  // Whole units truncate toward zero — never up. See `precision` above.
  if (precision === 0) return Math.trunc(n);
  return Number(n.toFixed(precision));
}

function toDraft(value: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision,
  showSteppers = false,
  size = "md",
  disabled,
  className,
  onBlur,
  onFocus,
  onKeyDown,
  ...rest
}: NumberFieldProps) {
  const [draft, setDraft] = React.useState<string>(() => toDraft(value));
  const [focused, setFocused] = React.useState(false);
  const sizes = sizeClasses[size];

  // Pull external changes into the field while the user is not editing.
  React.useEffect(() => {
    if (!focused) setDraft(toDraft(value));
  }, [value, focused]);

  const commit = (n: number | null) => {
    onChange(n);
    setDraft(toDraft(n));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!NUMERIC_DRAFT.test(raw)) return; // reject letters/symbols, keep old draft
    setDraft(raw);

    if (PARTIAL.has(raw)) {
      onChange(null);
      return;
    }
    const parsed = parseFloat(raw);
    // Emit rounded but unclamped while typing; clamp happens on blur so the
    // user can freely type through intermediate values.
    onChange(Number.isNaN(parsed) ? null : round(parsed, precision));
  };

  // Select the existing draft on focus, native-number-input style. Without
  // this, clicking into a field carrying a nonzero default (e.g. a conversion
  // factor showing "1") places the caret rather than replacing the value —
  // typing "12" then reads as "112" with no indication anything went wrong.
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    e.target.select();
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    if (PARTIAL.has(draft)) {
      commit(null);
    } else {
      const parsed = parseFloat(draft);
      commit(Number.isNaN(parsed) ? null : clamp(round(parsed, precision), min, max));
    }
    onBlur?.(e);
  };

  const stepBy = (direction: 1 | -1) => {
    const base = value ?? min ?? 0;
    commit(clamp(round(base + direction * step, precision), min, max));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        stepBy(1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        stepBy(-1);
      }
    }
    onKeyDown?.(e);
  };

  const input = (
    <Input
      {...rest}
      type="text"
      inputMode={precision === 0 ? "numeric" : "decimal"}
      value={draft}
      disabled={disabled}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(!showSteppers && sizes.input, className)}
    />
  );

  if (!showSteppers) return input;

  const decDisabled = disabled || (min !== undefined && (value ?? min) <= min);
  const incDisabled = disabled || (max !== undefined && (value ?? max) >= max);

  return (
    <div
      className={cn(
        "inline-flex w-full items-center rounded-md border border-input bg-transparent",
        sizes.control,
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        className={cn(sizes.button, "shrink-0 rounded-none rounded-l-md border-0")}
        onClick={() => stepBy(-1)}
        disabled={decDisabled}
        aria-label="Decrement"
      >
        <Minus className={sizes.icon} />
      </Button>

      <Input
        {...rest}
        type="text"
        inputMode={precision === 0 ? "numeric" : "decimal"}
        value={draft}
        disabled={disabled}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          sizes.input,
          "border-0 bg-transparent text-center shadow-none focus-visible:ring-0"
        )}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        className={cn(sizes.button, "shrink-0 rounded-none rounded-r-md border-0")}
        onClick={() => stepBy(1)}
        disabled={incDisabled}
        aria-label="Increment"
      >
        <Plus className={sizes.icon} />
      </Button>
    </div>
  );
}
