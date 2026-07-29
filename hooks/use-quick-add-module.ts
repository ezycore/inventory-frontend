// coding-standard: maintained
import { quickAddConfig, type QuickAddModuleConfig } from "@/config/quickAddConfig";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import { useMemo } from "react";
import { useVatGatedFormConfig } from "./use-vat-gated-form-config";

// Module-scope so the hook below keeps a stable reference when there is no module.
const EMPTY_CONFIG: DynamicFormConfig = { fields: [] };

/**
 * Resolve the quick-add registry entry behind a `creatable` select and
 * feature-gate its form. Both select components open the same modal from the
 * same registry, so the lookup and the gate live here once.
 *
 * The registry is module scope and its configs are static English, so the gate
 * cannot live in `quickAddConfig` itself — it needs the signed-in org.
 *
 * Returns `null` when the select isn't creatable or names no module.
 */
export function useQuickAddModule(
  creatable: boolean,
  module?: string,
): QuickAddModuleConfig | null {
  const entry = creatable && module ? quickAddConfig[module] ?? null : null;
  const formConfig = useVatGatedFormConfig(
    entry?.formConfig ?? EMPTY_CONFIG,
    module ?? "",
  );

  return useMemo(
    () => (entry ? { ...entry, formConfig } : null),
    [entry, formConfig],
  );
}
