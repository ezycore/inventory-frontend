"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/services/stores";
import type { AppLocale } from "@/i18n/config";

// Types
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DataCard } from "@/ui/components/dataCard";
import PageHeader from "@/ui/components/header";
import TaxCardView from "@/components/taxes/cardview";
import TaxCardLoading from "@/components/taxes/card-loading";

// Hooks & API
import { useCreateTax, useDeleteTax, useUpdateTax } from "@/services/api";
import { taxesApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { FilterConfig } from "@/types/DataTable";

// ── Form config ─────────────────────────────────────────────────────────
const getTaxFormConfig = (t: (key: string) => string): DynamicFormConfig => ({
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
      name: "rate",
      type: "number",
      label: t("form.rate"),
      placeholder: t("form.ratePlaceholder"),
      required: true,
      columnSpan: 6,
    },
    {
      name: "type",
      type: "select",
      label: t("form.type"),
      required: true,
      columnSpan: 6,
      options: [
        { value: "percentage", label: t("form.percentage") },
        { value: "fixed", label: t("form.fixed") },
      ],
    },
    {
      name: "status",
      type: "select",
      label: t("form.status"),
      required: true,
      columnSpan: 12,
      options: [
        { value: "active", label: t("form.active") },
        { value: "inactive", label: t("form.inactive") },
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
const getTaxFilterConfig = (t: (key: string) => string): FilterConfig => ({
  fields: [
    {
      name: "search",
      label: t("filters.searchLabel"),
      type: "text",
      placeholder: t("filters.searchPlaceholder"),
    },
    {
      name: "type",
      label: t("filters.typeLabel"),
      type: "select",
      placeholder: t("filters.typePlaceholder"),
      options: [
        { label: t("form.percentage"), value: "percentage" },
        { label: t("form.fixed"), value: "fixed" },
      ],
    },
    {
      name: "status",
      label: t("filters.statusLabel"),
      type: "select",
      placeholder: t("filters.statusPlaceholder"),
      options: [
        { label: t("form.active"), value: "active" },
        { label: t("form.inactive"), value: "inactive" },
      ],
    },
  ],
  viewMode: "popover",
});

const defaultValues = {
  name: "",
  rate: 0,
  type: "percentage" as const,
  status: "active" as const,
  isDefault: false,
};

export default function TaxesPage() {
  const t = useTranslations("settings.taxRates");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { user } = useAuthStore();
  const isTaxEnabled = user?.organization?.features?.tax ?? false;

  // Tax management is feature-gated. Direct URL hits redirect home when off
  // (the nav entry is already hidden and the API returns 403).
  useEffect(() => {
    if (user && !isTaxEnabled) {
      router.replace("/");
    }
  }, [user, isTaxEnabled, router]);

  const sharedOperations = {
    formConfig: getTaxFormConfig(t),
    defaultValues,
    getAllData: taxesApi.getAll,
    createMutation: useCreateTax(),
    updateMutation: useUpdateTax(),
    deleteMutation: useDeleteTax(),
    queryKey: [...queryKeys.taxes.all()],
    entityName: "Tax" as const,
  };

  if (!isTaxEnabled) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />

      {/* Card View */}
      <DataCard
        cardTitle={(n) => t("allTaxesCount", { count: n })}
        defaultPageSize={12}
        pageSizes={[12, 24, 48]}
        layoutConfig={{
          layout: "grid",
          columns: { default: 1, sm: 2, lg: 3 },
          gap: "md",
        }}
        filterConfig={getTaxFilterConfig(t)}
        searchConfig={{ globalSearch: true, placeholder: t("searchPlaceholder") }}
        renderCard={(item, actions) => TaxCardView(item, actions, { t, locale })}
        loadingRenderCard={TaxCardLoading}
        operations={sharedOperations}
      />
    </div>
  );
}
