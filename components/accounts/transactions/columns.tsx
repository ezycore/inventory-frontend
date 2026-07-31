// coding-standard: maintained
import { ColumnDef } from "@tanstack/react-table";
import type { ApiTransaction, TransactionKind } from "@/types/api";
import type { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";
import {
  ALL_TRANSACTION_CATEGORIES,
  ALL_TRANSACTION_TYPES,
} from "@/constants/transactions";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells";
import {
  ArrowDownCircle,
  ArrowRightLeft,
  ArrowUpCircle,
  Undo2,
  Wallet,
} from "lucide-react";

/**
 * Which way the money went, resolved once.
 *
 * `type` alone is not enough: a transfer writes **two** rows that differ only in
 * `transferDirection`, so without it the pair renders as the same movement twice with no sign.
 */
type Direction = "in" | "out" | "opening";

const directionOf = (txn: ApiTransaction): Direction => {
  if (txn.type === "income") return "in";
  if (txn.type === "expense") return "out";
  if (txn.type === "opening_balance") return "opening";
  return txn.transferDirection === "out" ? "out" : "in";
};

/**
 * Money in is up and green, money out is down and red — the convention every finance UI uses, and
 * the one the stat cards above the table already use (`TrendingUp` for cash in). The icons used to
 * run the other way here, so an expense pointed up.
 */
const DirectionIcon = ({ txn }: { txn: ApiTransaction }) => {
  if (txn.type === "opening_balance") {
    return <Wallet className="h-4 w-4 text-muted-foreground" />;
  }
  if (txn.type === "transfer") {
    return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
  }
  return directionOf(txn) === "in" ? (
    <ArrowUpCircle className="h-4 w-4 text-green-600" />
  ) : (
    <ArrowDownCircle className="h-4 w-4 text-red-500" />
  );
};

/** `t` is bound to `accounts.transactions`. */
const directionLabel = (txn: ApiTransaction, t: Translator): string => {
  if (txn.type === "transfer") {
    return t(
      directionOf(txn) === "out" ? "types.transferOut" : "types.transferIn",
    );
  }
  return t(`types.${txn.type}` as never);
};

/**
 * Badge tone per class. Owner capital and settlement get their own tone because those are the two
 * a direction word cannot describe honestly — an owner withdrawal is not a business cost, and the
 * cash leg of a sale is not revenue (the `Sale` document holds that).
 */
const KIND_TONE: Record<TransactionKind, string> = {
  operating_income: "border-green-600/40 text-green-700 dark:text-green-400",
  operating_expense: "border-red-500/40 text-red-600 dark:text-red-400",
  equity: "border-purple-500/40 text-purple-600 dark:text-purple-400",
  settlement: "border-blue-500/40 text-blue-600 dark:text-blue-400",
  internal: "border-muted-foreground/40 text-muted-foreground",
};

// `category` / `type` / `kind` are backend-typed enums with full coverage in accounts.json.
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
      // Every stored type, `opening_balance` included — it was missing, so the rows account
      // creation writes could be seen but never filtered for.
      options: ALL_TRANSACTION_TYPES.map((value) => ({
        label: t(`types.${value}`),
        value,
      })),
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
  opening_balance: "border-l-4 border-l-muted-foreground/40",
};

export function getTransactionColumns(
  format: (value: number) => string,
  t: Translator,
): ColumnDef<ApiTransaction>[] {
  return [
    {
      // The **effective** ledger date, not `createdAt`. Every filter, report and the stats cards
      // above this table key on `date`, so showing `createdAt` put a back-dated line on the wrong
      // day and in a period the cards had counted it out of.
      accessorKey: "date",
      header: t("columns.date"),
      cell: ({ row }) => (
        <DateCell value={row.getValue("date")} isShowDateOnly={false} />
      ),
    },
    {
      accessorKey: "type",
      header: t("columns.direction"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DirectionIcon txn={row.original} />
          <span>{directionLabel(row.original, t)}</span>
        </div>
      ),
    },
    {
      accessorKey: "kind",
      header: t("columns.kind"),
      cell: ({ row }) => {
        const kind = row.original.kind;
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={KIND_TONE[kind]}>
              {t(`kinds.${kind}` as never)}
            </Badge>
            {row.original.reversalOf && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400"
              >
                <Undo2 className="h-3 w-3" />
                {t("kinds.reversal")}
              </Badge>
            )}
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
        const direction = directionOf(row.original);
        const color =
          row.original.type === "transfer"
            ? "text-blue-500"
            : direction === "in"
              ? "text-green-600"
              : direction === "out"
                ? "text-red-500"
                : "text-muted-foreground";
        // Signed on every row, transfers included: the two legs of a transfer carry the same
        // amount and only the sign tells them apart.
        const prefix = direction === "out" ? "-" : "+";
        return (
          <span className={`font-semibold ${color}`}>
            {prefix}
            {format(row.getValue("amount") as number)}
          </span>
        );
      },
    },
    {
      accessorKey: "balanceAfter",
      header: t("columns.balanceAfter"),
      cell: ({ row }) => {
        const balance = row.getValue("balanceAfter") as number | undefined;
        return <span>{balance === undefined ? "-" : format(balance)}</span>;
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

/**
 * Can this row be corrected on the ledger?
 *
 * Mirrors the four guards in `transactionService.reverseTransaction`, so the action is only offered
 * where the API will accept it: manual categories (settlement belongs to the sales/purchase flow),
 * income or expense only (reversing one transfer leg invents money), and never a reversal itself.
 * Equity additionally needs `transactions.capital`, which the caller checks.
 */
export const isReversible = (txn: ApiTransaction): boolean =>
  !txn.reversalOf &&
  (txn.type === "income" || txn.type === "expense") &&
  (txn.kind === "operating_income" ||
    txn.kind === "operating_expense" ||
    txn.kind === "equity");
