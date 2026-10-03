// coding-standard: maintained
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { OrganizationFeatures } from "@/types";
import { FilterField, FilterValues } from "@/types/filter";
import {
  moveFormField,
  omitFormFields,
  omitFormSections,
  releaseFieldDependencies,
  restrictSelectOptions,
} from "@/ui/components/form/form-utils";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import { sanitize } from "@/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Strip empty / null / undefined / empty-array values before handing to `onApply`. */
function pickActive(values: FilterValues): FilterValues {
  return Object.entries(values).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      if (Array.isArray(value) && value.length === 0) return acc;
      acc[key] = value;
    }
    return acc;
  }, {} as FilterValues);
}

export function useFilters(
  fields: FilterField[],
  onApply?: (filters: FilterValues) => void,
  applyOnChange: boolean = false,
  initialValues?: FilterValues,
  debounceMs: number = 600,
) {
  // Initialize default values, merged with initialValues if provided
  const getDefaultValues = useCallback(() => {
    const defaults = fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue ?? "";
      return acc;
    }, {} as FilterValues);
    // Merge with initialValues (URL params take precedence)
    return { ...defaults, ...(initialValues || {}) };
  }, [fields, initialValues]);

  const [values, setValues] = useState<FilterValues>(getDefaultValues());
  // Immediate mirror for free-text inputs — bound to the input so typing is
  // responsive, while the committed value in `values` lags by `debounceMs`.
  const [filterInputs, setFilterInputs] = useState<FilterValues>(
    getDefaultValues(),
  );
  const [isOpen, setIsOpen] = useState(false);

  // Latest values without re-creating the live-apply callback each render.
  const valuesRef = useRef(values);
  valuesRef.current = values;

  // Pending debounce timers, keyed by field name.
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const clearTimer = useCallback((name: string) => {
    if (timersRef.current[name]) {
      clearTimeout(timersRef.current[name]);
      delete timersRef.current[name];
    }
  }, []);

  // The patch a change to `name` produces: the field itself, plus any dependent
  // filter it declares `clearFieldsOnChange` for, reset to its default. Without
  // the reset a stale child survives in `values` and `pickActive` keeps sending
  // it — e.g. a sub-category that does not belong to the newly picked category,
  // which filters the list down to nothing.
  const fieldPatch = useCallback(
    (name: string, value: any): FilterValues => {
      const patch: FilterValues = { [name]: value };
      const dependents = fields.find((f) => f.name === name)?.clearFieldsOnChange;
      dependents?.forEach((dependent) => {
        patch[dependent] =
          fields.find((f) => f.name === dependent)?.defaultValue ?? "";
      });
      return patch;
    },
    [fields],
  );

  // Update single field (panel edits) — also syncs the input mirror so a field
  // rendered both inline and in the panel stays consistent.
  const updateField = useCallback(
    (name: string, value: any) => {
      const patch = fieldPatch(name, value);
      setValues((prev) => ({ ...prev, ...patch }));
      setFilterInputs((prev) => ({ ...prev, ...patch }));
    },
    [fieldPatch],
  );

  // Set a single field and apply immediately — for inline controls that commit
  // on change (closure-safe via `valuesRef`, no stale `values`). Cancels any
  // pending debounce for that field and syncs the input mirror.
  const setFieldAndApply = useCallback(
    (name: string, value: any) => {
      clearTimer(name);
      const patch = fieldPatch(name, value);
      const next = { ...valuesRef.current, ...patch };
      setValues(next);
      setFilterInputs((prev) => ({ ...prev, ...patch }));
      onApply?.(pickActive(next));
    },
    [onApply, clearTimer, fieldPatch],
  );

  // Set a free-text field with a debounced commit — the input mirror updates
  // instantly; the value commits + applies after `debounceMs` of idle.
  const setFilterDebounced = useCallback(
    (name: string, value: any) => {
      setFilterInputs((prev) => ({ ...prev, [name]: value }));
      clearTimer(name);
      timersRef.current[name] = setTimeout(() => {
        delete timersRef.current[name];
        const next = { ...valuesRef.current, [name]: value };
        setValues(next);
        onApply?.(pickActive(next));
      }, debounceMs);
    },
    [onApply, debounceMs, clearTimer],
  );

  // Apply filters
  const apply = useCallback(() => {
    onApply?.(pickActive(values));
    setIsOpen(false);
  }, [values, onApply]);

  // Reset filters
  const reset = useCallback(() => {
    const defaults = getDefaultValues();
    Object.keys(timersRef.current).forEach(clearTimer);
    setValues(defaults);
    setFilterInputs(defaults);
    onApply?.(defaults);
  }, [getDefaultValues, onApply, clearTimer]);

  // Clear single filter
  const clearField = useCallback(
    (name: string) => {
      setValues((prev) => ({
        ...prev,
        [name]: fields.find((f) => f.name === name)?.defaultValue ?? "",
      }));
    },
    [fields],
  );

  // Auto-apply on change
  useEffect(() => {
    if (applyOnChange && onApply) {
      onApply(pickActive(values));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, applyOnChange]);

  // Clear pending debounce timers on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // Get active filter count
  const activeCount = Object.values(values).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== "" && v !== null && v !== undefined;
  }).length;

  return {
    values,
    filterInputs,
    updateField,
    setFieldAndApply,
    setFilterDebounced,
    apply,
    reset,
    clearField,
    activeCount,
    isOpen,
    setIsOpen,
  };
}

export type UseFiltersReturn = ReturnType<typeof useFilters>;

/**
 * Hook to get a filtered form config based on organization's excluded fields
 *
 * @param formConfig - The original form configuration
 * @param module - The module name (product, brand, category, etc.)
 * @returns Filtered form config with excluded fields removed
 */
export function useFilteredFormConfig<T extends DynamicFormConfig>(
  formConfig: T,
  module: string,
): T {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    const excludedFields = sanitize(
      user?.organization?.settings?.excludedFields?.[module],
      "array",
    );
    /** Sections dropped whole, by stable id — see `omitFormSections`. */
    const hiddenSections: string[] = [];
    if (module === "product") {
      const expiryTrackingEnabled =
        user?.organization?.features?.expiryTracking;
      const uomConversion = user?.organization?.features?.uomConversion;
      const barcodeEnabled = user?.organization?.features?.barcodeSystem;
      if (!expiryTrackingEnabled) {
        // add hasExpiry and expiryAlertDays field name to excludedFields to hide them from form if expiry tracking is enabled
        excludedFields.push("hasExpiry", "expiryAlertDays");
      }
      if (!uomConversion) {
        excludedFields.push(
          "enableUOMConversion",
          "purchaseUnitId",
          "purchaseConversionFactor",
          "saleUnitId",
          "saleConversionFactor",
        );
      }
      if (!barcodeEnabled) {
        excludedFields.push("barcode", "barcodeSymbology");
      }
      // Stock-free: the whole Inventory section goes, and cost price moves out
      // of it first.
      //
      // Six of the seven fields describe quantities a business without stock
      // does not have — the "Add to inventory" toggle itself, the location it
      // would go to, opening stock, the low-stock threshold, and the opening
      // batch and expiry date.
      //
      // **Cost price stays**, and it is the exception the plan's "strip seven
      // fields" line got wrong. `costPrice` lives on the Inventory model and
      // nowhere else, and it is what makes gross profit real rather than a
      // permanent 100% margin for an f-commerce seller who knows exactly what
      // they paid.
      //
      // But keeping it *in place* is what left the section standing — one field
      // is enough to keep a section, so the form still carried an "Inventory"
      // header reading "Stock levels and low-stock alerts" above a **Track
      // stock** toggle, on a workspace that tracks none (QA-N1/C2). That toggle
      // is a `headerAction`, not a field, so no amount of field-level exclusion
      // could remove it. Relocating cost price to Pricing empties the section
      // and `omitFormFields` then drops the header and the toggle together.
      //
      // Pricing is also where it belongs: the product detail page has always
      // shown cost under Pricing, and at this tier
      // `provisionUntrackedInventory` writes the number unconditionally, so it
      // no longer has a stock question behind it to sit under.
      const storefrontOn = user?.organization?.features?.storefront;
      const stockOn = user?.organization?.features?.inventoryTracking;
      // "Publish to store" belongs to exactly one tier: a storefront merchant
      // who does not track stock, for whom creating a product IS publishing it.
      // A stocked merchant keeps the Products → Online tab, where listing is a
      // separate decision taken at a separate time; a merchant with no
      // storefront has nothing to publish to.
      // Dropped as a whole SECTION, not as a list of field names. The list
      // named only the original three and the section had since grown
      // `weightKg` and `featured`, so those two survived the gate — and being
      // hidden by a `dependsOn` on the very `isListed` checkbox the gate had
      // just removed, they rendered nothing. The section was left standing as
      // an empty card: a "Publish to store" header, a subtitle promising the
      // product goes live on save, and not a single control under it.
      if (!storefrontOn || stockOn) {
        hiddenSections.push("publish-to-store");
      }
      if (user?.organization?.features?.warranty === false) {
        hiddenSections.push("warranty");
      }
      if (!stockOn) {
        excludedFields.push(
          "addToInventory",
          "locationId",
          "openingStock",
          "inventoryAlertLevel",
          "batchNumber",
          "expiryDate",
        );
      }
    }
    // A default discount on a CUSTOMER is a sales tool and on a SUPPLIER a
    // purchasing one, so each follows its own capability. Both read the same
    // `Discount` records — the ones behind Pricing → Discounts, which is gated
    // on either capability for the same reason.
    if (module === "supplier" && !user?.organization?.features?.purchases) {
      excludedFields.push("defaultDiscountId");
    }
    if (module === "customer" && !user?.organization?.features?.sales) {
      excludedFields.push("defaultDiscountId");
    }
    // The Discount RECORD itself, as opposed to the field that references one.
    // A discount carries `applicableTo: "sales" | "purchase" | "both"` and a
    // default flag per side, so each half follows its own capability — and both
    // halves can be absent at once here in a way they cannot on the customer and
    // supplier forms above, which is why the select's options are narrowed
    // rather than the field removed.
    const salesOn = user?.organization?.features?.sales !== false;
    const purchasesOn = user?.organization?.features?.purchases !== false;
    const applicableTo: string[] = [];
    if (module === "discount") {
      if (!salesOn) excludedFields.push("isDefaultSales");
      if (!purchasesOn) excludedFields.push("isDefaultPurchase");
      if (salesOn) applicableTo.push("sales");
      if (purchasesOn) applicableTo.push("purchase");
      // "Both" means both, so it survives only when both do. Leaving it on a
      // one-sided workspace is the same defect as leaving "Purchase Only"
      // there: a saved record that applies to a module the merchant does not
      // have, and nothing to tell them so.
      if (salesOn && purchasesOn) applicableTo.push("both");
    }
    const stockFreeProduct =
      module === "product" &&
      !user?.organization?.features?.inventoryTracking;
    // Order matters: cost price has to leave the Inventory section BEFORE the
    // omit pass, or the section still holds a field when the empty-section
    // filter runs and survives with its header and Track stock toggle intact.
    const relocated = stockFreeProduct
      ? moveFormField(formConfig, "costPrice", "pricing")
      : formConfig;
    const trimmed = restrictSelectOptions(
      omitFormSections(omitFormFields(relocated, excludedFields), hiddenSections),
      { applicableTo },
    );
    // Cost price outlives its trigger — see the note above. Its other rule
    // (`productType === "single"`) is left alone, so combos and variable
    // products still do not show it.
    return stockFreeProduct
      ? releaseFieldDependencies(trimmed, ["addToInventory"])
      : trimmed;
  }, [formConfig, user, module]);
}

const omitColumns = <T,>(
  columns: ColumnDef<T>[],
  keys: string[],
): ColumnDef<T>[] =>
  keys.length === 0
    ? columns
    : columns.filter(
        (column: any) => !keys.includes(column.accessorKey || column.id),
      );

/**
 * Columns the org's feature flags remove outright. Mirrors the field gate in
 * `useFilteredFormConfig` — a column whose feature is off must not even show up
 * in the "manage columns" picker, so this is applied to `fullColumns` too.
 */
function featureExcludedColumns(
  features: OrganizationFeatures | undefined,
  module: string,
): string[] {
  if (module !== "product") return [];
  const excluded: string[] = [];
  if (!features?.barcodeSystem) excluded.push("barcode");
  // The server omits `totalStock` for a business that does not count stock, so
  // the column would render an em dash on every row — and, worse, still sit in
  // the Manage Columns picker as something a merchant could switch on.
  if (features?.inventoryTracking === false) excluded.push("totalStock");
  return excluded;
}

/**
 * Hook to drop columns the org's plan doesn't include (feature gate only —
 * user column preferences are left alone). Use for the `fullColumns` list.
 * @param columns - The full column definitions array
 * @param module - The module name (e.g., 'product', 'brand', 'category')
 */
export function useFeatureGatedColumns<T = any>(
  columns: ColumnDef<T>[],
  module: string,
): ColumnDef<T>[] {
  const user = useAuthStore((state) => state.user);

  return useMemo(
    () =>
      omitColumns(
        columns,
        featureExcludedColumns(user?.organization?.features, module),
      ),
    [columns, user, module],
  );
}

/**
 * Hook to filter table columns based on excluded columns from settings,
 * plus the feature gate above.
 * @param columns - The full column definitions array
 * @param module - The module name (e.g., 'product', 'brand', 'category')
 * @returns Filtered column definitions array
 */
export function useFilteredColumns<T = any>(
  columns: ColumnDef<T>[],
  module: string,
): ColumnDef<T>[] {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    const excludedColumns = [
      ...(user?.organization?.settings?.excludedColumns?.[module] || []),
      ...featureExcludedColumns(user?.organization?.features, module),
    ];
    return omitColumns(columns, excludedColumns);
  }, [columns, user, module]);
}
