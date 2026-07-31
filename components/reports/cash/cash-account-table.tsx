"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { SimpleTable, type SimpleColumn } from "@ui/components/simple-table";
import { useCurrency } from "@/lib/currency";
import type { CashReport } from "@/types/api";

type CashAccountRow = CashReport["accountBreakdown"][number];

/**
 * Per-account cash movement.
 *
 * The owner-capital column is not decoration: the backend excludes equity from `income`/`expense`
 * so those columns reconcile with the tiles, which left the row's own `balance` underivable from
 * the numbers beside it. Capital is the missing term.
 */
export function CashAccountTable({ rows }: { rows: CashAccountRow[] }) {
  const t = useTranslations("reports.cash");
  const tAccountTypes = useTranslations("accounts.accounts.types");
  const { format: formatCurrency } = useCurrency();

  // `accountType` is a backend enum, but a deleted account falls back to "unknown" — which has no
  // label — so a missing key prints the raw value rather than throwing.
  const typeLabel = (type?: string | null) => {
    if (!type) return "—";
    const key = type as never;
    return tAccountTypes.has(key) ? tAccountTypes(key) : type;
  };

  const columns: SimpleColumn<CashAccountRow>[] = [
    {
      key: "account",
      header: t("colAccount"),
      cell: (row) => <span className="font-medium">{row.accountName}</span>,
    },
    {
      key: "type",
      header: t("colType"),
      cell: (row) => (
        <span className="text-muted-foreground">{typeLabel(row.accountType)}</span>
      ),
    },
    {
      key: "balance",
      header: t("colBalance"),
      align: "right",
      cell: (row) => formatCurrency(row.balance),
    },
    {
      key: "cashIn",
      header: t("colCashIn"),
      align: "right",
      cellClassName: "text-green-600",
      cell: (row) => formatCurrency(row.income),
    },
    {
      key: "cashOut",
      header: t("colCashOut"),
      align: "right",
      cellClassName: "text-red-600",
      cell: (row) => formatCurrency(row.expense),
    },
    {
      key: "capital",
      header: t("colCapital"),
      align: "right",
      cell: (row) => {
        const net = row.capitalIn - row.capitalOut;
        if (net === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <span className={net > 0 ? "text-green-600" : "text-amber-600"}>
            {net > 0 ? "+" : "-"}
            {formatCurrency(Math.abs(net))}
          </span>
        );
      },
    },
    {
      key: "count",
      header: t("colTransactions"),
      align: "right",
      cell: (row) => row.count,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("accountBreakdown")}</CardTitle>
        {/* Accounts with no movement in the period are absent, so this list can be shorter than
            the account count on the Total Balance tile. */}
        <p className="text-xs text-muted-foreground">{t("accountsWithActivity")}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <SimpleTable
            columns={columns}
            rows={rows}
            getRowKey={(row, i) => row.accountId ?? i}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
