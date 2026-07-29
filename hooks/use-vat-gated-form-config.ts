// coding-standard: maintained
import { isVatActive } from "@/lib/feature-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { omitFormFields } from "@/ui/components/form/form-utils";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import { useMemo } from "react";

/**
 * The fields of each form module that only mean something while the org charges
 * VAT. Keyed by the module names `useFilteredFormConfig` and `quickAddConfig`
 * already use, so a form is gated the same way wherever it is rendered — its own
 * page or the quick-add modal a `creatable` picker opens.
 */
const VAT_ONLY_FIELDS: Record<string, string[]> = {
  product: [
    "salesTax.taxType",
    "salesTax.taxId",
    "purchaseTax.taxType",
    "purchaseTax.taxId",
  ],
  category: ["defaultTaxId"],
};

/**
 * Drop a module's VAT fields while `isVatActive(org)` is false — the single gate
 * for VAT form fields (see `.claude/skills/vat/SKILL.md` §1).
 *
 * Ungated, the picker still renders and its `taxes` options request comes back
 * "Tax management feature is not enabled for your organization", so the user is
 * shown an error where a field should be.
 */
export function useVatGatedFormConfig<T extends DynamicFormConfig>(
  config: T,
  module: string,
): T {
  const user = useAuthStore((state) => state.user);
  const vatActive = isVatActive(user?.organization);

  return useMemo(() => {
    if (vatActive) return config;
    return omitFormFields(config, VAT_ONLY_FIELDS[module] ?? []);
  }, [config, module, vatActive]);
}
