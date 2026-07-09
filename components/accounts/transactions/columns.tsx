// coding-standard: maintained
import { ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "@/types";
import type { FilterConfig } from "@/types/DataTable";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells";
import {
  ArrowDownCircle,
  ArrowRightLeft,
  ArrowUpCircle,
} from "lucide-react";

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

export const transactionFilterConfig: FilterConfig = {
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

// Left border tint per transaction type, for DataTable rowClassName.
export const transactionTypeColorMap: Record<string, string> = {
  income: "border-l-4 border-l-green-500",
  expense: "border-l-4 border-l-red-500",
  transfer: "border-l-4 border-l-blue-500",
};

export function getTransactionColumns(
  format: (value: number) => string,
): ColumnDef<Transaction>[] {
  return [
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
        return <span>{format(balance)}</span>;
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
}
