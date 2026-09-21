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
import { PeriodFilter } from '@/components/shared/period-filter';
import {
  getTransactionColumns,
  getTransactionFilterConfig,
  isReversible,
  transactionTypeColorMap,
} from "@/components/accounts/transactions/columns";
import {
  ExpenseDialog,
  IncomeDialog,
  TransferDialog,
  useCanPostCapital,
} from "@/components/accounts/transactions/transaction-dialogs";
import { ReverseTransactionDialog } from "@/components/accounts/transactions/reverse-transaction-dialog";
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
import { useAuthStore } from "@/services/stores";
import type { ApiTransaction } from "@/types/api";
import { Undo2 } from "lucide-react";

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
  const { user } = useAuthStore();
  const canPostCapital = useCanPostCapital();
  const [reverseTarget, setReverseTarget] = useState<ApiTransaction | null>(null);
  // ── Period filter state (reuses dashboard pattern) ──
  const [period, setPeriod] = useState<DashboardPeriod>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const isCustomValid = period !== "custom" || (!!customStart && !!customEnd);

  const statsParams = useMemo<TransactionStatsParams | undefined>(() => {
    if (!isCustomValid) return undefined;
    // Week boundaries are the organization's `weekStartDay`, read server-side.
    const params: TransactionStatsParams = { period };
    if (period === "custom" && customStart && customEnd) {
      params.startDate = customStart;
      params.endDate = customEnd;
    }
    return params;
  }, [period, customStart, customEnd, isCustomValid]);

  // Fetch stats to get resolved date range for table filtering
  const { data: stats } = useTransactionStats(statsParams);

  const columns = getTransactionColumns(format, tColumns);

  // Wrap getAllData to inject the period and account scope so the table only shows filtered rows.
  // No manual memoization: the React Compiler infers a more precise dependency
  // than a hand-written array, so we let the compiler memoize this for us.
  const getAllDataWithPeriod = (filters: Record<string, unknown>) => {
    const merged: Record<string, unknown> = { ...filters };
    // Scope to a single account when navigated from an account card.
    if (accountId) {
      merged.accountId = accountId;
    }
    // Scope to the selected period. Without this the cards read "This Month" while the table
    // below listed every transaction ever — the resolved range was fetched and then never sent.
    // The stats range END is exclusive (`$lt`) and the list filter is inclusive (`$lte`), so step
    // back 1 ms: passing the instant through would let a midnight row into both periods.
    if (stats?.period) {
      merged.startDate = stats.period.startDate;
      merged.endDate = new Date(
        new Date(stats.period.endDate).getTime() - 1,
      ).toISOString();
    }
    return transactionsApi.getAll(merged);
  };

  // Server-side sorting. The backend forwards `sort_by`/`sort_order` into the ledger query, so
  // these reorder the whole result set — client-side sorting only ever reordered the current page.
  // Only fields that are also columns belong here: the list is what makes a header sortable.
  const sortingConfig = {
    sortOptions: [
      { field: "date", label: tColumns("columns.date") },
      { field: "amount", label: tColumns("columns.amount") },
    ],
    defaultSortBy: "date",
    defaultSortOrder: "desc" as const,
  };

  // The ledger has no edit and no delete: a correction is a compensating line. Offered only where
  // the API will accept it, and only to a user who could have posted the original.
  const canCreate = user?.permissions?.includes("transactions.create") ?? false;
  const reverseAction = canCreate
    ? [
        {
          type: "reverse",
          placement: "cell" as const,
          icon: <Undo2 className="h-4 w-4" />,
          tooltip: tColumns("reverse.action"),
          onClick: (row: ApiTransaction) => setReverseTarget(row),
          hidden: (row: ApiTransaction) =>
            !isReversible(row) || (row.kind === "equity" && !canPostCapital),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Three action buttons plus the title exceed a phone viewport on one row, and the
          overflow scrolls the whole page sideways — stack them below the header on mobile. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <PageHeader
            title={t("title")}
            subTitle={t("subtitle")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
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

      <DataTable<ApiTransaction>
        cardTitle={(n: number) => t("allTransactionsCount", { count: n })}
        defaultPageSize={20}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={getTransactionFilterConfig(tColumns)}
        columns={columns}
        enableSorting
        sortingConfig={sortingConfig}
        customActions={reverseAction}
        rowClassName={(row) => transactionTypeColorMap[row.type] || ""}
        operations={{
          getAllData: getAllDataWithPeriod,
          queryKey: [...queryKeys.transactions.all(), { periodStart: stats?.period?.startDate, periodEnd: stats?.period?.endDate, accountId }],
          entityName: t("entity"),
        }}
      />

      <ReverseTransactionDialog
        transaction={reverseTarget}
        onClose={() => setReverseTarget(null)}
      />
    </div>
  );
}
