// coding-standard: maintained
import { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";

export const getTagFilterConfig = (t: Translator): FilterConfig => ({
  fields: [
    {
      name: "search",
      label: t("filters.searchLabel"),
      type: "text",
      placeholder: t("filters.searchPlaceholder"),
    },
    {
      name: "status",
      label: t("filters.statusLabel"),
      type: "select",
      placeholder: t("filters.statusPlaceholder"),
      columnSpan: 1,
      options: [
        { label: t("filters.statusActive"), value: "active" },
        { label: t("filters.statusInactive"), value: "inactive" },
      ],
    },
    {
      name: "createdAt",
      label: t("filters.createdDateLabel"),
      type: "date-range",
      placeholder: t("filters.createdDatePlaceholder"),
      columnSpan: 2,
    },
  ],
  viewMode: "popover",
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
});
