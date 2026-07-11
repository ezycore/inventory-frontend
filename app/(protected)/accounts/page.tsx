"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

// Types
import type { Account } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DataCard } from "@/ui/components/dataCard";
import PageHeader from "@/ui/components/header";
import AccountCardView, { AccountCardSkeleton } from "@/components/accounts/cardview";
import InvestmentDialog from "@/components/accounts/investment-dialog";
import {
  Wallet,
  Building2,
  Smartphone,
  ArrowRightLeft,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/ui/components/button";
import Link from "next/link";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/ui/lib/utils";

// Hooks & API
import {
  useAccountSummary,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/services/api";
import { accountsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";

// ── Summary stat card config ──────────────────────────────────────────
interface SummaryItem {
  label: string;
  value: string;
  icon: typeof Wallet;
  gradient: string;
  iconBg: string;
  iconColor: string;
  description: string;
}

function getAccountStats(
  summary: Record<string, any> | undefined,
  format: (v: number) => string,
  t: Translator,
): SummaryItem[] {
  return [
    {
      label: t("stats.totalBalance"),
      value: format(summary?.totalBalance || 0),
      icon: TrendingUp,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      description: t("stats.totalBalanceDescription", { count: summary?.accountCount || 0 }),
    },
    {
      label: t("stats.cash"),
      value: format(summary?.byType?.cash || 0),
      icon: Wallet,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      description: t("stats.cashDescription"),
    },
    {
      label: t("stats.bank"),
      value: format(summary?.byType?.bank || 0),
      icon: Building2,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      description: t("stats.bankDescription"),
    },
    {
      label: t("stats.mobileBanking"),
      value: format(summary?.byType?.mfs || 0),
      icon: Smartphone,
      gradient: "from-violet-500/10 to-violet-500/5",
      iconBg: "bg-violet-50 dark:bg-violet-950/40",
      iconColor: "text-violet-600 dark:text-violet-400",
      description: t("stats.mobileBankingDescription"),
    },
  ];
}

// ── Premium summary banner ─────────────────────────────────────────────
function AccountSummaryBanner({
  stats,
  isLoading,
}: {
  stats: SummaryItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[108px] rounded-2xl border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-card p-5",
              "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
            )}
          >
            {/* subtle gradient bg */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-60",
                stat.gradient,
              )}
            />
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  {stat.description}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  stat.iconBg,
                  "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
                )}
              >
                <Icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const getAccountFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "name",
      type: "input",
      label: t("form.name"),
      placeholder: t("form.namePlaceholder"),
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
        { value: "cash", label: t("form.typeCash") },
        { value: "bank", label: t("form.typeBank") },
        { value: "mfs", label: t("form.typeMfs") },
        { value: "custom", label: t("form.typeCustom") },
      ],
    },
    {
      name: "balance",
      type: "number",
      label: t("form.balance"),
      placeholder: t("form.balancePlaceholder"),
      columnSpan: 6,
      helperText: t("form.balanceHint"),
    },
    {
      name: "accountNumber",
      type: "input",
      label: t("form.accountNumber"),
      placeholder: t("form.accountNumberPlaceholder"),
      columnSpan: 6,
    },
    //status field
    {
      name: "status",
      type: "select",
      label: t("form.status"),
      columnSpan: 6,
      options: [
        { value: "active", label: t("form.statusActive") },
        { value: "inactive", label: t("form.statusInactive") },
      ],
    },
    {
      name: "isDefault",
      type: "checkbox",
      label: t("form.isDefault"),
      columnSpan: 12,
    },
    {
      name: "description",
      type: "textarea",
      label: t("form.description"),
      placeholder: t("form.descriptionPlaceholder"),
      columnSpan: 12,
    },
  ],
});

const getAccountFilterConfig = (t: Translator): FilterConfig => ({
  fields: [
    {
      name: "search",
      label: t("page.searchLabel"),
      type: "text",
      placeholder: t("page.searchPlaceholder"),
    },
    {
      name: "type",
      label: t("filters.typeLabel"),
      type: "select",
      placeholder: t("filters.typePlaceholder"),
      options: [
        { label: t("form.typeCash"), value: "cash" },
        { label: t("form.typeBank"), value: "bank" },
        { label: t("form.typeMfs"), value: "mfs" },
        { label: t("form.typeCustom"), value: "custom" },
      ],
    },
    {
      name: "status",
      label: t("filters.statusLabel"),
      type: "select",
      placeholder: t("filters.statusPlaceholder"),
      options: [
        { label: t("form.statusActive"), value: "active" },
        { label: t("form.statusInactive"), value: "inactive" },
      ],
    },
  ],
  viewMode: "popover",
});

const defaultValues = {
  name: "",
  type: "cash" as const,
  initialBalance: 0,
  accountNumber: "",
  isDefault: false,
  status: "active" as const,
  description: "",
};

export default function AccountsPage() {
  const t = useTranslations("accounts.accounts");
  const { format } = useCurrency();
  const router = useRouter();
  const { data: summary, isLoading: summaryLoading } = useAccountSummary();

  const [investmentTarget, setInvestmentTarget] = useState<Account | null>(
    null,
  );

  const sharedOperations = {
    formConfig: getAccountFormConfig(t),
    defaultValues,
    getAllData: accountsApi.getAll,
    createMutation: useCreateAccount(),
    updateMutation: useUpdateAccount(),
    deleteMutation: useDeleteAccount(),
    queryKey: [...queryKeys.accounts.all()],
    entityName: t("page.entity"),
  };

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <PageHeader
          title={t("page.title")}
          subTitle={t("page.subtitle")}
        />
        <Link href="/accounts/transactions">
          <Button variant="outline" className="rounded-xl">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            {t("page.transactions")}
          </Button>
        </Link>
      </div>

      {/* ── Stats summary ───────────────────────────────────────── */}
      <AccountSummaryBanner
        stats={getAccountStats(summary, format, t)}
        isLoading={summaryLoading}
      />

      {/* ── Account cards ───────────────────────────────────────── */}
      <DataCard
        cardTitle={(n: number) => t("page.allAccountsCount", { count: n })}
        filterConfig={getAccountFilterConfig(t)}
        renderCard={(row: Account, actions) => (
          <AccountCardView
            item={row}
            actions={{
              onEdit: () => actions.onEdit?.(),
              onDelete: () => actions.onDelete?.(),
              onAddInvestment: () => setInvestmentTarget(row),
              onViewTransactions: () =>
                router.push(`/accounts/transactions?accountId=${row._id}`),
            }}
          />
        )}
        loadingRenderCard={() => <AccountCardSkeleton />}
        layoutConfig={{
          columns: { default: 1, md: 2, xl: 3 },
          gap: "lg",
        }}
        operations={sharedOperations}
      />

      {/* ── Add investment dialog ───────────────────────────────── */}
      <InvestmentDialog
        account={investmentTarget}
        onClose={() => setInvestmentTarget(null)}
      />
    </div>
  );
}
