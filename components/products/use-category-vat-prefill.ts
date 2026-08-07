// coding-standard: maintained

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";

import { useSelectOptions } from "@/services/api";
import { selectOptionsKey } from "@/services/api/modules/use-select-options";
import { CATEGORY_OPTIONS_API, subcategoryOptionsApi } from "./form-config";

/** The two product fields a category's default rate feeds. */
const TAX_RATE_FIELDS = ["salesTax.taxId", "purchaseTax.taxId"] as const;

/** The select hands back a bare id unless `labelInValue` is set. */
const idOf = (value: unknown): string | undefined =>
  typeof value === "object" && value !== null
    ? (value as { value?: string }).value
    : (value as string | undefined);

type RateOption = { value: string; defaultTaxId?: string | null };

const rateOf = (options: unknown[], id: string | undefined) =>
  id
    ? ((options as RateOption[]).find((o) => o.value === id)?.defaultTaxId ??
      undefined)
    : undefined;

/**
 * Prefill a new product's VAT rate from the category it is put in.
 *
 * A pharmacy's medicines are exempt while its cosmetics are standard-rated, so
 * one org-wide default rate is wrong for whichever group it does not describe.
 * The category default is the more specific answer, so it wins over `isDefault`.
 *
 * **The rate resolves down the tree: sub-category → category → org default.**
 * A child inherits its parent's rate and may override it, so picking a
 * sub-category re-resolves — including *back down* to the parent's rate when
 * the newly chosen child has none of its own. Without that second half,
 * switching from a child that overrides to one that inherits would strand the
 * override on a product it does not describe.
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
 * Neither level having a rate changes nothing; the org-wide default stands.
 */
export function useCategoryVatPrefill(vatActive: boolean) {
  // Same URL as the form's category field, so this shares its cache entry
  // rather than issuing a second request.
  const { data: categoryOptions = [] } = useSelectOptions(
    vatActive ? CATEGORY_OPTIONS_API : null,
  );
  // The sub-category list is per-parent, so it cannot be fetched at render —
  // the parent isn't known until the user picks one. Read it out of the cache
  // instead: to have chosen a child at all, the select beside this has already
  // loaded that parent's children under exactly this key.
  const queryClient = useQueryClient();

  return useCallback(
    (
      fieldName: string,
      value: unknown,
      allValues: unknown,
      form: UseFormReturn<any>,
    ) => {
      if (!vatActive) return;
      if (fieldName !== "categoryId" && fieldName !== "subcategoryId") return;
      if (form.getValues("_id")) return; // edit mode

      const values = (allValues ?? {}) as Record<string, unknown>;
      // On a category change the child is cleared in the same update
      // (`clearFieldsOnChange`), so only the parent can contribute a rate.
      const categoryId =
        fieldName === "categoryId" ? idOf(value) : idOf(values.categoryId);
      const subcategoryId =
        fieldName === "subcategoryId" ? idOf(value) : undefined;

      const parentRate = rateOf(categoryOptions, categoryId);
      const childRate =
        subcategoryId && categoryId
          ? rateOf(
              queryClient.getQueryData(
                selectOptionsKey(subcategoryOptionsApi(categoryId)),
              ) ?? [],
              subcategoryId,
            )
          : undefined;

      // Child overrides parent; a child with no rate of its own falls back to
      // it, which is what makes switching between siblings resolve correctly.
      const resolved = childRate ?? parentRate;
      if (!resolved) return;

      for (const target of TAX_RATE_FIELDS) {
        form.setValue(target, resolved, {
          shouldDirty: true,
          shouldValidate: false,
        });
      }
    },
    [vatActive, categoryOptions, queryClient],
  );
}
