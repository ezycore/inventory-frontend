"use client";
// coding-standard: maintained

import { selectOptions } from "@/services/api/select-options";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertOctagon, AlertTriangle, Download, Search } from "lucide-react";

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
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { useSelectOptions } from "@/services/api";
import { deriveLinePricing } from "./helpers";

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
  variantId?: string | null;
  /**
   * The variant's attributes, flattened onto the row by the inventory list
   * transform (`transformInventory` spreads `variantOverrides` at the top
   * level). There is no nested `variant` object on this response — reading one
   * is what silently dropped the variant off every imported line.
   */
  attributes?: Record<string, unknown> | null;
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
  // Flattened product purchase tax (from the inventory list response).
  purchaseTaxRate?: number;
  purchaseTaxType?: "inclusive" | "exclusive";
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
  // Unit display names to preserve through import -> add-to-order flow
  unitName?: string | null;
  purchaseUnitName?: string | null;
  // Per-line purchase tax carried into the order.
  purchaseTaxRate?: number;
  purchaseTaxType?: "inclusive" | "exclusive";
}

export interface ImportResult {
  items: ImportedLowStockItem[];
  supplierId: string;
  supplierName: string;
  purchaseType: "instant" | "order";
  discountType: "percentage" | "fixed";
  discountValue: number;
}

// ---------- Props ----------

interface ImportLowStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (result: ImportResult) => void;
  /** Pre-select items by their inventory IDs (e.g. from low stock page redirect) */
  preSelectedIds?: string[];
  /** Pre-fill from the parent's active supplier form */
  initialSupplierId?: string;
  initialSupplierName?: string;
  initialPurchaseType?: "instant" | "order";
  initialDiscountType?: "percentage" | "fixed";
  initialDiscountValue?: number;
}

// ---------- Helpers ----------

function getUrgency(quantity: number, alertQty: number) {
  if (quantity === 0) return "Critical";
  if (quantity / alertQty < 0.5) return "High";
  return "Medium";
}

function getUrgencyBadge(
  quantity: number,
  alertQty: number,
  labels: { critical: string; high: string; medium: string },
) {
  const urgency = getUrgency(quantity, alertQty);
  if (urgency === "Critical") {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <AlertOctagon className="h-3 w-3" />
        {labels.critical}
      </Badge>
    );
  }
  if (urgency === "High") {
    return (
      <Badge className="bg-warning/10 text-warning border-warning/20 gap-1 text-xs">
        <AlertTriangle className="h-3 w-3" />
        {labels.high}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <AlertTriangle className="h-3 w-3" />
      {labels.medium}
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

/** Default order qty = ceil((quantityAlert - quantity + 1) / conversionFactor), matching the Needed Qty column */
function getDefaultOrderQty(item: ShortlistItem): number {
  const conversionFactor = item.purchaseUnit?.conversionFactor || 1;
  const neededQty = Math.max(0, item.quantityAlert - item.quantity + 1);
  return Math.max(1, Math.ceil(neededQty / conversionFactor));
}

/** Attributes of the row's variant, whichever shape the response carries them in. */
function getVariantAttributes(item: ShortlistItem): Record<string, unknown> | null {
  return item.attributes ?? item.variant?.attributes ?? null;
}

/**
 * `"Pantonix - Gastic Strength: 40"` — the same string the purchasable-products
 * picker builds server-side (`inventory.service.getPurchasableProducts`), so a
 * line reads identically whether it was imported here or added by hand.
 */
function getProductDisplayName(item: ShortlistItem, fallbackName: string): string {
  const name = item.name || fallbackName;
  const attributes = getVariantAttributes(item);
  if (!attributes) return name;
  const attrs = Object.entries(attributes)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return attrs ? `${name} - ${attrs}` : name;
}

// ---------- Component ----------

export function ImportLowStockDialog({
  open,
  onOpenChange,
  onImport,
  preSelectedIds,
  initialSupplierId = "",
  initialSupplierName = "",
  initialPurchaseType = "instant",
  initialDiscountType = "fixed",
  initialDiscountValue = 0,
}: ImportLowStockDialogProps) {
  const t = useTranslations("purchases.import");
  const tActions = useTranslations("common.actions");
  const tForm = useTranslations("purchases.form");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Purchase settings state
  const [supplierId, setSupplierId] = useState<string>(initialSupplierId);
  const [supplierName, setSupplierName] = useState<string>(initialSupplierName);
  const [purchaseType, setPurchaseTypeState] = useState<"instant" | "order">(initialPurchaseType);
  const [discountType, setDiscountTypeState] = useState<"percentage" | "fixed">(initialDiscountType);
  const [discountValue, setDiscountValueState] = useState<number>(initialDiscountValue);

  // Fetch ALL low stock items (no pagination)
  const { data: shortlistData, isLoading } = useQuery({
    queryKey: [...queryKeys.inventory.lowStock(), "import-dialog"],
    queryFn: () =>
      inventoryApi.getAll({
        all: "true",
      }),
    enabled: open,
  });

  // Fetch supplier options for the purchase settings section
  const { data: supplierOptions } = useSelectOptions(open ? selectOptions("suppliers") : null);

  const handleSupplierChange = useCallback(
    (value: string) => {
      const option = supplierOptions?.find((o) => o.value === value) as any;
      setSupplierId(value);
      setSupplierName(option?.label || "");
      if (option) {
        // Support both flat fields (discountType/discountValue) and nested (defaultDiscount.type/value)
        const dt: "percentage" | "fixed" =
          option.discountType || option.defaultDiscount?.type || option.defaultDiscountType || "percentage";
        const dv: number =
          option.discountValue ?? option.defaultDiscount?.value ?? option.defaultDiscountValue ?? 0;
        setDiscountTypeState(dt);
        setDiscountValueState(dv);
      }
    },
    [supplierOptions],
  );

  // Fetch brands and categories for filters
  const { data: brandOptions } = useSelectOptions(open ? selectOptions("brands", { fields: "_id,name" }) : null);
  // Top-level only (`parentId: "null"`). The rows are filtered client-side on
  // `item.categoryId`, which the inventory list populates from
  // `Product.categoryId` — always the TOP-LEVEL category. Offering a
  // sub-category here matched no row and emptied the list, and the inventory
  // response carries no `subcategoryId` to filter on instead.
  const { data: categoryOptions } = useSelectOptions(
    open ? selectOptions("categories", { parentId: "null", fields: "_id,name" }) : null,
  );

  // Resolve brand/category ids to display names using the already-fetched filter options.
  const brandNameById = useMemo(() => {
    const map = new Map<string, string>();
    brandOptions?.forEach((o) => map.set(o.value, o.label));
    return map;
  }, [brandOptions]);
  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categoryOptions?.forEach((o) => map.set(o.value, o.label));
    return map;
  }, [categoryOptions]);

  // This dialog reuses the plain inventory list (`inventoryApi.getAll`) as a low-stock source but
  // reads a few shortlist-only fields (`variant`, `location`) that the base `Inventory` response
  // shape doesn't declare. Cast until either the backend `Inventory` DTO declares them or this
  // switches to `/inventory/shortlist` once that endpoint has its own response DTO.
  const items: ShortlistItem[] = useMemo(
    () => (shortlistData?.data?.items || []) as unknown as ShortlistItem[],
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
      setSupplierId(initialSupplierId || "");
      setSupplierName(initialSupplierName || "");
      setPurchaseTypeState(initialPurchaseType || "instant");
      setDiscountTypeState(initialDiscountType || "percentage");
      setDiscountValueState(initialDiscountValue || 0);
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
        const attributes = getVariantAttributes(item);
        const variantAttrs = attributes
          ? Object.values(attributes).join(" ").toLowerCase()
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
    if (!supplierId) {
      toast.error(t("selectSupplierFirst"));
      return;
    }

    const selectedItems = items.filter((i) => selectedIds.has(i._id));
    const importItems: ImportedLowStockItem[] = selectedItems.map((item) => {
      const conversionFactor = item.purchaseUnit?.conversionFactor || 1;
      const quantity = orderQuantities[item._id] || getDefaultOrderQty(item);

      // price = item.price * conversionFactor, then price/discount/costPrice
      // rounded to 2dp exactly as the manual add-product form does.
      const { price, discount, costPrice } = deriveLinePricing(
        (item.price ?? 0) * conversionFactor,
        discountType,
        discountValue,
      );

      const convertedQuantity = quantity * conversionFactor;
      const total = convertedQuantity * costPrice;
      return {
        inventoryId: item._id,
        productId: item.productId || "",
        variantId: item.variantId || item.variant?._id || null,
        productName: getProductDisplayName(item, t("unknownProduct")),
        quantity,
        price,
        costPrice,
        discount,
        conversionFactor,
        convertedQuantity,
        total,
        unitName: item.unit?.name || item.unit?.shortName || null,
        purchaseUnitName: item.purchaseUnit?.unitId?.shortName || item.purchaseUnit?.unitId?.name ||  null,
        purchaseTaxRate: item.purchaseTaxRate ?? 0,
        purchaseTaxType: item.purchaseTaxType ?? "inclusive",
      };
    });
    onImport({
      items: importItems,
      supplierId,
      supplierName,
      purchaseType,
      discountType,
      discountValue,
    });
    onOpenChange(false);
  }, [items, selectedIds, orderQuantities, supplierId, supplierName, purchaseType, discountType, discountValue, onImport, onOpenChange, t]);

  const isAllSelected =
    filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {/* Purchase Settings */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("purchaseSettings")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {/* Supplier */}
            <div className="space-y-1 w-full">
              <Label className="text-xs">
                {t("supplier")} <span className="text-destructive">*</span>
              </Label>
              <Select value={supplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={t("selectSupplier")} />
                </SelectTrigger>
                <SelectContent>
                  {supplierOptions?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Type */}
            <div className="space-y-1 w-full">
              <Label className="text-xs">{t("purchaseType")}</Label>
              <Select
                value={purchaseType}
                onValueChange={(v) => setPurchaseTypeState(v as "instant" | "order")}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">{tForm("instantOption")}</SelectItem>
                  <SelectItem value="order">{tForm("orderOption")}</SelectItem>
                </SelectContent>
              </Select>
            </div>            

            {/* Discount Value */}
            <div className="space-y-1 w-full">
              <Label className="text-xs">{t("discountValue")}</Label>
              <NumberField
                precision={2}
                min={0}
                value={discountValue}
                onChange={(v) => setDiscountValueState(v ?? 0)}
                className="h-9"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder={t("allBrands")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allBrands")}</SelectItem>
              {brandOptions?.map((brand) => (
                <SelectItem key={brand.value} value={brand.value}>
                  {brand.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder={t("allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {categoryOptions?.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Select-all bar */}
        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
            {t("selectAll")}
          </label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {filteredItems.length} {t("lowStockItems")}
          </span>
        </div>

        {/* Product list — the primary focus */}
        <div className="flex-1 overflow-auto min-h-0 space-y-1.5 pr-0.5">
          {isLoading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t("loading")}</p>
          ) : filteredItems.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedIds.has(item._id);
              const isCritical = item.quantity === 0;
              const purchaseUnit = item.purchaseUnit?.unitId?.shortName || "";
              const unitName = item.unit?.shortName || "";
              const purchaseConversion = item.purchaseUnit?.conversionFactor || 1;
              const neededQty = Math.max(0, item.quantityAlert - item.quantity + 1);

              const stock = purchaseUnit
                ? `${Math.floor(item.quantity / purchaseConversion)} ${purchaseUnit} ${item.quantity % purchaseConversion > 0 ? `${item.quantity % purchaseConversion} ${unitName}` : ""}`
                : `${item.quantity} ${unitName}`;

              const baseUnitShortName = getBaseUnitShortName(item);
              const purchaseUnitQty = Math.ceil(neededQty / purchaseConversion);
              const neededQtyDisplay = purchaseUnit
                ? `${purchaseUnitQty} ${purchaseUnit} (${neededQty} ${baseUnitShortName})`
                : `${neededQty} ${baseUnitShortName}`;

              const categoryName = item.categoryId ? categoryNameById.get(item.categoryId) : undefined;
              const brandName = item.brandId ? brandNameById.get(item.brandId) : undefined;

              return (
                <div
                  key={item._id}
                  onClick={() => toggleSelect(item._id)}
                  className={`flex items-center gap-3 rounded-lg border border-l-2 px-3 py-2 cursor-pointer transition-colors ${
                    isCritical ? "border-l-destructive" : "border-l-warning"
                  } ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                >
                  <div className="flex-none" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(item._id)}
                    />
                  </div>

                  {/* Product — leads the row */}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-tight truncate">
                      {getProductDisplayName(item, t("unknownProduct"))}
                    </div>
                    {(categoryName || brandName) && (
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {categoryName && (
                          <span className="rounded border bg-muted/50 px-1.5 py-px text-[11px] font-medium text-muted-foreground">
                            {categoryName}
                          </span>
                        )}
                        {brandName && (
                          <span className="rounded border bg-muted/50 px-1.5 py-px text-[11px] font-medium text-muted-foreground">
                            {brandName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stock + urgency */}
                  <div className="flex flex-none flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm tabular-nums ${
                          isCritical ? "text-destructive font-bold" : "text-warning font-semibold"
                        }`}
                      >
                        {stock}
                      </span>
                      {getUrgencyBadge(item.quantity, item.quantityAlert || 1, {
                        critical: t("urgencyCritical"),
                        high: t("urgencyHigh"),
                        medium: t("urgencyMedium"),
                      })}
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {t("colNeededQty")}: <span className="text-primary font-semibold">{neededQtyDisplay}</span>
                    </div>
                  </div>

                  {/* Order qty */}
                  <div
                    className="flex flex-none items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <NumberField
                      precision={0}
                      min={1}
                      value={orderQuantities[item._id] ?? purchaseUnitQty}
                      onChange={(v) => updateOrderQty(item._id, v ?? 1)}
                      className="w-16 h-7 text-center text-sm"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {getOrderUnitShortName(item)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 sm:justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex min-w-6 items-center justify-center rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground tabular-nums">
              {selectedIds.size}
            </span>
            {t("selected")}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tActions("cancel")}
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedIds.size === 0}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              {t("importCount", { count: selectedIds.size })}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
