// coding-standard: maintained
import { quickAddConfig, type QuickAddModuleConfig } from "@/config/quickAddConfig";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import { useMemo } from "react";
import { useVatGatedFormConfig } from "./use-vat-gated-form-config";

// Module-scope so the hook below keeps a stable reference when there is no module.
const EMPTY_CONFIG: DynamicFormConfig = { fields: [] };

/** Query params that narrow a list rather than scope it — never form values. */
const NON_SCOPE_PARAMS = new Set(["all", "fields", "status", "inventory"]);

/**
 * The scope a dependent select is already filtered by, as quick-add form values.
 *
 * A creatable select whose options are narrowed by a parent — the product
 * form's Sub-category, whose `optionsApi` resolves to `?parentId=<category>` —
 * opened a quick-add form that knew nothing about that parent. Its `parentId`
 * defaulted to empty, so typing a name and saving created a **top-level**
 * category, which then did not appear in the dropdown it was created from. The
 * new row simply vanished.
 *
 * The narrowing is already in the resolved URL, so lift it back out: any query
 * param that names a field in the quick-add form becomes that field's default.
 * `parentId=<id>` seeds `parentId`; `fields`/`all` name no field and are
 * ignored. General on purpose — the next dependent creatable select gets this
 * for free rather than repeating the bug.
 *
 * Exported for its unit test — callers get it via `useQuickAddModule().defaults`.
 */
export function scopeDefaults(
  optionsApi: string | undefined,
  formConfig: DynamicFormConfig,
): Record<string, string> {
  const query = optionsApi?.split("?")[1];
  if (!query) return {};

  const names = new Set(formConfig.fields.map((f) => f.name));
  const defaults: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(query)) {
    // An unresolved `{{template}}` means the dependency has no value yet, so
    // there is no scope to inherit.
    if (NON_SCOPE_PARAMS.has(key) || !names.has(key) || value.includes("{{")) {
      continue;
    }
    defaults[key] = value;
  }
  return defaults;
}

/**
 * Resolve the quick-add registry entry behind a `creatable` select and
 * feature-gate its form. Both select components open the same modal from the
 * same registry, so the lookup and the gate live here once.
 *
 * The registry is module scope and its configs are static English, so the gate
 * cannot live in `quickAddConfig` itself — it needs the signed-in org.
 *
 * `optionsApi` is the select's RESOLVED endpoint; pass it so a scoped select's
 * quick-add opens already filed under the same parent (see `scopeDefaults`).
 *
 * Returns `null` when the select isn't creatable or names no module.
 */
export function useQuickAddModule(
  creatable: boolean,
  module?: string,
  optionsApi?: string,
): (QuickAddModuleConfig & { defaults: Record<string, string> }) | null {
  const entry = creatable && module ? quickAddConfig[module] ?? null : null;
  const formConfig = useVatGatedFormConfig(
    entry?.formConfig ?? EMPTY_CONFIG,
    module ?? "",
  );

  return useMemo(
    () =>
      entry
        ? { ...entry, formConfig, defaults: scopeDefaults(optionsApi, formConfig) }
        : null,
    [entry, formConfig, optionsApi],
  );
}
