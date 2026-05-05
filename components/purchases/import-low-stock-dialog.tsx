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

import { inventoryApi } from "@/services/api";
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

interface ShortlistVariant {
  _id: string;
  attributes?: Record<string, any> | null;
  price?: number;
}

interface ShortlistLocation {
  _id: string;
  name: string;
}

export interface ShortlistItem {
  _id: string;
  productId: string;
  variantId?: string;
  name: string;
  productType: string;
  price?: number;
  costPrice?: number;
  enableUOMConversion?: boolean;
  unit?: { _id: string; name: string; shortName: string } | null;
  purchaseUnit?: {
    unitId?: { _id: string; name: string; shortName: string };
    conversionFactor?: number;
  };
  saleUnit?: {
    unitId?: { _id: string; name: string; shortName: string };
    conversionFactor?: number;
  };
  variant: ShortlistVariant | null;
  location: ShortlistLocation | null;
  quantity: number;
  quantityAlert: number;
  neededQuantity: number;
  isLowStock: boolean;
  restockStatus: string;
  categoryId?: string;
  brandId?: string;
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
  total: number;
}

// ---------- Props ----------

interface ImportLowStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: ImportedLowStockItem[]) => void;
  /** Pre-select items by their inventory IDs (e.g. from low stock page redirect) */
  preSelectedIds?: string[];
  discountInfo?: { type: "percentage" | "fixed"; value: number } | null;
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

/** Get the unit shortName to display for order qty (purchaseUnit if exists, else root unit) */
function getOrderUnitShortName(item: ShortlistItem): string {
  return item.purchaseUnit?.unitId?.shortName || item.unit?.shortName || "";
}

/** Get the base unit shortName */
function getBaseUnitShortName(item: ShortlistItem): string {
  return item.unit?.shortName || "";
}

/** Default order qty = ceil(neededQuantity / conversionFactor) */
function getDefaultOrderQty(item: ShortlistItem): number {
  const conversionFactor = item.purchaseUnit?.conversionFactor || 1;
  return Math.max(1, Math.ceil((item.neededQuantity || 1) / conversionFactor));
}

function getProductDisplayName(item: ShortlistItem): string {
  const name = item.name || "Unknown Product";
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
  preSelectedIds,
  discountInfo
}: ImportLowStockDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch ALL low stock items (no pagination)
  const { data: shortlistData, isLoading } = useQuery({
    queryKey: [...queryKeys.inventory.lowStock(), "import-dialog"],
    queryFn: () =>
      inventoryApi.getAll({
        all: "true",
      }),
    enabled: open,
  });

  // Fetch brands and categories for filters
  const { data: brandOptions } = useSelectOptions(open ? "/brands?all=true&fields=id,name" : null);
  const { data: categoryOptions } = useSelectOptions(open ? "/categories?all=true&fields=id,name" : null);

  const items: ShortlistItem[] = useMemo(
    () => shortlistData?.data?.items || [],
    [shortlistData],
  );

  // Initialize order quantities when items load.
  // The setState-in-effect rule is intentionally suppressed: we are
  // synchronizing locally-edited state with newly fetched server data
  // without overwriting user edits.
  useEffect(() => {
    if (items.length > 0) {
      const quantities: Record<string, number> = {};
      for (const item of items) {
        if (!(item._id in orderQuantities)) {
          quantities[item._id] = getDefaultOrderQty(item);
        }
      }
      if (Object.keys(quantities).length > 0) {
        setOrderQuantities((prev) => ({ ...quantities, ...prev }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Reset state when dialog opens.
  // Setting state in effect is the intentional behavior here: we want a
  // clean slate every time the dialog is re-opened.
  useEffect(() => {
    if (open) {
      setSelectedIds(
        preSelectedIds && preSelectedIds.length > 0
          ? new Set(preSelectedIds)
          : new Set(),
      );
      setSearchQuery("");
      setBrandFilter("all");
      setCategoryFilter("all");
      setOrderQuantities({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const productName = item.name?.toLowerCase() || "";
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
        if (item.brandId !== brandFilter) return false;
      }

      // Category filter
      if (categoryFilter && categoryFilter !== "all") {
        if (item.categoryId !== categoryFilter) return false;
      }

      return true;
    });
  }, [items, searchQuery, brandFilter, categoryFilter]);

  // Stats computed from fetched data
  const outOfStockCount = useMemo(
    () => items.filter((i) => i.quantity === 0).length,
    [items],
  );
  const lowStockCount = useMemo(
    () => items.length,
    [items],
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
      const conversionFactor = item.purchaseUnit?.conversionFactor || 1;
      const quantity = orderQuantities[item._id] || getDefaultOrderQty(item);

      // price = item.price * conversionFactor
      const price = (item.price ?? 0) * conversionFactor;

      // discount from supplier discount info
      const discount = discountInfo
        ? discountInfo.type === "percentage"
          ? (price * discountInfo.value) / 100
          : discountInfo.value
        : 0;

      // costPrice = price - discount
      const costPrice = price - discount;

      const convertedQuantity = quantity * conversionFactor;
      const total = convertedQuantity * costPrice;

      return {
        inventoryId: item._id,
        productId: item.productId || "",
        variantId: item.variant?._id || null,
        productName: getProductDisplayName(item),
        quantity,
        price,
        costPrice,
        discount,
        conversionFactor,
        convertedQuantity,
        total,
      };
    });

    onImport(importItems);
    onOpenChange(false);
  }, [items, selectedIds, orderQuantities, onImport, onOpenChange, discountInfo]);

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
                <th className="p-2 text-right font-medium">Needed Qty</th>
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
                  const purchaseUnit = item.purchaseUnit?.unitId?.shortName || "";
                  const purchaseConversion = item.purchaseUnit?.conversionFactor || 1;
                  const neededQty = Math.max(0, item.quantityAlert - item.quantity + 1);
                  const convertedQty = item.quantity / purchaseConversion;
                  const formattedQty = Number.isInteger(convertedQty)
                    ? convertedQty
                    : convertedQty.toFixed(2);

                  const quantityDisplay = purchaseUnit
                    ? `${item.quantity} ${item.unit?.shortName || ""} (${formattedQty} ${purchaseUnit})`
                    : `${item.quantity} ${item.unit?.shortName || ""}`;
                  const baseUnitShortName = getBaseUnitShortName(item);
                  const purcahseUnitQty = Math.ceil(neededQty / purchaseConversion);
                  const neededQtyDisplay = purchaseUnit ? `${purcahseUnitQty} ${purchaseUnit} (${neededQty} ${baseUnitShortName})` : `${neededQty} ${baseUnitShortName}`;
                  return (
                    <tr
                      key={item._id}
                      className={`border-b transition-colors cursor-pointer hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""
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
                            {getProductDisplayName(item)}
                          </span>
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
                          {/* {item.quantity} <span className="text-xs text-muted-foreground">{getBaseUnitShortName(item)}</span>  */}
                          {quantityDisplay}
                        </span>
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        <span className="font-medium">
                          {/* {item.neededQuantity || 0} <span className="text-xs text-muted-foreground">{getBaseUnitShortName(item)}</span> */}
                          {neededQtyDisplay}
                        </span>
                      </td>
                      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            // value={orderQuantities[item._id] ?? getDefaultOrderQty(item)}
                            value={purcahseUnitQty || neededQty}
                            onChange={(e) =>
                              updateOrderQty(item._id, Number(e.target.value) || 1)
                            }
                            className="w-16 h-7 text-center text-sm"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{getOrderUnitShortName(item)}</span>
                        </div>
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
        <DialogFooter className="gap-2">
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
