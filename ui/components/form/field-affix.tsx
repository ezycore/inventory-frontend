// coding-standard: maintained
import type { ReactNode } from "react";

/**
 * Prefix/suffix chrome shared by the `input` and `number` renderers — the two
 * field types that draw a bare control inside an affixed shell. Kept here so
 * neither renderer owns the markup.
 */

/** Resolve a `field.prefix`/`field.suffix` (string or values-derived fn). */
export function resolveAffix(
  affix: string | ((values: Record<string, any>) => string | undefined) | undefined,
  allValues: Record<string, any>,
): string | undefined {
  return typeof affix === "function" ? affix(allValues) : affix;
}

/**
 * Input padding that keeps the text clear of the rendered affixes.
 *
 * The right pad scales with the suffix's length: a one-character unit ("%") and
 * a domain (".ezycore.com") need very different room, and a fixed pad let the
 * longer ones sit on top of the value. `pr-14` stays the floor so every
 * existing short-suffix field is unchanged. Classes are spelled out literally —
 * Tailwind can't see interpolated class names.
 */
export function affixPadding(prefix?: string, suffix?: string): string {
  const left = prefix ? "pl-8 " : "";
  if (!suffix) return left.trim();
  const right =
    suffix.length <= 6 ? "pr-14" : suffix.length <= 10 ? "pr-20" : "pr-28";
  return `${left}${right}`;
}

export function FieldAffix({
  prefix,
  suffix,
  children,
}: {
  prefix?: string;
  suffix?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative w-full">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-muted-foreground select-none">
          {prefix}
        </span>
      )}
      {children}
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs font-medium text-muted-foreground select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
