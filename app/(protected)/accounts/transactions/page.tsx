"use client";
// coding-standard: maintained

import { Suspense, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wallet } from "lucide-react";
import type { DashboardPeriod } from "@/services/api";
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import { Button } from "@/ui/components/button";
import { useCurrency } from "@/lib/currency";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import {
  getTransactionColumns,
  getTransactionFilterConfig,
  transactionTypeColorMap,
} from "@/components/accounts/transactions/columns";
import {
  ExpenseDialog,
  IncomeDialog,
  TransferDialog,
} from "@/components/accounts/transactions/transaction-dialogs";
import {
  TransactionStatsSection,
  type TransactionStatsParams,
} from "@/components/accounts/transactions/transaction-stats-section";
import {
  transactionsApi,
  useAccount,
  useTransactionStats,
} from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const t = useTranslations("accounts.transactions.page");
  const tColumns = useTranslations("accounts.transactions");
  const { format } = useCurrency();

  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") || undefined;
  const { data: scopedAccount } = useAccount(accountId ?? "");
  // ── Period filter state (reuses dashboard pattern) ──
  const [period, setPeriod] = useState<DashboardPeriod>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const isCustomValid = period !== "custom" || (!!customStart && !!customEnd);

  const statsParams = useMemo<TransactionStatsParams | undefined>(() => {
    if (!isCustomValid) return undefined;
    const params: TransactionStatsParams = { period, weekStartDay: 1 };
    if (period === "custom" && customStart && customEnd) {
      params.startDate = customStart;
      params.endDate = customEnd;
    }
    return params;
  }, [period, customStart, customEnd, isCustomValid]);

  // Fetch stats to get resolved date range for table filtering
  const { data: stats } = useTransactionStats(statsParams);

  const columns = getTransactionColumns(format, tColumns);

  // Wrap getAllData to inject the account scope so the table only shows filtered rows.
  // No manual memoization: the React Compiler infers a more precise dependency
  // than a hand-written array, so we let the compiler memoize this for us.
  const getAllDataWithPeriod = (filters: Record<string, unknown>) => {
    const merged: Record<string, unknown> = { ...filters };
    // Scope to a single account when navigated from an account card.
    if (accountId) {
      merged.accountId = accountId;
    }
    return transactionsApi.getAll(merged);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={t("title")}
          subTitle={t("subtitle")}
        />
        <div className="flex gap-2">
          <TransferDialog />
          <ExpenseDialog />
          <IncomeDialog />
        </div>
      </div>

      {accountId && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2 text-sm">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t("showingFor")}</span>
          <span className="font-semibold">
            {scopedAccount?.name ?? t("selectedAccount")}
          </span>
          <Link href="/accounts/transactions" className="ml-auto">
            <Button variant="ghost" size="sm">
              {t("clearFilter")}
            </Button>
          </Link>
        </div>
      )}

      {/* Period Filter */}
      <PeriodFilter
        period={period}
        setPeriod={setPeriod}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        periodInfo={stats?.period ? { ...stats.period, key: stats.period.key as DashboardPeriod } : undefined}
      />

      <TransactionStatsSection statsParams={statsParams} />

      <DataTable
        cardTitle={(n: number) => t("allTransactionsCount", { count: n })}
        defaultPageSize={20}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={getTransactionFilterConfig(tColumns)}
        columns={columns}
        enableSorting
        rowClassName={(row) => transactionTypeColorMap[row.type] || ""}
        operations={{
          getAllData: getAllDataWithPeriod,
          queryKey: [...queryKeys.transactions.all(), { periodStart: stats?.period?.startDate, periodEnd: stats?.period?.endDate, accountId }],
          entityName: t("entity"),
        }}
      />
    </div>
  );
}
