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

/** Input padding that keeps the text clear of the rendered affixes. */
export function affixPadding(prefix?: string, suffix?: string): string {
  return `${prefix ? "pl-8 " : ""}${suffix ? "pr-14" : ""}`.trim();
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
