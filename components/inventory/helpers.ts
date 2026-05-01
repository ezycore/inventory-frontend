import { Inventory } from "@/types";
import {
  Package,
  AlertTriangle,
  RefreshCw,
  PackageX,
} from "lucide-react";

// Helper: Get stock level color and status
export const getStockLevelInfo = (quantity: number, alertLevel: number) => {
  if (quantity === 0) {
    return {
      status: "Out of Stock",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      progressColor: "bg-destructive",
      variant: "destructive" as const,
    };
  }
  if (quantity <= alertLevel) {
    return {
      status: "Low Stock",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      progressColor: "bg-chart-1",
      variant: "secondary" as const,
    };
  }
  if (quantity <= alertLevel * 1.5) {
    return {
      status: "Warning",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      progressColor: "bg-yellow-500",
      variant: "secondary" as const,
    };
  }
  return {
    status: "Healthy",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    progressColor: "bg-chart-2",
    variant: "default" as const,
  };
};

// Helper: Get restock status info (normal, ordered, hidden)
export const getRestockInfo = (restockStatus: string) => {
  switch (restockStatus) {
    case "ordered":
      return {
        label: "Ordered",
        color: "text-chart-4",
        bgColor: "bg-chart-4/10 border-chart-4/20",
        icon: RefreshCw,
      };
    case "hidden":
      return {
        label: "Hidden",
        color: "text-muted-foreground",
        bgColor: "bg-muted/50 border-muted",
        icon: PackageX,
      };
    default: // normal
      return {
        label: "Normal",
        color: "text-chart-2",
        bgColor: "bg-chart-2/10 border-chart-2/20",
        icon: Package,
      };
  }
};

// Prepare data for submit (create/update)
export const prepareSubmitData = (
  data: Inventory,
  isEdit: boolean,
  item: Inventory
) => {
  // productId may be a labelInValue option object or a plain id string.
  const rawProductId: any = data.productId;
  const productId =
    rawProductId && typeof rawProductId === "object"
      ? rawProductId.value
      : rawProductId;

  const submitData: any = {
    productId,
    locationId: data.locationId,
    quantityAlert: Number(data.quantityAlert),
    status: data.status,
  };

  // Only include variantId if it has a value
  if (data.variantId && data.variantId !== "") {
    submitData.variantId = data.variantId;
  }

  if (isEdit && item) {
    submitData.id = item._id;
  }

  return submitData;
};

/**
 * Build the multi-line stock-level display for an inventory row.
 * - Always shows the base-unit quantity.
 * - If UOM is enabled and a purchase unit is set, shows the purchase
 *   breakdown (e.g. "3 box and 14 pcs").
 * - Shows the sale-unit quantity only when the sale unit differs from
 *   the base unit (and conversion factor > 1).
 */
export interface StockLevelLine {
  text: string;
  hint: string;
}

const getUnitShortLabel = (
  u?: { name?: string; shortName?: string } | null,
): string => u?.shortName || u?.name || "";

export const getStockLevelLines = (
  item: Inventory & {
    purchaseUnit?: { unitId?: any; conversionFactor?: number };
    saleUnit?: { unitId?: any; conversionFactor?: number };
  },
): StockLevelLine[] => {
  const quantity = Number(item.quantity || 0);
  const baseUnitLabel = getUnitShortLabel(item.unit) || "pcs";
  const lines: StockLevelLine[] = [
    {
      text: `${quantity.toLocaleString()} ${baseUnitLabel}`,
      hint: "base",
    },
  ];

  const breakdown = item.quantityBreakdown;
  const hasPurchaseBreakdown =
    breakdown?.enabled &&
    (breakdown?.conversionFactor ?? 0) > 1 &&
    breakdown?.displayText;

  if (hasPurchaseBreakdown) {
    lines.push({
      text: breakdown!.displayText,
      hint: "purchase",
    });
  }

  // Sale unit line: only when sale unit is configured and different
  // from the base unit (i.e. conversionFactor > 1).
  const saleUnit = item.saleUnit;
  const saleUnitObj = saleUnit?.unitId as
    | { _id?: string; name?: string; shortName?: string }
    | undefined;
  const saleFactor = Number(saleUnit?.conversionFactor || 0);
  const baseUnitId = (item.unit as any)?._id;

  if (
    saleUnitObj &&
    saleFactor > 1 &&
    saleUnitObj._id &&
    saleUnitObj._id !== baseUnitId
  ) {
    const saleQty = Math.floor(quantity / saleFactor);
    const saleLabel = getUnitShortLabel(saleUnitObj) || "unit";
    if (saleQty > 0) {
      lines.push({
        text: `${saleQty.toLocaleString()} ${saleLabel}`,
        hint: "sale",
      });
    }
  }

  return lines;
};
