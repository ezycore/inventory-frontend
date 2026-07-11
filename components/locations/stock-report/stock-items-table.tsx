"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { cn } from "@/ui/lib/utils";
import { Badge } from "@/ui/components/badge";
import { Card, CardHeader, CardTitle } from "@/ui/components/card";
import type {
  LocationStockItem,
  LocationStockDetailReport,
} from "@/services/api/modules/locations/stock-report-api";
import type { Translator } from "@/i18n/config";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";

interface StockItemsTableProps {
  items: LocationStockItem[];
  pagination: LocationStockDetailReport["pagination"];
  sortBy?: string;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}

export function StockItemsTable({
  items,
  pagination,
  sortBy,
  onSort,
  onPageChange,
}: StockItemsTableProps) {
  const t = useTranslations("settings.locations.stockReport.table");
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);

  return (
    <Card className="py-0 overflow-hidden">
      <CardHeader className="border-b bg-muted/30 py-3">
        <CardTitle className="text-sm font-medium">
          {t("title", { count: pagination.total.toLocaleString() })}
        </CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/20">
              {[
                { key: "productName", label: t("product") },
                { key: "categoryName", label: t("category") },
                { key: "brandName", label: t("brand") },
                { key: "quantity", label: t("quantity") },
                { key: "quantityAlert", label: t("alertLevel") },
                ...(canViewCosts
                  ? [
                      { key: "costPrice", label: t("costPrice") },
                      { key: "stockValue", label: t("stockValue") },
                    ]
                  : []),
                { key: "status", label: t("status") },
              ].map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => onSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-muted-foreground text-sm"
                >
                  {t("noItems")}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <StockItemRow key={item.inventoryId} item={item} t={t} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {t("showing", {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="flex h-8 w-8 items-center justify-center rounded-md border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {generatePageNumbers(pagination.page, pagination.totalPages).map(
              (pageNum, idx) =>
                pageNum === -1 ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-muted-foreground text-sm"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={cn(
                      "flex h-8 min-w-[32px] items-center justify-center rounded-md text-sm font-medium transition-colors",
                      pageNum === pagination.page
                        ? "bg-primary text-primary-foreground"
                        : "border bg-card hover:bg-muted",
                    )}
                  >
                    {pageNum}
                  </button>
                ),
            )}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="flex h-8 w-8 items-center justify-center rounded-md border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function StockItemRow({ item, t }: { item: LocationStockItem; t: Translator }) {
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  const variantLabel = item.variantAttributes
    ? Object.values(item.variantAttributes).join(" / ")
    : null;

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium leading-tight">
            {item.productName}
          </p>
          {variantLabel && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {variantLabel}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {item.categoryName || "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {item.brandName || "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            item.isOutOfStock
              ? "text-red-600 dark:text-red-400"
              : item.isLowStock
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground",
          )}
        >
          {item.quantity.toLocaleString()}
        </span>
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
        {item.quantityAlert}
      </td>
      {canViewCosts && (
        <td className="px-4 py-3 text-sm tabular-nums">
          ৳{item.costPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
      )}
      {canViewCosts && (
        <td className="px-4 py-3 text-sm font-medium tabular-nums">
          ৳{item.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
      )}
      <td className="px-4 py-3">
        {item.isOutOfStock ? (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            {t("outOfStock")}
          </Badge>
        ) : item.isLowStock ? (
          <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
            {t("lowStock")}
          </Badge>
        ) : (
          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
            {t("inStock")}
          </Badge>
        )}
      </td>
    </tr>
  );
}

function generatePageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: number[] = [];
  pages.push(1);

  if (current > 3) pages.push(-1); // ellipsis

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push(-1); // ellipsis

  pages.push(total);
  return pages;
}
