"use client";
// coding-standard: maintained

import { useTranslations, useLocale } from "next-intl";

// Types
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { Translator, AppLocale } from "@/i18n/config";

// UI Components
import { DataCard } from "@/ui/components/dataCard";
import PageHeader from "@/ui/components/header";
import UnitCardView from "@/components/units/cardview";
import UnitCardLoading from "@/components/units/card-loading";

// Hooks & API
import { useCreateUnit, useDeleteUnit, useUpdateUnit } from "@/services/api";
import { unitsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { FilterConfig } from "@/types/DataTable";
import type { ApiUnit } from "@/types/api";

// ── Form config ─────────────────────────────────────────────────────────
const getUnitFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "name",
      type: "input",
      label: t("form.name"),
      placeholder: t("form.namePlaceholder"),
      required: true,
      columnSpan: 12,
    },
    {
      name: "shortName",
      type: "input",
      label: t("form.shortName"),
      placeholder: t("form.shortNamePlaceholder"),
      columnSpan: 12,
    },
    {
      name: "status",
      type: "select",
      label: t("form.status"),
      required: true,
      columnSpan: 12,
      options: [
        { value: "active", label: t("form.statusActive") },
        { value: "inactive", label: t("form.statusInactive") },
      ],
    },
    {
      name: "isDefault",
      type: "checkbox",
      label: t("form.isDefault"),
      description: t("form.isDefaultDescription"),
      columnSpan: 12,
      defaultValue: false,
    },
  ],
});

// ── Filter config ───────────────────────────────────────────────────────
const getUnitFilterConfig = (t: Translator): FilterConfig => ({
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
      options: [
        { label: t("filters.statusActive"), value: "active" },
        { label: t("filters.statusInactive"), value: "inactive" },
      ],
    },
  ],
  viewMode: "popover",
});

const defaultValues = {
  name: "",
  shortName: "",
  status: "active" as const,
  isDefault: false,
};

export default function UnitsPage() {
  const t = useTranslations("products.units");
  const locale = useLocale() as AppLocale;
  const sharedOperations = {
    formConfig: getUnitFormConfig(t),
    defaultValues,
    getAllData: unitsApi.getAll,
    createMutation: useCreateUnit(),
    updateMutation: useUpdateUnit(),
    deleteMutation: useDeleteUnit(),
    queryKey: [...queryKeys.units.all()],
    entityName: "Unit" as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("page.title")}
        subTitle={t("page.subtitle")}
      />

      {/* Card View */}
      <DataCard<ApiUnit>
        cardTitle={(n) => t("page.allUnitsTitle", { count: n })}
        defaultPageSize={12}
        pageSizes={[12, 24, 48]}
        layoutConfig={{
          layout: "grid",
          columns: { default: 1, sm: 2, lg: 3 },
          gap: "md",
        }}
        filterConfig={getUnitFilterConfig(t)}
        renderCard={(item, actions) => UnitCardView(item, actions, { t, locale })}
        loadingRenderCard={UnitCardLoading}
        operations={sharedOperations}
      />
    </div>
  );
}
