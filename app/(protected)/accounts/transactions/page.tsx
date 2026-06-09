"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Types
import type { Transaction } from "@/types";
import type { StatData } from "@/ui/components/StatsCard";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { DashboardPeriod } from "@/services/api";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { DateCell } from "@/ui/components/dataTable/cells";
import PageHeader from "@/ui/components/header";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import DynamicForm from "@/ui/components/form";
import StatsCard from "@/ui/components/StatsCard";
import { AreaChart } from "@/ui/components/charts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency";

// Dashboard reusables
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { formatPeriodLabel } from "@/components/dashboard/helpers";

// Hooks & API
import {
  useCreateIncome,
  useCreateExpense,
  useCreateTransfer,
  useTransactionStats,
  useAccount,
} from "@/services/api";
import { FilterConfig } from "@/types/DataTable";
import { transactionsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";

const getTransactionTypeIcon = (type: string) => {
  switch (type) {
    case "income":
      return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
    case "expense":
      return <ArrowUpCircle className="h-4 w-4 text-red-500" />;
    case "transfer":
      return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    sale: "Sale",
    purchase: "Purchase",
    salary: "Salary",
    rent: "Rent",
    utilities: "Utilities",
    refund: "Refund",
    adjustment: "Adjustment",
    transfer: "Transfer",
    investment: "Investment",
    other: "Other",
  };
  return labels[category] || category;
};

const transactionFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search",
      type: "text",
      placeholder: "Search transactions...",
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      placeholder: "All types",
      options: [
        { label: "Income", value: "income" },
        { label: "Expense", value: "expense" },
        { label: "Transfer", value: "transfer" },
      ],
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      placeholder: "All categories",
      options: [
        { label: "Sale", value: "sale" },
        { label: "Purchase", value: "purchase" },
        { label: "Salary", value: "salary" },
        { label: "Rent", value: "rent" },
        { label: "Utilities", value: "utilities" },
        { label: "Refund", value: "refund" },
        { label: "Adjustment", value: "adjustment" },
        { label: "Investment", value: "investment" },
        { label: "Other", value: "other" },
      ],
    },
  ],
  viewMode: "popover",
};

// Form Schemas
const incomeSchema = z.object({
  accountId: z.string().min(1, "Select an account"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Select a category"),
  description: z.string().optional(),
  reference: z.string().optional(),
});

const expenseSchema = z.object({
  accountId: z.string().min(1, "Select an account"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Select a category"),
  description: z.string().optional(),
  reference: z.string().optional(),
});

const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Select source account"),
  toAccountId: z.string().min(1, "Select destination account"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  reference: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;
type ExpenseFormData = z.infer<typeof expenseSchema>;
type TransferFormData = z.infer<typeof transferSchema>;

const categories = [
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "salary", label: "Salary" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "refund", label: "Refund" },
  { value: "adjustment", label: "Adjustment" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

// Dynamic form configs
const incomeFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "accountId",
      type: "select",
      label: "Account",
      placeholder: "Select account",
      required: true,
      columnSpan: 12,
      optionsApi: "/accounts",
    },
    {
      name: "amount",
      type: "number",
      label: "Amount",
      placeholder: "Enter amount",
      required: true,
      columnSpan: 6,
    },
    {
      name: "category",
      type: "select",
      label: "Category",
      placeholder: "Select category",
      required: true,
      columnSpan: 6,
      options: categories,
    },
    {
      name: "reference",
      type: "input",
      label: "Reference (Optional)",
      placeholder: "Invoice/receipt number",
      columnSpan: 6,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description (Optional)",
      placeholder: "Add a note...",
      columnSpan: 12,
    },
  ],
};

const expenseFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "accountId",
      type: "select",
      label: "Account",
      placeholder: "Select account",
      required: true,
      columnSpan: 12,
      optionsApi: "/accounts",
    },
    {
      name: "amount",
      type: "number",
      label: "Amount",
      placeholder: "Enter amount",
      required: true,
      columnSpan: 6,
    },
    {
      name: "category",
      type: "select",
      label: "Category",
      placeholder: "Select category",
      required: true,
      columnSpan: 6,
      options: categories,
    },
    {
      name: "reference",
      type: "input",
      label: "Reference (Optional)",
      placeholder: "Invoice/receipt number",
      columnSpan: 6,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description (Optional)",
      placeholder: "Add a note...",
      columnSpan: 12,
    },
  ],
};

const transferFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "fromAccountId",
      type: "select",
      label: "From Account",
      placeholder: "Select source account",
      required: true,
      columnSpan: 6,
      optionsApi: "/accounts",
    },
    {
      name: "toAccountId",
      type: "select",
      label: "To Account",
      placeholder: "Select destination account",
      required: true,
      columnSpan: 6,
      optionsApi: "/accounts",
    },
    {
      name: "amount",
      type: "number",
      label: "Amount",
      placeholder: "Enter amount",
      required: true,
      columnSpan: 6,
    },
    {
      name: "reference",
      type: "input",
      label: "Reference (Optional)",
      placeholder: "Transfer reference",
      columnSpan: 6,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description (Optional)",
      placeholder: "Add a note...",
      columnSpan: 12,
    },
  ],
};

function TransactionStatsSection({
  statsParams,
}: {
  statsParams?: { period?: string; weekStartDay?: number; startDate?: string; endDate?: string };
}) {
  const { data: stats, isLoading } = useTransactionStats(statsParams);
  const { format } = useCurrency();

  // Dynamic trend label based on period
  const trendLabel = stats?.period
    ? `vs previous ${stats.period.chartGrouping === "hourly" ? "day" : stats.period.key === "thisWeek" ? "week" : stats.period.key === "thisMonth" ? "month" : "period"}`
    : "vs previous period";

  // Dynamic chart subtitle
  const chartSubtitle = stats?.period
    ? `${formatPeriodLabel(stats.period)} – ${stats.period.chartGrouping} breakdown`
    : "";

  const statData: StatData[] = [
    {
      label: "Total Income",
      value: stats ? format(stats.totalIncome) : "0",
      icon: TrendingUp,
      variant: "success",
      trend: stats
        ? {
            value: `${stats.incomeTrend >= 0 ? "+" : ""}${stats.incomeTrend}%`,
            direction: stats.incomeTrend >= 0 ? "up" : "down",
            label: trendLabel,
          }
        : undefined,
      prefix: "+",
    },
    {
      label: "Total Expense",
      value: stats ? format(stats.totalExpense) : "0",
      icon: TrendingDown,
      variant: "destructive",
      trend: stats
        ? {
            value: `${stats.expenseTrend >= 0 ? "+" : ""}${stats.expenseTrend}%`,
            direction: stats.expenseTrend >= 0 ? "up" : "down",
            label: trendLabel,
          }
        : undefined,
      prefix: "-",
    },
    {
      label: "Transfers",
      value: stats ? format(stats.totalTransfers) : "0",
      icon: ArrowRightLeft,
      variant: "info",
    },
    {
      label: "Net Change",
      value: stats ? format(Math.abs(stats.netChange)) : "0",
      icon: Wallet,
      variant: stats && stats.netChange >= 0 ? "success" : "destructive",
      trend: stats
        ? {
            value: `${stats.netTrend >= 0 ? "+" : ""}${stats.netTrend}%`,
            direction: stats.netTrend >= 0 ? "up" : "down",
            label: trendLabel,
          }
        : undefined,
      prefix: stats && stats.netChange >= 0 ? "+" : "-",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCard
        data={statData}
        isLoading={isLoading}
        columns={{ default: 1, sm: 2, lg: 4 }}
      />

      {/* Income vs Expense Area Chart */}
      <AreaChart
        data={stats?.chartData || []}
        series={[
          {
            dataKey: "income",
            name: "Income",
            color: "var(--color-chart-2)",
          },
          {
            dataKey: "expense",
            name: "Expense",
            color: "var(--color-destructive)",
          },
        ]}
        title="Income vs Expense"
        subtitle={chartSubtitle}
        height={280}
        className="overflow-hidden"
        tooltipFormatter={(v) => format(v)}
      />
    </div>
  );
}

function IncomeDialog() {
  const [open, setOpen] = useState(false);
  const createIncome = useCreateIncome();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      accountId: "",
      amount: 0,
      category: "sale",
      description: "",
      reference: "",
    },
  });

  const handleSuccess = () => {
    form.reset();
    setOpen(false);
  };

  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <ArrowDownCircle className="mr-2 h-4 w-4" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Income</DialogTitle>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={incomeFormConfig}
          mutationHook={createIncome}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          submitLabel="Record Income"
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}

function ExpenseDialog() {
  const [open, setOpen] = useState(false);
  const createExpense = useCreateExpense();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      accountId: "",
      amount: 0,
      category: "purchase",
      description: "",
      reference: "",
    },
  });

  const handleSuccess = () => {
    form.reset();
    setOpen(false);
  };

  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <ArrowUpCircle className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={expenseFormConfig}
          mutationHook={createExpense}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          submitLabel="Record Expense"
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog() {
  const [open, setOpen] = useState(false);
  const createTransfer = useCreateTransfer();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: 0,
      description: "",
      reference: "",
    },
  });

  const handleSuccess = () => {
    form.reset();
    setOpen(false);
  };

  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer Between Accounts</DialogTitle>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={transferFormConfig}
          mutationHook={createTransfer}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          submitLabel="Complete Transfer"
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const { format } = useCurrency();

  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") || undefined;
  const { data: scopedAccount } = useAccount(accountId ?? "");
  // ── Period filter state (reuses dashboard pattern) ──
  const [period, setPeriod] = useState<DashboardPeriod>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const isCustomValid = period !== "custom" || (!!customStart && !!customEnd);

  const statsParams = useMemo(() => {
    if (!isCustomValid) return undefined;
    const params: {
      period: string;
      weekStartDay: number;
      startDate?: string;
      endDate?: string;
    } = { period, weekStartDay: 1 };
    if (period === "custom" && customStart && customEnd) {
      params.startDate = customStart;
      params.endDate = customEnd;
    }
    return params;
  }, [period, customStart, customEnd, isCustomValid]);

  // Fetch stats to get resolved date range for table filtering
  const { data: stats } = useTransactionStats(statsParams);

  const typeColorMap: Record<string, string> = {
    income: "border-l-4 border-l-green-500",
    expense: "border-l-4 border-l-red-500",
    transfer: "border-l-4 border-l-blue-500",
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <DateCell value={row.getValue("createdAt")} isShowDateOnly={false} />
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <div className="flex items-center gap-2">
            {getTransactionTypeIcon(type)}
            <span className="capitalize">{type}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return <Badge variant="outline">{getCategoryLabel(category)}</Badge>;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const type = row.original.type;
        const amount = row.getValue("amount") as number;
        const color =
          type === "income"
            ? "text-green-600"
            : type === "expense"
            ? "text-red-500"
            : "text-blue-500";
        const prefix = type === "income" ? "+" : type === "expense" ? "-" : "";
        return (
          <span className={`font-semibold ${color}`}>
            {prefix}{format(amount)}
          </span>
        );
      },
    },
    {
      accessorKey: "balanceAfter",
      header: "Balance After",
      cell: ({ row }) => {
        const balance = row.getValue("balanceAfter") as number;
        return (
          <span>
            {format(balance)}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.getValue("description") || "-",
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => row.getValue("reference") || "-",
    },
  ];

  // Wrap getAllData to inject period date range so the table only shows filtered rows.
  // No manual memoization: the React Compiler infers a more precise dependency
  // (the full `stats` object) than `[stats?.period]`, so we let the compiler
  // memoize this for us instead of fighting the lint rule.
  const getAllDataWithPeriod = (filters: Record<string, unknown>) => {
    const merged: Record<string, unknown> = { ...filters };
    // Scope to a single account when navigated from an account card.
    if (accountId) {
      merged.accountId = accountId;
    }
    // if (stats?.period) {
    //   merged.startDate = decodeURIComponent(stats.period.startDate);
    //   merged.endDate = decodeURIComponent(stats.period.endDate);
    // }
    return transactionsApi.getAll(merged);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader
            title="Transactions"
            subTitle="Track all income, expenses, and transfers"
          />
        </div>
        <div className="flex gap-2">
          <TransferDialog />
          <ExpenseDialog />
          <IncomeDialog />
        </div>
      </div>

      {accountId && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2 text-sm">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Showing transactions for</span>
          <span className="font-semibold">
            {scopedAccount?.name ?? "selected account"}
          </span>
          <Link href="/accounts/transactions" className="ml-auto">
            <Button variant="ghost" size="sm">
              Clear filter
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
        cardTitle={(n: number) => `All Transactions (${n})`}
        defaultPageSize={20}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={transactionFilterConfig}
        columns={columns}
        searchConfig={{
          globalSearch: true,
          placeholder: "Search transactions...",
        }}
        enableSorting
        rowClassName={(row) => typeColorMap[row.type] || ""}
        operations={{
          getAllData: getAllDataWithPeriod,
          queryKey: [...queryKeys.transactions.all(), { periodStart: stats?.period?.startDate, periodEnd: stats?.period?.endDate, accountId }],
          entityName: "Transaction",
        }}
      />
    </div>
  );
}
