// coding-standard: maintained

import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useSelectOptions } from "@/services/api";
import { CATEGORY_OPTIONS_API } from "./form-config";

/** The two product fields a category's default rate feeds. */
const TAX_RATE_FIELDS = ["salesTax.taxId", "purchaseTax.taxId"] as const;

/**
 * Prefill a new product's VAT rate from the category it is put in.
 *
 * A pharmacy's medicines are exempt while its cosmetics are standard-rated, so
 * one org-wide default rate is wrong for whichever group it does not describe.
 * The category default is the more specific answer, so it wins over `isDefault`.
 *
 * Three deliberate rules:
 *
 * - **Both sides get it.** A supply's VAT category belongs to the good, not to
 *   the direction it moves — an exempt medicine is exempt bought and sold.
 * - **Create only.** On edit the stored rate is the product's own decision, and
 *   re-categorising a product must never silently re-price it.
 * - **It overwrites.** Category sits near the top of the form and the rate near
 *   the bottom, and the rate field has already auto-filled the org default by
 *   the time the user gets there — so declining to overwrite would mean the
 *   category default never applied at all.
 *
 * A category with no default changes nothing; the org-wide default stands.
 */
export function useCategoryVatPrefill(vatActive: boolean) {
  // Same URL as the form's category field, so this shares its cache entry
  // rather than issuing a second request.
  const { data: categoryOptions = [] } = useSelectOptions(
    vatActive ? CATEGORY_OPTIONS_API : null,
  );

  return useCallback(
    (
      fieldName: string,
      value: unknown,
      _allValues: unknown,
      form: UseFormReturn<any>,
    ) => {
      if (!vatActive || fieldName !== "categoryId") return;
      if (form.getValues("_id")) return; // edit mode

      // The select hands back a bare id unless `labelInValue` is set.
      const categoryId =
        typeof value === "object" && value !== null
          ? (value as { value?: string }).value
          : value;

      const option = categoryOptions.find(
        (opt) => opt.value === categoryId,
      ) as { defaultTaxId?: string | null } | undefined;

      if (!option?.defaultTaxId) return;

      for (const target of TAX_RATE_FIELDS) {
        form.setValue(target, option.defaultTaxId, {
          shouldDirty: true,
          shouldValidate: false,
        });
      }
    },
    [vatActive, categoryOptions],
  );
}
