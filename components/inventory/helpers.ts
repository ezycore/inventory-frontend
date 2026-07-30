// coding-standard: maintained
import { Inventory } from "@/types";

// Helper: Get stock level color and status key (inventory.stockLevel.* message key).
// Colours ramp destructive → warning → yellow → success. Never chart-*: that ramp
// is a monochrome cyan brand scale, so it made "Low Stock" render as light blue.
export const getStockLevelInfo = (quantity: number, alertLevel: number) => {
  if (quantity === 0) {
    return {
      statusKey: "outOfStock" as const,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      progressColor: "bg-destructive",
      variant: "destructive" as const,
    };
  }
  if (quantity <= alertLevel) {
    return {
      statusKey: "lowStock" as const,
      color: "text-warning",
      bgColor: "bg-warning/10",
      progressColor: "bg-warning",
      variant: "secondary" as const,
    };
  }
  if (quantity <= alertLevel * 1.5) {
    return {
      statusKey: "warning" as const,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
      progressColor: "bg-yellow-500",
      variant: "secondary" as const,
    };
  }
  return {
    statusKey: "healthy" as const,
    color: "text-success",
    bgColor: "bg-success/10",
    progressColor: "bg-success",
    variant: "default" as const,
  };
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
    quantityAlert: Number(data.quantityAlert),
    status: data.status,
  };

  // Only include variantId if it has a value
  if (data.variantId && data.variantId !== "") {
    submitData.variantId = data.variantId;
  }

  if (isEdit && item) {
    submitData.id = item._id;
  } else {
    // Create only: opening stock + cost + (expiry-tracked) batch capture.
    // Quantity can't be changed via update, so these are create-time only.
    const d = data as any;
    if (d.quantity != null && d.quantity !== "") {
      submitData.quantity = Number(d.quantity);
    }
    if (d.costPrice != null && d.costPrice !== "") {
      submitData.costPrice = Number(d.costPrice);
    }
    if (d.expiryDate) submitData.expiryDate = d.expiryDate;
    if (d.batchNumber) submitData.batchNumber = d.batchNumber;
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
