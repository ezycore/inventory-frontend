"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/ui/lib/utils";
import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Skeleton } from "@/ui/components/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { useLocationStockDetail } from "@/services/api/modules/locations/stock-report-hooks";
import type { LocationStockFilters } from "@/services/api/modules/locations/stock-report-api";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Boxes,
  CheckCircle2,
  DollarSign,
  Package,
  Search,
  Store,
  Warehouse,
  XCircle,
} from "lucide-react";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import { StockItemsTable } from "./stock-items-table";

interface LocationDetailProps {
  locationId: string;
  onBack: () => void;
}

export function LocationDetailView({ locationId, onBack }: LocationDetailProps) {
  const t = useTranslations("settings.locations.stockReport");
  const tDetail = useTranslations("settings.locations.stockReport.detail");
  const tType = useTranslations("settings.locations.type");
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  const [filters, setFilters] = useState<LocationStockFilters>({
    page: 1,
    limit: 20,
    stockStatus: "",
    search: "",
    sort_by: "productName",
    sort_order: "asc",
  });

  const [searchInput, setSearchInput] = useState("");

  const { data: report, isLoading } = useLocationStockDetail(
    locationId,
    filters,
  );

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleStockStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      stockStatus: value === "all" ? "" : value,
      page: 1,
    }));
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: field,
      sort_order:
        prev.sort_by === field && prev.sort_order === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return <LocationDetailSkeleton onBack={onBack} />;
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("noDataForLocation")}</p>
        <button
          onClick={onBack}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {t("goBack")}
        </button>
      </div>
    );
  }

  const { location, summary, items, pagination } = report;

  return (
    <div className="space-y-6">
      {/* Back button + Location header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border bg-card hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
              location.locationType === "warehouse"
                ? "bg-amber-50 dark:bg-amber-950/40"
                : "bg-blue-50 dark:bg-blue-950/40",
            )}
          >
            {location.locationType === "warehouse" ? (
              <Warehouse className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{location.name}</h2>
            <p className="text-xs text-muted-foreground">
              {location.address} &middot;{" "}
              <span className="capitalize">
                {location.locationType === "warehouse" ? tType("warehouse") : tType("store")}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          {
            label: tDetail("uniqueProducts"),
            value: summary.uniqueProducts,
            icon: Package,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: tDetail("totalItems"),
            value: summary.totalProducts,
            icon: Boxes,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/40",
          },
          {
            label: tDetail("totalQuantity"),
            value: summary.totalQuantity.toLocaleString(),
            icon: BarChart3,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-50 dark:bg-indigo-950/40",
          },
          ...(canViewCosts
            ? [
                {
                  label: tDetail("stockValue"),
                  value: `৳${summary.totalValue.toLocaleString()}`,
                  icon: DollarSign,
                  color: "text-violet-600 dark:text-violet-400",
                  bg: "bg-violet-50 dark:bg-violet-950/40",
                },
              ]
            : []),
          {
            label: tDetail("inStock"),
            value: summary.inStockCount,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
          },
          {
            label: tDetail("lowStock"),
            value: summary.lowStockCount,
            icon: AlertTriangle,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/40",
          },
          {
            label: tDetail("outOfStock"),
            value: summary.outOfStockCount,
            icon: XCircle,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-950/40",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-xl border bg-card p-3.5 transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                    stat.bg,
                  )}
                >
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold tabular-nums leading-tight truncate">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 truncate">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters Bar */}
      <Card className="py-0">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tDetail("searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.stockStatus || "all"}
              onValueChange={handleStockStatusChange}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={tDetail("stockStatusPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tDetail("allStock")}</SelectItem>
                <SelectItem value="in-stock">{tDetail("inStockOption")}</SelectItem>
                <SelectItem value="low-stock">{tDetail("lowStockOption")}</SelectItem>
                <SelectItem value="out-of-stock">{tDetail("outOfStockOption")}</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={handleSearch}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {tDetail("search")}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <StockItemsTable
        items={items}
        pagination={pagination}
        sortBy={filters.sort_by}
        onSort={handleSort}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

function LocationDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-[70px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}
