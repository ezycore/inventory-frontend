import { selectOptions } from "@/services/api/select-options";
import { FilterConfig } from '@/types/DataTable'
import type { Translator } from '@/i18n/config'

export const getCategoryFilterConfig = (t: Translator): FilterConfig => ({
  fields: [
    {
      name: "search",
      label: t("filters.searchLabel"),
      type: "text",
      placeholder: t("filters.searchPlaceholder"),
    },
    {
      // Narrows to one parent's children. Leaving it unset keeps the flat list of
      // every category, parents and children together — the default the backend
      // preserves for exactly this reason.
      name: "parentId",
      label: t("filters.parentLabel"),
      type: "select",
      placeholder: t("filters.parentPlaceholder"),
      optionsApi: selectOptions("categories", {
        parentId: "null",
        fields: "_id,name",
      }),
    },
    {
      name: "status",
      label: t("filters.statusLabel"),
      type: "select",
      placeholder: t("filters.statusPlaceholder"),
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
    {
      name: "updatedAt",
      label: t("filters.updatedDateLabel"),
      type: "date-range",
      placeholder: t("filters.updatedDatePlaceholder"),
      columnSpan: 2,
    },
  ],
  viewMode: 'popover',
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
});
