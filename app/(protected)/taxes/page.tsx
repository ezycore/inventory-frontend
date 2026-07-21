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
import type { ApiTax } from "@/types/api";

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
      // What KIND of supply this rate represents. Not cosmetic: zero-rated and
      // exempt are both 0%, but only zero-rated allows an input rebate and they
      // sit in different boxes on the মূসক 9.1. Without this field a merchant
      // cannot create an exempt or zero-rated rate at all.
      name: "vatCategory",
      type: "select",
      label: t("form.vatCategory"),
      description: t("form.vatCategoryDescription"),
      required: true,
      columnSpan: 6,
      options: [
        { value: "standard", label: t("form.categories.standard") },
        { value: "reduced", label: t("form.categories.reduced") },
        { value: "zero_rated", label: t("form.categories.zero_rated") },
        { value: "exempt", label: t("form.categories.exempt") },
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
      name: "vatCategory",
      label: t("filters.categoryLabel"),
      type: "select",
      placeholder: t("filters.categoryPlaceholder"),
      options: [
        { label: t("form.categories.standard"), value: "standard" },
        { label: t("form.categories.reduced"), value: "reduced" },
        { label: t("form.categories.zero_rated"), value: "zero_rated" },
        { label: t("form.categories.exempt"), value: "exempt" },
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
  vatCategory: "standard" as const,
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
      {/* Explicit generic: without it TData infers as `{ _id: string }` and the
          card renderer silently accepts anything — which is how a removed field
          went unnoticed. */}
      <DataCard<ApiTax>
        cardTitle={(n) => t("allTaxesCount", { count: n })}
        defaultPageSize={12}
        pageSizes={[12, 24, 48]}
        layoutConfig={{
          layout: "grid",
          columns: { default: 1, sm: 2, lg: 3 },
          gap: "md",
        }}
        filterConfig={getTaxFilterConfig(t)}
        renderCard={(item, actions) => TaxCardView(item, actions, { t, locale })}
        loadingRenderCard={TaxCardLoading}
        operations={sharedOperations}
      />
    </div>
  );
}
