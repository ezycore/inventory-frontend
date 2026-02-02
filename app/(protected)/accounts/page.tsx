"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Account } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { DataTable } from "@/ui/components/dataTable";
import { DateCell } from "@/ui/components/dataTable/cells";
import PageHeader from "@/ui/components/header";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Wallet, Building2, Smartphone, ArrowRightLeft } from "lucide-react";
import { Button } from "@/ui/components/button";
import Link from "next/link";
import { useCurrency } from "@/lib/currency";

// Hooks & API// Hooks & API
import {
  useAccountSummary,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/services/api";
import { accountsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { FilterConfig } from "@/types/DataTable";

const getAccountTypeIcon = (type: string) => {
  switch (type) {
    case "cash":
      return <Wallet className="h-4 w-4" />;
    case "bank":
      return <Building2 className="h-4 w-4" />;
    case "bkash":
    case "nagad":
    case "custom":
      return <Smartphone className="h-4 w-4" />;
    default:
      return <Wallet className="h-4 w-4" />;
  }
};

const getAccountTypeLabel = (type: string) => {
  switch (type) {
    case "cash":
      return "Cash";
    case "bank":
      return "Bank";
    case "bkash":
      return "bKash";
    case "nagad":
      return "Nagad";
    case "custom":
      return "Custom";
    default:
      return type;
  }
};

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
        { value: "bkash", label: "bKash" },
        { value: "nagad", label: "Nagad" },
        { value: "custom", label: "Custom" },
      ],
    },
    {
      name: "initialBalance",
      type: "number",
      label: "Initial Balance",
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
    {
      name: "isDefault",
      type: "checkbox",
      label: "Set as Default Account",
      columnSpan: 6,
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
        { label: "bKash", value: "bkash" },
        { label: "Nagad", value: "nagad" },
        { label: "Custom", value: "custom" },
      ],
    },
    {
      name: "isActive",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      options: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
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
  description: "",
};

function AccountSummaryCards() {
  const { data: summary, isLoading } = useAccountSummary();
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
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format(summary.totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across {summary.accountCount} accounts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format(summary.byType.cash)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format(summary.byType.bank)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mobile Wallets</CardTitle>
          <Smartphone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format((summary.byType.bkash || 0) + (summary.byType.nagad || 0))}
          </div>
          <p className="text-xs text-muted-foreground">
            bKash + Nagad
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountsPage() {
  const { format } = useCurrency();
  
  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: "name",
      header: "Account Name",
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="flex items-center gap-2">
            {getAccountTypeIcon(account.type)}
            <span className="font-medium">{account.name}</span>
            {account.isDefault && (
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge variant="outline">{getAccountTypeLabel(type)}</Badge>
        );
      },
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => {
        const balance = row.getValue("balance") as number;
        return (
          <span className={`font-semibold ${balance < 0 ? "text-red-500" : "text-green-600"}`}>
            {format(balance)}
          </span>
        );
      },
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) => row.getValue("accountNumber") || "-",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
    },
  ];
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Accounts"
          subTitle="Manage your cash, bank, and mobile wallet accounts"
        />
        <div className="flex gap-2">
          <Link href="/accounts/transactions">
            <Button variant="outline">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transactions
            </Button>
          </Link>
        </div>
      </div>

      <AccountSummaryCards />

      <DataTable
        cardTitle={(n: number) => `All Accounts (${n})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={accountFilterConfig}
        columns={columns}
        selectable
        searchConfig={{
          globalSearch: true,
          placeholder: "Search accounts by name...",
        }}
        enableSorting
        operations={{
          formConfig: accountFormConfig,
          defaultValues,
          getAllData: accountsApi.getAll,
          createMutation: useCreateAccount(),
          updateMutation: useUpdateAccount(),
          deleteMutation: useDeleteAccount(),
          queryKey: [...queryKeys.accounts.all()],
          entityName: "Account",
        }}
      />
    </div>
  );
}
