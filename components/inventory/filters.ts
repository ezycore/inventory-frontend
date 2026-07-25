// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";

/**
 * Filter config for the current-stock and low-stock tables. `t` is bound to `inventory`.
 *
 * `mode` differs because the shortlist is already restricted to items at/below their alert
 * threshold, so a "Healthy" level or an "inactive" status can never match:
 * - `"current"` (default): level = Low Stock / Healthy (`isLowStock`), plus a status filter.
 * - `"shortlist"`: level = Low Stock / Out of Stock (`stockStatus`, split by quantity on the
 *   backend), no status filter.
 */
export function getInventoryFilterConfig(
  t: Translator,
  mode: "current" | "shortlist" = "current",
): FilterConfig {
  const isShortlist = mode === "shortlist";

  const levelField = isShortlist
    ? {
        name: "stockStatus",
        label: t("filters.stockLevel"),
        type: "select" as const,
        placeholder: t("filters.allLevels"),
        columnSpan: 1,
        options: [
          { label: t("filters.lowStock"), value: "low" },
          { label: t("filters.outOfStock"), value: "out" },
        ],
      }
    : {
        name: "isLowStock",
        label: t("filters.stockLevel"),
        type: "select" as const,
        placeholder: t("filters.allLevels"),
        columnSpan: 1,
        options: [
          { label: t("filters.lowStock"), value: "true" },
          { label: t("filters.healthy"), value: "false" },
        ],
      };

  const fields: FilterConfig["fields"] = [
    {
      name: "search",
      label: t("filters.searchLabel"),
      type: "text",
      placeholder: t("filters.searchPlaceholder"),
    },
    {
      name: "brandId",
      label: t("filters.brand"),
      type: "select",
      placeholder: t("filters.allBrands"),
      columnSpan: 1,
      optionsApi: selectOptions("brands", { fields: "_id,name" }),
    },
    {
      name: "categoryId",
      label: t("filters.category"),
      type: "select",
      placeholder: t("filters.allCategories"),
      columnSpan: 1,
      optionsApi: selectOptions("categories", { fields: "_id,name" }),
    },
    levelField,
  ];

  if (!isShortlist) {
    fields.push({
      name: "status",
      label: t("filters.status"),
      type: "select",
      placeholder: t("filters.allStatuses"),
      columnSpan: 1,
      options: [
        { label: t("filters.active"), value: "active" },
        { label: t("filters.inactive"), value: "inactive" },
      ],
    });
  }

  return {
    fields,
    viewMode: "popover",
    columns: 2,
    applyOnChange: false,
    showResetButton: true,
    showApplyButton: true,
  };
}
