"use client";

import { useState, useMemo } from "react";
import { cn } from "@/ui/lib/utils";
import PageHeader from "@/ui/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Progress } from "@/ui/components/progress";
import { Skeleton } from "@/ui/components/skeleton";
import { Input } from "@/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/ui/components/tabs";
import {
  useLocationStockSummary,
  useLocationStockDetail,
} from "@/services/api/modules/locations/stock-report-hooks";
import type {
  LocationStockSummary,
  LocationStockItem,
  LocationStockFilters,
} from "@/services/api/modules/locations/stock-report-api";
import {
  MapPin,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  TrendingUp,
  Warehouse,
  Store,
  Search,
  ArrowLeft,
  ArrowUpDown,
  DollarSign,
  Boxes,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";

// ── Summary Stat Cards ─────────────────────────────────────────────────

interface OverallStatsProps {
  summaries: LocationStockSummary[];
  isLoading: boolean;
}

function OverallStatsBar({ summaries, isLoading }: OverallStatsProps) {
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  const totals = useMemo(() => {
    if (!summaries?.length)
      return {
        locations: 0,
        products: 0,
        quantity: 0,
        value: 0,
        lowStock: 0,
        outOfStock: 0,
      };
    return {
      locations: summaries.length,
      products: summaries.reduce((a, s) => a + s.totalProducts, 0),
      quantity: summaries.reduce((a, s) => a + s.totalQuantity, 0),
      value: summaries.reduce((a, s) => a + s.totalValue, 0),
      lowStock: summaries.reduce((a, s) => a + s.lowStockCount, 0),
      outOfStock: summaries.reduce((a, s) => a + s.outOfStockCount, 0),
    };
  }, [summaries]);

  const stats = [
    {
      label: "Total Locations",
      value: totals.locations,
      icon: MapPin,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Total Stock Items",
      value: totals.products.toLocaleString(),
      icon: Package,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Quantity",
      value: totals.quantity.toLocaleString(),
      icon: Boxes,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    ...(canViewCosts
      ? [
          {
            label: "Total Value",
            value: `৳${totals.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            gradient: "from-violet-500/10 to-violet-500/5",
            iconBg: "bg-violet-50 dark:bg-violet-950/40",
            iconColor: "text-violet-600 dark:text-violet-400",
          },
        ]
      : []),
    {
      label: "Low Stock",
      value: totals.lowStock,
      icon: AlertTriangle,
      gradient: "from-amber-500/10 to-amber-500/5",
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Out of Stock",
      value: totals.outOfStock,
      icon: XCircle,
      gradient: "from-red-500/10 to-red-500/5",
      iconBg: "bg-red-50 dark:bg-red-950/40",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[100px] rounded-2xl border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-card p-4",
              "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-60",
                stat.gradient,
              )}
            />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                  {stat.label}
                </p>
                <p className="text-xl font-bold tracking-tight tabular-nums">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  stat.iconBg,
                  "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
                )}
              >
                <Icon className={cn("h-4 w-4", stat.iconColor)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Location Card ───────────────────────────────────────────────────────

interface LocationCardProps {
  location: LocationStockSummary;
  onSelect: (locationId: string) => void;
}

function LocationStockCard({ location, onSelect }: LocationCardProps) {
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  const totalCapacity = location.inStockCount + location.lowStockCount + location.outOfStockCount;
  const healthPercent = totalCapacity > 0
    ? Math.round((location.inStockCount / totalCapacity) * 100)
    : 0;

  const healthColor =
    healthPercent >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : healthPercent >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const progressColor =
    healthPercent >= 70
      ? "bg-emerald-500"
      : healthPercent >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 py-0 gap-0 overflow-hidden"
      onClick={() => onSelect(location.locationId)}
    >
      {/* Header */}
      <div className="relative p-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
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
              <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                {location.locationName}
              </h3>
              <span className="text-[11px] text-muted-foreground capitalize">
                {location.locationType}
              </span>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>View detailed report</TooltipContent>
          </Tooltip>
        </div>

        {/* Stock Value — cost-derived, costs.view only */}
        {canViewCosts && (
          <div className="mb-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-0.5">
              Stock Value
            </p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              ৳{location.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Health bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Stock Health</span>
            <span className={cn("font-semibold tabular-nums", healthColor)}>
              {healthPercent}%
            </span>
          </div>
          <Progress
            value={healthPercent}
            className="h-1.5"
            indicatorClassName={progressColor}
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="border-t bg-muted/30 px-5 py-3">
        <div className="grid grid-cols-4 gap-2">
          <StockMiniStat
            label="Items"
            value={location.totalProducts}
            color="text-foreground"
          />
          <StockMiniStat
            label="Qty"
            value={location.totalQuantity}
            color="text-foreground"
          />
          <StockMiniStat
            label="Low"
            value={location.lowStockCount}
            color="text-amber-600 dark:text-amber-400"
          />
          <StockMiniStat
            label="Out"
            value={location.outOfStockCount}
            color="text-red-600 dark:text-red-400"
          />
        </div>
      </div>
    </Card>
  );
}

function StockMiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className={cn("text-sm font-bold tabular-nums", color)}>
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] text-muted-foreground/60">{label}</p>
    </div>
  );
}

function LocationCardSkeleton() {
  return (
    <Card className="py-0 gap-0 overflow-hidden">
      <div className="p-5 pb-4 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>
      <div className="border-t bg-muted/30 px-5 py-3">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-2 w-6" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Location Detail View ────────────────────────────────────────────────

interface LocationDetailProps {
  locationId: string;
  onBack: () => void;
}

function LocationDetailView({ locationId, onBack }: LocationDetailProps) {
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
        <p className="text-muted-foreground">No data available for this location.</p>
        <button
          onClick={onBack}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Go back
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
              <span className="capitalize">{location.locationType}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          {
            label: "Unique Products",
            value: summary.uniqueProducts,
            icon: Package,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Total Items",
            value: summary.totalProducts,
            icon: Boxes,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/40",
          },
          {
            label: "Total Quantity",
            value: summary.totalQuantity.toLocaleString(),
            icon: BarChart3,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-50 dark:bg-indigo-950/40",
          },
          ...(canViewCosts
            ? [
                {
                  label: "Stock Value",
                  value: `৳${summary.totalValue.toLocaleString()}`,
                  icon: DollarSign,
                  color: "text-violet-600 dark:text-violet-400",
                  bg: "bg-violet-50 dark:bg-violet-950/40",
                },
              ]
            : []),
          {
            label: "In Stock",
            value: summary.inStockCount,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
          },
          {
            label: "Low Stock",
            value: summary.lowStockCount,
            icon: AlertTriangle,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/40",
          },
          {
            label: "Out of Stock",
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
                placeholder="Search products..."
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
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={handleSearch}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="py-0 overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-sm font-medium">
            Stock Items ({pagination.total.toLocaleString()})
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/20">
                {[
                  { key: "productName", label: "Product" },
                  { key: "categoryName", label: "Category" },
                  { key: "brandName", label: "Brand" },
                  { key: "quantity", label: "Quantity" },
                  { key: "quantityAlert", label: "Alert Level" },
                  ...(canViewCosts
                    ? [
                        { key: "costPrice", label: "Cost Price" },
                        { key: "stockValue", label: "Stock Value" },
                      ]
                    : []),
                  { key: "status", label: "Status" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {filters.sort_by === col.key && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
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
                    No stock items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <StockItemRow key={item.inventoryId} item={item} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total,
              )}{" "}
              of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
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
                      onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="flex h-8 w-8 items-center justify-center rounded-md border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StockItemRow({ item }: { item: LocationStockItem }) {
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
          <Badge
            variant="destructive"
            className="text-[10px] px-1.5 py-0"
          >
            Out of Stock
          </Badge>
        ) : item.isLowStock ? (
          <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
            Low Stock
          </Badge>
        ) : (
          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
            In Stock
          </Badge>
        )}
      </td>
    </tr>
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

// ── Pagination Helper ──────────────────────────────────────────────────

function generatePageNumbers(
  current: number,
  total: number,
): number[] {
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

// ── Main Page ───────────────────────────────────────────────────────────

export default function LocationStockReportPage() {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"overview" | "comparison">(
    "overview",
  );
  const {
    data: summaries,
    isLoading: summaryLoading,
  } = useLocationStockSummary();

  // If a location is selected, show detail view
  if (selectedLocationId) {
    return (
      <div className="space-y-6">
        <LocationDetailView
          locationId={selectedLocationId}
          onBack={() => setSelectedLocationId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Location Stock Report"
        subTitle="Comprehensive stock overview across all your locations."
      />

      {/* Overall Stats */}
      <OverallStatsBar
        summaries={summaries || []}
        isLoading={summaryLoading}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "overview" | "comparison")}
      >
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Location Overview
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Stock Comparison
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab — Location Cards */}
        <TabsContent value="overview" className="mt-6">
          {summaryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <LocationCardSkeleton key={i} />
              ))}
            </div>
          ) : !summaries || summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No Locations Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Add locations and inventory to see stock reports here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {summaries.map((loc) => (
                <LocationStockCard
                  key={loc.locationId}
                  location={loc}
                  onSelect={setSelectedLocationId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="mt-6">
          <ComparisonView summaries={summaries || []} isLoading={summaryLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Comparison View ─────────────────────────────────────────────────────

function ComparisonView({
  summaries,
  isLoading,
}: {
  summaries: LocationStockSummary[];
  isLoading: boolean;
}) {
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No locations to compare.
      </div>
    );
  }

  // Find max values for relative bar widths
  const maxValue = Math.max(...summaries.map((s) => s.totalValue), 1);
  const maxQty = Math.max(...summaries.map((s) => s.totalQuantity), 1);

  return (
    <div className="space-y-6">
      {/* Value Comparison — cost-derived, costs.view only */}
      {canViewCosts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-violet-500" />
              Stock Value Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaries.map((loc) => {
              const pct = (loc.totalValue / maxValue) * 100;
              return (
                <div key={loc.locationId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {loc.locationType === "warehouse" ? (
                        <Warehouse className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Store className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      <span className="font-medium">{loc.locationName}</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums font-medium">
                      ৳{loc.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quantity Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Boxes className="h-4 w-4 text-blue-500" />
            Stock Quantity Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summaries.map((loc) => {
            const pct = (loc.totalQuantity / maxQty) * 100;
            return (
              <div key={loc.locationId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {loc.locationType === "warehouse" ? (
                      <Warehouse className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Store className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    <span className="font-medium">{loc.locationName}</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums font-medium">
                    {loc.totalQuantity.toLocaleString()} units
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Stock Health Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            Stock Health Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Location
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                    Total Items
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    In Stock
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-amber-600 dark:text-amber-400">
                    Low Stock
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-red-600 dark:text-red-400">
                    Out of Stock
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                    Health
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summaries.map((loc) => {
                  const total =
                    loc.inStockCount +
                    loc.lowStockCount +
                    loc.outOfStockCount;
                  const health =
                    total > 0
                      ? Math.round((loc.inStockCount / total) * 100)
                      : 0;
                  const healthColor =
                    health >= 70
                      ? "text-emerald-600 dark:text-emerald-400"
                      : health >= 40
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400";

                  return (
                    <tr
                      key={loc.locationId}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-sm font-medium">
                        {loc.locationName}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {loc.locationType}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right">
                        {loc.totalProducts}
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {loc.inStockCount}
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right font-medium text-amber-600 dark:text-amber-400">
                        {loc.lowStockCount}
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right font-medium text-red-600 dark:text-red-400">
                        {loc.outOfStockCount}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            healthColor,
                          )}
                        >
                          {health}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
