"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
} from "lucide-react";

import { inventoryApi, useDashboardStats } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { useSelectOptions } from "@/services/api";

// ---------- Types ----------

interface ShortlistProduct {
  _id: string;
  name: string;
  brand?: { _id: string; name: string } | null;
  category?: { _id: string; name: string } | null;
  sellingPrice?: number;
  costPrice?: number;
}

interface ShortlistVariant {
  _id: string;
  attributes?: Record<string, any> | null;
  sellingPrice?: number;
  costPrice?: number;
}

interface ShortlistLocation {
  _id: string;
  name: string;
}

export interface ShortlistItem {
  _id: string;
  product: ShortlistProduct | null;
  variant: ShortlistVariant | null;
  location: ShortlistLocation | null;
  quantity: number;
  quantityAlert: number;
  neededQuantity: number;
  isLowStock: boolean;
  restockStatus: string;
}

export interface ImportedLowStockItem {
  inventoryId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  discount: number;
  conversionFactor: number;
  convertedQuantity: number;
}

// ---------- Props ----------

interface ImportLowStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: ImportedLowStockItem[]) => void;
}

// ---------- Helpers ----------

function getUrgency(quantity: number, alertQty: number) {
  if (quantity === 0) return "Critical";
  if (quantity / alertQty < 0.5) return "High";
  return "Medium";
}

function getUrgencyBadge(quantity: number, alertQty: number) {
  const urgency = getUrgency(quantity, alertQty);
  if (urgency === "Critical") {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <AlertOctagon className="h-3 w-3" />
        Critical
      </Badge>
    );
  }
  if (urgency === "High") {
    return (
      <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20 gap-1 text-xs">
        <AlertTriangle className="h-3 w-3" />
        High
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <AlertTriangle className="h-3 w-3" />
      Medium
    </Badge>
  );
}

function getProductDisplayName(item: ShortlistItem): string {
  const name = item.product?.name || "Unknown Product";
  if (item.variant?.attributes) {
    const attrs = Object.entries(item.variant.attributes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    if (attrs) return `${name} (${attrs})`;
  }
  return name;
}

// ---------- Component ----------

export function ImportLowStockDialog({
  open,
  onOpenChange,
  onImport,
}: ImportLowStockDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch low stock items
  const { data: shortlistData, isLoading } = useQuery({
    queryKey: [...queryKeys.inventory.lowStock(), "import-dialog"],
    queryFn: () =>
      inventoryApi.getShortlist({
        locationId: "",
        low_stock_only: "true",
        limit: 200,
      } as any),
    enabled: open,
  });

  // Fetch dashboard stats for summary cards
  const { data: dashboardData } = useDashboardStats();
  const stats = dashboardData?.data;

  // Fetch brands and categories for filters
  const { data: brandOptions } = useSelectOptions(open ? "/brands" : null);
  const { data: categoryOptions } = useSelectOptions(open ? "/categories" : null);

  const items: ShortlistItem[] = useMemo(
    () => shortlistData?.data?.items || [],
    [shortlistData],
  );

  // Initialize order quantities when items load
  useEffect(() => {
    if (items.length > 0) {
      const quantities: Record<string, number> = {};
      for (const item of items) {
        if (!(item._id in orderQuantities)) {
          quantities[item._id] = Math.max(1, item.neededQuantity || 1);
        }
      }
      if (Object.keys(quantities).length > 0) {
        setOrderQuantities((prev) => ({ ...quantities, ...prev }));
      }
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setSearchQuery("");
      setBrandFilter("all");
      setCategoryFilter("all");
      setOrderQuantities({});
    }
  }, [open]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const productName = item.product?.name?.toLowerCase() || "";
        const variantAttrs = item.variant?.attributes
          ? Object.values(item.variant.attributes).join(" ").toLowerCase()
          : "";
        const locationName = item.location?.name?.toLowerCase() || "";
        if (
          !productName.includes(query) &&
          !variantAttrs.includes(query) &&
          !locationName.includes(query)
        ) {
          return false;
        }
      }

      // Brand filter
      if (brandFilter && brandFilter !== "all") {
        const itemBrandId = item.product?.brand?._id;
        if (itemBrandId !== brandFilter) return false;
      }

      // Category filter
      if (categoryFilter && categoryFilter !== "all") {
        const itemCategoryId = item.product?.category?._id;
        if (itemCategoryId !== categoryFilter) return false;
      }

      return true;
    });
  }, [items, searchQuery, brandFilter, categoryFilter]);

  // Stats
  const outOfStockCount = useMemo(
    () => stats?.variants?.outOfStock || items.filter((i) => i.quantity === 0).length,
    [stats, items],
  );
  const lowStockCount = useMemo(
    () => stats?.variants?.lowStock || items.length,
    [stats, items],
  );

  // Handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i._id)));
    }
  }, [filteredItems, selectedIds.size]);

  const updateOrderQty = useCallback((id: string, qty: number) => {
    setOrderQuantities((prev) => ({ ...prev, [id]: Math.max(1, qty) }));
  }, []);

  const handleImport = useCallback(() => {
    const selectedItems = items.filter((i) => selectedIds.has(i._id));
    const importItems: ImportedLowStockItem[] = selectedItems.map((item) => {
      const qty = orderQuantities[item._id] || Math.max(1, item.neededQuantity || 1);
      const price =
        item.variant?.sellingPrice ??
        item.product?.sellingPrice ??
        0;

      return {
        inventoryId: item._id,
        productId: item.product?._id || "",
        variantId: item.variant?._id || null,
        productName: getProductDisplayName(item),
        quantity: qty,
        price,
        costPrice: price,
        discount: 0,
        conversionFactor: 1,
        convertedQuantity: qty,
      };
    });

    onImport(importItems);
    onOpenChange(false);
  }, [items, selectedIds, orderQuantities, onImport, onOpenChange]);

  const isAllSelected =
    filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Import Low Stock Products
          </DialogTitle>
          <DialogDescription>
            Select products that need restocking and import them into your purchase order.
          </DialogDescription>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
              <AlertOctagon className="h-3.5 w-3.5" />
              Out of Stock
            </div>
            <p className="text-xl font-bold text-destructive mt-1">
              {outOfStockCount}
            </p>
          </div>
          <div className="rounded-lg border-2 border-chart-1/30 bg-chart-1/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-chart-1 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Low Stock Items
            </div>
            <p className="text-xl font-bold text-chart-1 mt-1">
              {lowStockCount}
            </p>
          </div>
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Selected
            </div>
            <p className="text-xl font-bold text-primary mt-1">
              {selectedIds.size}
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by product name or variant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brandOptions?.map((brand) => (
                <SelectItem key={brand.value} value={brand.value}>
                  {brand.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions?.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-md min-h-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm border-b">
              <tr>
                <th className="p-2 text-left w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-2 text-left font-medium">Product</th>
                <th className="p-2 text-right font-medium">Stock</th>
                <th className="p-2 text-right font-medium">Alert Qty</th>
                <th className="p-2 text-center font-medium">Order Qty</th>
                <th className="p-2 text-center font-medium">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading low stock items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No low stock items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.has(item._id);
                  const isCritical = item.quantity === 0;
                  return (
                    <tr
                      key={item._id}
                      className={`border-b transition-colors cursor-pointer hover:bg-muted/30 ${
                        isSelected ? "bg-primary/5" : ""
                      } ${isCritical ? "bg-destructive/5" : ""}`}
                      onClick={() => toggleSelect(item._id)}
                    >
                      <td className="p-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(item._id)}
                        />
                      </td>
                      <td className="p-2">
                        <div>
                          <span className="font-medium">
                            {item.product?.name || "Unknown"}
                          </span>
                          {item.variant?.attributes && (
                            <span className="text-xs text-muted-foreground ml-1.5">
                              {Object.entries(item.variant.attributes)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                        {item.location?.name && (
                          <div className="text-xs text-muted-foreground">
                            {item.location.name}
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        <span
                          className={
                            isCritical
                              ? "text-destructive font-bold"
                              : "text-chart-1 font-semibold"
                          }
                        >
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {item.quantityAlert}
                      </td>
                      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          min={1}
                          value={orderQuantities[item._id] ?? Math.max(1, item.neededQuantity || 1)}
                          onChange={(e) =>
                            updateOrderQty(item._id, Number(e.target.value) || 1)
                          }
                          className="w-16 h-7 text-center mx-auto text-sm"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {getUrgencyBadge(item.quantity, item.quantityAlert || 1)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIds.size === 0}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Import {selectedIds.size} {selectedIds.size === 1 ? "Product" : "Products"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
