// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";

/** Filter config for the current-stock and low-stock tables. `t` is bound to `inventory`. */
export function getInventoryFilterConfig(t: Translator): FilterConfig {
  return {
    fields: [
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
      {
        name: "isLowStock",
        label: t("filters.stockLevel"),
        type: "select",
        placeholder: t("filters.allLevels"),
        columnSpan: 1,
        options: [
          { label: t("filters.lowStock"), value: "true" },
          { label: t("filters.healthy"), value: "false" },
        ],
      },
      {
        name: "status",
        label: t("filters.status"),
        type: "select",
        placeholder: t("filters.allStatuses"),
        columnSpan: 1,
        options: [
          { label: t("filters.active"), value: "active" },
          { label: t("filters.inactive"), value: "inactive" },
        ],
      },
    ],
    viewMode: "popover",
    columns: 2,
    applyOnChange: false,
    showResetButton: true,
    showApplyButton: true,
  };
}
