// coding-standard: maintained

/**
 * Shared heuristic for choosing between the plain `<AdvancedSelect>` (Radix
 * dropdown, no search) and the searchable `<FuseAdvancedSelect>` combobox.
 *
 * Used by both the DynamicForm select renderer (`form/field-select-inputs.tsx`)
 * and the filter-bar select renderer (`filters/filter-field-renderer.tsx`) so a
 * select looks and behaves the same whether it's in a form or a filter.
 *
 * A **single-mode** select earns search when its list is remote (any
 * `optionsApi`, which grows unbounded with tenant data) or its static list is
 * longer than the threshold. **Multiple-mode** selects stay on
 * `<AdvancedSelect>` — it delegates to `<MultiSelect>`, which already searches
 * inside its own popover, so routing them through Fuse's far-less-exercised
 * multi path would add risk without adding search.
 */

// Static lists longer than this are unpleasant to scan without a search box.
export const SEARCHABLE_OPTION_THRESHOLD = 10;

export function shouldUseSearchableSelect(params: {
  mode?: "single" | "multiple";
  optionsApi?: string;
  optionCount: number;
}): boolean {
  if ((params.mode ?? "single") !== "single") return false;
  if (params.optionsApi) return true;
  return params.optionCount > SEARCHABLE_OPTION_THRESHOLD;
}
