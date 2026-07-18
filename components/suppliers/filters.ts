// coding-standard: maintained
import type { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";

/** `t` is bound to the `suppliers` namespace. */
export function getSupplierFilterConfig(t: Translator): FilterConfig {
  return {
    fields: [
      {
        name: "search",
        label: t("filters.searchSupplier"),
        type: "text",
        placeholder: t("filters.searchPlaceholder"),
      },
      {
        name: "email",
        label: t("filters.email"),
        type: "text",
        placeholder: t("filters.emailPlaceholder"),
      },
      {
        name: "status",
        label: t("filters.status"),
        type: "select",
        placeholder: t("filters.allStatuses"),
        columnSpan: 2,
        options: [
          { label: t("filters.active"), value: "active" },
          { label: t("filters.inactive"), value: "inactive" },
        ],
      },
      {
        name: "createdAt",
        label: t("filters.createdDate"),
        type: "date-range",
        placeholder: t("filters.selectDateRange"),
        columnSpan: 2,
      },
      {
        name: "updatedAt",
        label: t("filters.updatedDate"),
        type: "date",
        placeholder: t("filters.selectDate"),
        columnSpan: 2,
      },
    ],
    viewMode: "popover",
    columns: 2,
    applyOnChange: false,
    showResetButton: true,
    showApplyButton: true,
  };
}

export const supplierDefaultValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  defaultDiscountId: "",
  status: "active" as const,
};
