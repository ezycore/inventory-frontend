// coding-standard: maintained
import { ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "@/types";
import type { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";
import { ALL_TRANSACTION_CATEGORIES } from "@/constants/transactions";
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

// `category`/`type` are backend-typed enums (`TransactionCategory`/`TransactionType`)
// with full coverage in accounts.json, so no runtime fallback guard is needed.
const getCategoryLabel = (category: string, t: Translator) =>
  t(`categories.${category}` as never);

export const getTransactionFilterConfig = (t: Translator): FilterConfig => ({
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
        { label: t("types.income"), value: "income" },
        { label: t("types.expense"), value: "expense" },
        { label: t("types.transfer"), value: "transfer" },
      ],
    },
    {
      name: "category",
      label: t("filters.categoryLabel"),
      type: "select",
      placeholder: t("filters.categoryPlaceholder"),
      options: ALL_TRANSACTION_CATEGORIES.filter((c) => c !== "transfer").map((c) => ({
        label: t(`categories.${c}`),
        value: c,
      })),
    },
  ],
  viewMode: "popover",
});

// Left border tint per transaction type, for DataTable rowClassName.
export const transactionTypeColorMap: Record<string, string> = {
  income: "border-l-4 border-l-green-500",
  expense: "border-l-4 border-l-red-500",
  transfer: "border-l-4 border-l-blue-500",
};

export function getTransactionColumns(
  format: (value: number) => string,
  t: Translator,
): ColumnDef<Transaction>[] {
  return [
    {
      accessorKey: "createdAt",
      header: t("columns.date"),
      cell: ({ row }) => (
        <DateCell value={row.getValue("createdAt")} isShowDateOnly={false} />
      ),
    },
    {
      accessorKey: "type",
      header: t("columns.type"),
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <div className="flex items-center gap-2">
            {getTransactionTypeIcon(type)}
            <span className="capitalize">
              {t(`types.${type}` as never)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: t("columns.category"),
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return <Badge variant="outline">{getCategoryLabel(category, t)}</Badge>;
      },
    },
    {
      accessorKey: "amount",
      header: t("columns.amount"),
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
      header: t("columns.balanceAfter"),
      cell: ({ row }) => {
        const balance = row.getValue("balanceAfter") as number;
        return <span>{format(balance)}</span>;
      },
    },
    {
      accessorKey: "description",
      header: t("columns.description"),
      cell: ({ row }) => row.getValue("description") || "-",
    },
    {
      accessorKey: "reference",
      header: t("columns.reference"),
      cell: ({ row }) => row.getValue("reference") || "-",
    },
  ];
}
