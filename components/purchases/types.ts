export interface SupplierApiItem {
  _id: string;
  name: string;
  defaultDiscount: {
    type: "percentage" | "fixed";
    value: number;
  };
}
export interface ExtractedSupplier {
  value: string | null;
  label: string | null;
  defaultDiscountType: "percentage" | "fixed";
  defaultDiscountValue: number;
}

export interface SupplierFormData {
  supplierId: string | { label: string; value: string } | null;
  purchaseType: "instant" | "order";
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
}