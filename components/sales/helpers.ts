import type { SelectOption } from "@/ui/components/form/type";
import type { DiscountType } from "@/utils/discount";
import type {
  AccountApiResponse,
  CustomerApiResponse,
  ExtractedCustomer,
  ExtractedProduct,
  ProductApiResponse,
} from "./types";
import { sanitize } from "@/utils";

/** One display group: either a single standalone line or the component lines of one combo. */
export interface ComboItemGroup<T> {
  key: string;
  comboLineId?: string;
  comboName?: string;
  /** Sum of the group's line subtotals (the combo's revenue when grouped). */
  comboSubtotal: number;
  items: T[];
}

/**
 * Group flat sale/return lines for display: component lines exploded from one
 * combo (same `comboLineId`) collapse under a single combo group; every other
 * line is its own group. First-appearance order is preserved. Shared by the
 * sale-detail, invoice, and returns views so combo grouping stays consistent.
 */
export function groupSaleItemsByCombo<
  T extends {
    comboLineId?: string;
    comboName?: string;
    subtotal?: number;
    productId?: string;
  },
>(items: T[]): ComboItemGroup<T>[] {
  const groups: ComboItemGroup<T>[] = [];
  const byCombo = new Map<string, ComboItemGroup<T>>();

  items.forEach((item, index) => {
    if (item.comboLineId) {
      let group = byCombo.get(item.comboLineId);
      if (!group) {
        group = {
          key: `combo-${item.comboLineId}`,
          comboLineId: item.comboLineId,
          comboName: item.comboName,
          comboSubtotal: 0,
          items: [],
        };
        byCombo.set(item.comboLineId, group);
        groups.push(group);
      }
      group.items.push(item);
      group.comboSubtotal += item.subtotal ?? 0;
    } else {
      groups.push({
        key: `item-${item.productId ?? "x"}-${index}`,
        comboSubtotal: item.subtotal ?? 0,
        items: [item],
      });
    }
  });

  return groups;
}

// =====================
// Transform Callbacks
// =====================

/**
 * Transform customer API response to select options with discount metadata
 */
export const customerItemsCreateCallback = (
  response: CustomerApiResponse,
): SelectOption[] => {
  const items = response?.data?.items || [];
  return items.map((item) => ({
    value: item._id,
    label: item.name,
    email: item.email ?? null,
    discountValue: item.defaultDiscount?.value ?? 0,
    discountType: item.defaultDiscount?.type ?? "fixed",
  })) as SelectOption[];
};

/**
 * Transform inventory API response to select options with pricing metadata
 */
export const productItemsCreateCallback = (response: ProductApiResponse): SelectOption[] => {
  const items = response?.data || [];
  return items.map((item) => ({
    value: item._id, // inventoryId
    label: item.name,
    costPrice: item.costPrice,
    price: item.price, // Match form field name
    availableQuantity: item.quantity,
    conversionFactor: item?.conversionFactor,
    productId: item.productId,
    variantId: item.variantId,
    unitName: item.unitName ?? null,
    saleUnitName: item.saleUnitName ?? null,
    purchaseUnitName: (item as any).purchaseUnitName ?? null,
    quantityAlert: item.quantityAlert,
    barcode: item.barcode ?? undefined,
    hasExpiry: !!item.hasExpiry,
    taxRate: item.taxRate ?? 0,
    taxType: item.taxType ?? "inclusive",
    // Purchase-side tax (only present on the purchasable-products response).
    purchaseTaxRate: item.purchaseTaxRate ?? 0,
    purchaseTaxType: item.purchaseTaxType ?? "inclusive",
    // Combo entries: no inventory row; value is `combo:<id>`, sent as a combo ref.
    isCombo: (item as any).isCombo ?? false,
    comboProductId: (item as any).comboProductId ?? undefined,
  })) as SelectOption[];
};

/**
 * Transform accounts API response to select options
 */
export const accountItemsCreateCallback = (
  response: AccountApiResponse,
): SelectOption[] => {
  const items = response?.data?.items || [];
  return items.map((item) => ({
    value: item._id,
    label: `${item.name} (৳${item.balance.toFixed(2)})`,
    isDefault: item.isDefault,
  })) as SelectOption[];
};


/**
 * Extract product value from form data
 */
export const extractProductValue = (val: any): ExtractedProduct | null => {
  if (!val) return null;
  if (typeof val === "object" && "value" in val) {
    return {
      value: val.value, // inventoryId
      label: val.label,
      price: val.price ?? 0,
      costPrice: val.costPrice ?? 0,
      availableQuantity: val.availableQuantity ?? 0,
      productId: (val as any).productId ?? "",
      variantId: (val as any).variantId ?? null,
      conversionFactor: (val as any).conversionFactor ?? 1,
      unitName: (val as any).unitName ?? null,
      saleUnitName: (val as any).saleUnitName ?? null,
      purchaseUnitName: (val as any).purchaseUnitName ?? null,
      quantityAlert: (val as any).quantityAlert ?? 0,
      barcode: (val as any).barcode ?? undefined,
      taxRate: (val as any).taxRate ?? 0,
      taxType: (val as any).taxType ?? "inclusive",
      purchaseTaxRate: (val as any).purchaseTaxRate ?? 0,
      purchaseTaxType: (val as any).purchaseTaxType ?? "inclusive",
    };
  }
  return null;
};

/**
 * Format currency with symbol
 */
export const formatCurrency = (amount: number) => `৳${amount.toFixed(2)}`;
