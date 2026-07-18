"use client";
// coding-standard: maintained

import { useTranslations, useLocale } from "next-intl";

// UI Components
import { DataCard } from "@/ui/components/dataCard";
import PageHeader from "@/ui/components/header";
import StatsCard, { type StatData } from "@/ui/components/StatsCard";
import DiscountCardView from "@/components/discounts/cardview";
import DiscountCardLoading from "@/components/discounts/card-loading";

// Hooks & API
import {
  useCreateDiscount,
  useDeleteDiscount,
  useUpdateDiscount,
  useDiscountStats,
} from "@/services/api";
import { discountsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { FilterConfig } from "@/types/DataTable";
import type { Translator, AppLocale } from "@/i18n/config";
import { CheckCircle2, Hash, Percent, Tag } from "lucide-react";
import { getDiscountFormConfig } from "@/components/discounts/form-config";

// ── Stats helper ────────────────────────────────────────────────────────
function getDiscountStats(stats: Record<string, any> | undefined, t: Translator): StatData[] {
  return [
    {
      label: t("stats.total"),
      value: stats?.total || 0,
      icon: Tag,
      variant: "primary",
      description: t("stats.totalDescription"),
    },
    {
      label: t("stats.active"),
      value: stats?.active || 0,
      icon: CheckCircle2,
      variant: "success",
      description: t("stats.activeDescription"),
    },
    {
      label: t("stats.percentage"),
      value: stats?.percentage || 0,
      icon: Percent,
      variant: "info",
      description: t("stats.percentageDescription"),
    },
    {
      label: t("stats.fixed"),
      value: stats?.fixed || 0,
      icon: Hash,
      variant: "warning",
      description: t("stats.fixedDescription"),
    },
  ];
}

// ── Filter config ───────────────────────────────────────────────────────
const getDiscountFilterConfig = (t: Translator): FilterConfig => ({
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
      name: "applicableTo",
      label: t("filters.applicableLabel"),
      type: "select",
      placeholder: t("filters.applicablePlaceholder"),
      options: [
        { label: t("filters.applicableSales"), value: "sales" },
        { label: t("filters.applicablePurchase"), value: "purchase" },
        { label: t("filters.applicableBoth"), value: "both" },
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
  value: 0,
  type: "percentage" as const,
  applicableTo: "both" as const,
  isDefaultSales: false,
  isDefaultPurchase: false,
  status: "active" as const,
  description: "",
};

export default function DiscountsPage() {
  const t = useTranslations("settings.discounts");
  const locale = useLocale() as AppLocale;
  const { data: statsData, isLoading: statsLoading } = useDiscountStats();

  const sharedOperations = {
    formConfig: getDiscountFormConfig(t),
    defaultValues,
    getAllData: discountsApi.getAll,
    createMutation: useCreateDiscount(),
    updateMutation: useUpdateDiscount(),
    deleteMutation: useDeleteDiscount(),
    queryKey: [...queryKeys.discounts.all()],
    entityName: "Discount" as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />

      {/* Stats Cards */}
      <StatsCard
        data={getDiscountStats(statsData, t)}
        isLoading={statsLoading}
      />

      {/* Card View */}
      <DataCard
        cardTitle={(n) => t("allDiscountsCount", { count: n })}
        defaultPageSize={12}
        pageSizes={[12, 24, 48]}
        layoutConfig={{
          layout: "grid",
          columns: { default: 1, sm: 2, lg: 3 },
          gap: "md",
        }}
        filterConfig={getDiscountFilterConfig(t)}
        renderCard={(item, actions) => DiscountCardView(item, actions, { t, locale })}
        loadingRenderCard={DiscountCardLoading}
        operations={sharedOperations}
      />
    </div>
  );
}
