// coding-standard: maintained
import type { SelectOption } from "@/ui/components/form/type";

/**
 * The option a create form pre-fills: the one carrying `defaultFlag`, else the
 * one labelled `fallbackLabel` (case-insensitive). The merchant's own default
 * always wins; the fallback only covers orgs that never picked one.
 */
export function findDefaultOption(
  options: SelectOption[],
  defaultFlag: string,
  fallbackLabel?: string,
): SelectOption | undefined {
  const flagged = options.find(
    (opt) => (opt as unknown as Record<string, unknown>)[defaultFlag] === true,
  );
  if (flagged || !fallbackLabel) return flagged;
  const wanted = fallbackLabel.trim().toLowerCase();
  return options.find((opt) => String(opt.label).trim().toLowerCase() === wanted);
}
