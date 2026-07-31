"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { useCurrency } from "@/lib/currency";
import type { CashReport } from "@/types/api";

type CashCategoryRow = CashReport["categoryBreakdown"][number];

/**
 * Split the period's category rows the way the summary above splits them.
 *
 * `kind` comes from the backend (`classifyTxn`) — never re-derive it here, or this section drifts
 * from the tiles again. Internal rows (transfers, opening balances) are excluded exactly as they
 * are from every total, and the card says so instead of dropping them silently.
 */
export function splitCategoryRows(rows: CashCategoryRow[]) {
  return {
    cashIn: rows.filter((r) => r.type === "income" && r.kind !== "equity"),
    cashOut: rows.filter((r) => r.type === "expense" && r.kind !== "equity"),
    capital: rows.filter((r) => r.kind === "equity"),
  };
}

/** Equity entries in the period — the difference between this table's count and the tiles'. */
export const countCapitalEntries = (rows: CashCategoryRow[]) =>
  rows.reduce((sum, r) => (r.kind === "equity" ? sum + r.count : sum), 0);

function CategoryList({
  title,
  titleClassName,
  rows,
  signed,
}: {
  title: string;
  titleClassName: string;
  rows: CashCategoryRow[];
  /** Owner capital moves both ways, so its rows carry their own sign. */
  signed?: boolean;
}) {
  const t = useTranslations("reports.cash");
  const tCategories = useTranslations("accounts.transactions.categories");
  const { format: formatCurrency } = useCurrency();

  const total = rows.reduce((sum, r) => {
    if (!signed) return sum + r.total;
    return r.type === "income" ? sum + r.total : sum - r.total;
  }, 0);

  // Categories are a closed backend enum with full coverage in accounts.json; the guard is for a
  // row the aggregation could not attribute, which prints the raw value instead of throwing.
  const categoryLabel = (category?: string | null) => {
    if (!category) return "—";
    const key = category as never;
    return tCategories.has(key) ? tCategories(key) : category;
  };

  return (
    <div>
      <h3 className={`mb-3 text-sm font-semibold ${titleClassName}`}>{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={`${row.type}-${row.category}`}
              className="flex items-center justify-between text-sm"
            >
              <span>{categoryLabel(row.category)}</span>
              <div>
                <span className="font-medium">
                  {signed && row.type === "expense" ? "-" : ""}
                  {formatCurrency(row.total)}
                </span>
                <span className="ml-2 text-muted-foreground">({row.count})</span>
              </div>
            </div>
          ))}
          {/* The subtotal is the whole point of the split: it must equal the tile above, so a
              reader can check the page against itself. */}
          <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
            <span>{t("subtotal")}</span>
            <span>
              {signed && total < 0 ? "-" : ""}
              {formatCurrency(Math.abs(total))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function CashCategoryBreakdown({ rows }: { rows: CashCategoryRow[] }) {
  const t = useTranslations("reports.cash");
  const { cashIn, cashOut, capital } = splitCategoryRows(rows);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("transactionCategories")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryList
            title={t("cashIn")}
            titleClassName="text-green-600"
            rows={cashIn}
          />
          <CategoryList
            title={t("cashOut")}
            titleClassName="text-red-600"
            rows={cashOut}
          />
        </div>
        {capital.length > 0 && (
          <div className="border-t pt-4">
            <CategoryList
              title={t("ownerCapital")}
              titleClassName="text-amber-600"
              rows={capital}
              signed
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">{t("internalExcluded")}</p>
      </CardContent>
    </Card>
  );
}
