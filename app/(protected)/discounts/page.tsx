"use client";

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
import { CheckCircle2, Hash, Percent, Tag } from "lucide-react";
import { discountFormConfig } from "@/components/discounts/form-config";

// ── Stats helper ────────────────────────────────────────────────────────
function getDiscountStats(stats: Record<string, any> | undefined): StatData[] {
  return [
    {
      label: "Total Discounts",
      value: stats?.total || 0,
      icon: Tag,
      variant: "primary",
      description: "All registered discounts",
    },
    {
      label: "Active",
      value: stats?.active || 0,
      icon: CheckCircle2,
      variant: "success",
      description: "Currently active",
    },
    {
      label: "Percentage",
      value: stats?.percentage || 0,
      icon: Percent,
      variant: "info",
      description: "Percentage type",
    },
    {
      label: "Fixed Amount",
      value: stats?.fixed || 0,
      icon: Hash,
      variant: "warning",
      description: "Fixed amount type",
    },
  ];
}

// ── Filter config ───────────────────────────────────────────────────────
const discountFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search discounts",
      type: "text",
      placeholder: "Search discounts...",
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      placeholder: "All types",
      options: [
        { label: "Percentage", value: "percentage" },
        { label: "Fixed", value: "fixed" },
      ],
    },
    {
      name: "applicableTo",
      label: "Applicable To",
      type: "select",
      placeholder: "All",
      options: [
        { label: "Sales", value: "sales" },
        { label: "Purchase", value: "purchase" },
        { label: "Both", value: "both" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ],
  viewMode: "popover",
};

const defaultValues = {
  name: "",
  value: 0,
  type: "percentage" as const,
  applicableTo: "both" as const,
  status: "active" as const,
  description: "",
};

const searchConfig = {
  globalSearch: true,
  placeholder: "Search discounts by name...",
};

export default function DiscountsPage() {
  const { data: statsData, isLoading: statsLoading } = useDiscountStats();

  const sharedOperations = {
    formConfig: discountFormConfig,
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
        title="Discount Management"
        subTitle="Configure discount rates for sales and purchase transactions"
      />

      {/* Stats Cards */}
      <StatsCard
        data={getDiscountStats(statsData)}
        isLoading={statsLoading}
      />

      {/* Card View */}
      <DataCard
        cardTitle={(n) => `All Discounts (${n})`}
        defaultPageSize={12}
        pageSizes={[12, 24, 48]}
        layoutConfig={{
          layout: "grid",
          columns: { default: 1, sm: 2, lg: 3 },
          gap: "md",
        }}
        filterConfig={discountFilterConfig}
        searchConfig={searchConfig}
        renderCard={DiscountCardView}
        loadingRenderCard={DiscountCardLoading}
        operations={sharedOperations}
      />
    </div>
  );
}
