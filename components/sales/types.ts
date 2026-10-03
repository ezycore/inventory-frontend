import type { DiscountType } from "@/utils/discount";
import type { AccountPaymentOption, SaleItemPayload, TaxType } from "@/types";

// Re-export the canonical sale-line payload union so sales components/hooks can
// import it from this module.
export type { SaleItemPayload };

// =====================
// API Response Types
// =====================

export interface CustomerApiItem {
  _id: string;
  name: string;
  email?: string;
  defaultDiscount?: {
    value?: number;
    type?: DiscountType;
  };
}

export interface ProductApiItem {
  _id: string; // inventoryId
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  productId: string;
  variantId: string | null;
  conversionFactor?: number;
  unitName?: string | null;
  saleUnitName?: string | null;
  purchaseUnitName?: string | null;
  quantityAlert: number;
  barcode?: string;
  hasExpiry?: boolean;
  taxRate?: number;
  taxType?: TaxType;
  /** Purchase-side tax (from product.purchaseTax); present on purchasable-products. */
  purchaseTaxRate?: number;
  purchaseTaxType?: TaxType;
}

export interface AccountApiItem {
  _id: string;
  name: string;
  isDefault: boolean;
  balance: number;
}

export interface CustomerApiResponse {
  data?: {
    items?: CustomerApiItem[];
  };
}

export interface ProductApiResponse {
  data?: ProductApiItem[];
}

export interface AccountApiResponse {
  data?: {
    items?: AccountApiItem[];
  };
}

/**
 * GET /api/accounts/payment-options — a flat array under `data`, not the
 * paginated `{items}` envelope `AccountApiResponse` carries, and no
 * `balance`/`type`/`status`: this endpoint is reachable by sales.create
 * (no accounts.view needed), so those never leave the database for it.
 */
export interface AccountPaymentOptionApiResponse {
  data?: AccountPaymentOption[];
}
export interface ExtractedCustomer {
  value: string | null;
  label: string | null;
  email?: string | null;
  discountType: DiscountType;
  discountValue: number;
}

export interface ExtractedProduct {
  value: string; // inventoryId
  label: string;
  price: number;
  /**
   * Pre-discount price, rendered as a struck-through "was" in the picker.
   *
   * Only the ecommerce create-order picker sets it, and only when a live
   * campaign actually lowered the row — the POS list has no campaign concept.
   */
  compareAt?: number;
  costPrice: number;
  availableQuantity: number;
  /**
   * `false` when the workspace keeps no stock, in which case
   * `availableQuantity` is `Number.MAX_SAFE_INTEGER` and is not a count.
   *
   * The sentinel exists so every `> 0` test downstream keeps working unchanged,
   * which it does — but the picker PRINTS the number, and a row reading
   * "9007199254740991 in stock" is the one place that trade-off has to be paid
   * for explicitly.
   */
  tracked?: boolean;
  productId: string;
  variantId: string | null;
  conversionFactor?: number;
  unitName?: string | null;
  saleUnitName?: string | null;
  purchaseUnitName?: string | null;
  quantityAlert: number;
  barcode?: string;
  hasExpiry?: boolean;
  taxRate?: number;
  taxType?: TaxType;
  /** Purchase-side tax (from product.purchaseTax); used by the purchase form. */
  purchaseTaxRate?: number;
  purchaseTaxType?: TaxType;
  /** True for a combo/bundle entry — it has no inventory row; `value` is `combo:<id>`. */
  isCombo?: boolean;
  /** Combo product id (set only when isCombo). Sent to the API as a combo reference. */
  comboProductId?: string;
}
export interface OrderItem {
  productId: string;
  inventoryId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  costPrice: number;
  discount: number;
  productName: string;
  unitName?: string | null;
  saleUnitName?: string | null;
  /** Tax rate (percent) for the line, copied from the product. */
  taxRate?: number;
  /** "inclusive" = price already contains tax; "exclusive" = tax added on top. */
  taxType?: TaxType;
  /** Preview-computed tax amount for the line (UI only; backend is authoritative). */
  taxAmount?: number;
  /** Expiry-tracked product (drives the POS batch picker). UI-only. */
  hasExpiry?: boolean;
  /** Manual batch override for the line; omit/null = auto FEFO. Sent to the API. */
  batchId?: string | null;
  /** True for a combo line — `inventoryId` holds the synthetic `combo:<id>` key;
   *  the line is sent to the API as a `{ comboProductId, quantity }` reference. */
  isCombo?: boolean;
  comboProductId?: string;
}

export interface OrderPayment {
  paidAmount: number;
  accountId: string;
}

export interface CreateSalesOrderData {
  customerId?: string;
  items: SaleItemPayload[];
  additionalDiscount: number;
  totalPrice: number;
  costPrice: number;
  notes?: string;
  payment?: OrderPayment;
  dueAmount?: number;
  /** Apply this much of customer's store-credit to the sale at creation time. */
  creditBalanceAmount?: number;
  /** When "draft", BE skips inventory / payment / credit side-effects. */
  status?: "draft";
  /** Cash handed over when it exceeds what the sale settles — printed as cash received / change. */
  tenderedAmount?: number;
}
