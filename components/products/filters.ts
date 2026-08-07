// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import { ProductStatus } from "@/types";
import { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";

export const getProductFilterConfig = (t: Translator): FilterConfig => ({
  viewMode: 'popover',
  fields: [
    {
      name: "search",
      label: t("filters.searchLabel"),
      type: "text",
      placeholder: t("filters.searchPlaceholder"),
    },
    {
      name: "brandId",
      label: t("filters.brandLabel"),
      type: "select",
      placeholder: t("filters.brandPlaceholder"),
      optionsApi: selectOptions("brands", { fields: "_id,name" }),
    },
    {
      // Top-level only: filtering by a parent already includes every product in
      // its sub-categories, because `product.categoryId` stays on the parent.
      name: "categoryId",
      label: t("filters.categoryLabel"),
      type: "select",
      placeholder: t("filters.categoryPlaceholder"),
      optionsApi: selectOptions("categories", {
        parentId: "null",
        fields: "_id,name",
      }),
    },
    {
      // OR semantics — a product carrying ANY selected tag matches.
      name: "tags",
      label: t("filters.tagsLabel"),
      type: "select",
      mode: "multiple",
      placeholder: t("filters.tagsPlaceholder"),
      optionsApi: selectOptions("tags", { status: "active", fields: "_id,name" }),
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
