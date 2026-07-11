// coding-standard: maintained
import { ProductStatus } from "@/types";
import { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";

export const getProductFilterConfig = (t: Translator): FilterConfig => ({
  viewMode: 'popover',
  fields: [
    {
      name: "name",
      label: t("filters.searchLabel"),
      type: "text",
      placeholder: t("filters.searchPlaceholder"),
    },
    {
      name: "brandId",
      label: t("filters.brandLabel"),
      type: "select",
      placeholder: t("filters.brandPlaceholder"),
      optionsApi: "/brands?all=true&fields=_id,name", // API endpoint to fetch brand options
    },
    {
      name: "categoryId",
      label: t("filters.categoryLabel"),
      type: "select",
      placeholder: t("filters.categoryPlaceholder"),
      optionsApi: "/categories?all=true&fields=_id,name", // API endpoint to fetch category options
    },
    {
      name: "status",
      label: t("filters.statusLabel"),
      type: "select",
      placeholder: t("filters.statusPlaceholder"),
      options: [
        { label: t("filters.statusActive"), value: ProductStatus.ACTIVE },
        { label: t("filters.statusInactive"), value: ProductStatus.INACTIVE },
        { label: t("filters.statusArchived"), value: ProductStatus.ARCHIVED },
      ],
    },
  ],
});
