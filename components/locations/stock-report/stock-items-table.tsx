"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { cn } from "@/ui/lib/utils";
import { Badge } from "@/ui/components/badge";
import { Card, CardHeader, CardTitle } from "@/ui/components/card";
import { CategoryPath } from "@/components/shared/category-path";
import type {
  LocationStockItem,
  LocationStockDetailReport,
} from "@/services/api/modules/locations/stock-report-api";
import type { Translator } from "@/i18n/config";
import { ArrowUpDown } from "lucide-react";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import { TablePager } from "@/components/shared/table-pager";

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

      <TablePager
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        hasPrev={pagination.hasPrev}
        hasNext={pagination.hasNext}
        onPageChange={onPageChange}
      />
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
        {/* Both levels, through the same renderer the products table uses. */}
        <CategoryPath
          category={item.categoryName}
          subcategory={item.subcategoryName}
          fallback="—"
        />
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

