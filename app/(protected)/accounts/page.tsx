"use client";

import { useState } from "react";
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
): SummaryItem[] {
  return [
    {
      label: "Total Balance",
      value: format(summary?.totalBalance || 0),
      icon: TrendingUp,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      description: `Across ${summary?.accountCount || 0} accounts`,
    },
    {
      label: "Cash",
      value: format(summary?.byType?.cash || 0),
      icon: Wallet,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      description: "Cash accounts",
    },
    {
      label: "Bank",
      value: format(summary?.byType?.bank || 0),
      icon: Building2,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      description: "Bank balances",
    },
    {
      label: "Mobile Banking",
      value: format(summary?.byType?.mfs || 0),
      icon: Smartphone,
      gradient: "from-violet-500/10 to-violet-500/5",
      iconBg: "bg-violet-50 dark:bg-violet-950/40",
      iconColor: "text-violet-600 dark:text-violet-400",
      description: "Mobile Financial Service",
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

const accountFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Account Name",
      placeholder: "e.g., Main Cash, Business Bank Account",
      required: true,
      columnSpan: 6,
    },
    {
      name: "type",
      type: "select",
      label: "Account Type",
      required: true,
      columnSpan: 6,
      options: [
        { value: "cash", label: "Cash" },
        { value: "bank", label: "Bank Account" },
        { value: "mfs", label: "Mobile Financial Service" },
        { value: "custom", label: "Custom" },
      ],
    },
    {
      name: "balance",
      type: "number",
      label: "Balance",
      placeholder: "Enter opening balance",
      columnSpan: 6,
      helperText: "Set initial balance for new accounts (cannot be changed later)",
    },
    {
      name: "accountNumber",
      type: "input",
      label: "Account Number",
      placeholder: "Enter account/card number",
      columnSpan: 6,
    },
    //status field
    {
      name: "status",
      type: "select",
      label: "Status",
      columnSpan: 6,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      name: "isDefault",
      type: "checkbox",
      label: "Set as Default Account",
      columnSpan: 12,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "Optional notes about this account",
      columnSpan: 12,
    },
  ],
};

const accountFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search accounts",
      type: "text",
      placeholder: "Search accounts...",
    },
    {
      name: "type",
      label: "Account Type",
      type: "select",
      placeholder: "All types",
      options: [
        { label: "Cash", value: "cash" },
        { label: "Bank", value: "bank" },
        { label: "Mobile Financial Service", value: "mfs" },
        { label: "Custom", value: "custom" },
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
  type: "cash" as const,
  initialBalance: 0,
  accountNumber: "",
  isDefault: false,
  status: "active" as const,
  description: "",
};

export default function AccountsPage() {
  const { format } = useCurrency();
  const router = useRouter();
  const { data: summary, isLoading: summaryLoading } = useAccountSummary();

  const [investmentTarget, setInvestmentTarget] = useState<Account | null>(
    null,
  );

  const sharedOperations = {
    formConfig: accountFormConfig,
    defaultValues,
    getAllData: accountsApi.getAll,
    createMutation: useCreateAccount(),
    updateMutation: useUpdateAccount(),
    deleteMutation: useDeleteAccount(),
    queryKey: [...queryKeys.accounts.all()],
    entityName: "Account",
  };

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Accounts"
          subTitle="Manage your cash, bank, and mobile wallet accounts"
        />
        <Link href="/accounts/transactions">
          <Button variant="outline" className="rounded-xl">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transactions
          </Button>
        </Link>
      </div>

      {/* ── Stats summary ───────────────────────────────────────── */}
      <AccountSummaryBanner
        stats={getAccountStats(summary, format)}
        isLoading={summaryLoading}
      />

      {/* ── Account cards ───────────────────────────────────────── */}
      <DataCard
        cardTitle={(n: number) => `All Accounts (${n})`}
        filterConfig={accountFilterConfig}
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
