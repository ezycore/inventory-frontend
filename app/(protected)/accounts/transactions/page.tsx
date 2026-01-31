"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Types
import type { Transaction } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { DateCell } from "@/ui/components/dataTable/cells";
import PageHeader from "@/ui/components/header";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import DynamicForm from "@/ui/components/form";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency";

// Hooks & API
import {
  useCreateIncome,
  useCreateExpense,
  useCreateTransfer,
  useTransactionSummary,
} from "@/services/api/queries";
import { FilterConfig } from "@/types/DataTable";
import { transactionsApi } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";

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

function TransactionSummaryCards() {
  const { data: summary, isLoading } = useTransactionSummary();
  const { format } = useCurrency();
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            +{format(summary.totalIncome)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            -{format(summary.totalExpense)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transfers</CardTitle>
          <ArrowRightLeft className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-500">
            {format(summary.totalTransferOut || 0)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Change</CardTitle>
          {summary.netChange >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              summary.netChange >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {summary.netChange >= 0 ? "+" : ""}{format(summary.netChange)}
          </div>
        </CardContent>
      </Card>
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
  const { format } = useCurrency();

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <DateCell value={row.getValue("date")} />,
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

      <TransactionSummaryCards />

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
        operations={{
          getAllData: transactionsApi.getAll,
          queryKey: [...queryKeys.transactions.all()],
          entityName: "Transaction",
        }}
      />
    </div>
  );
}
