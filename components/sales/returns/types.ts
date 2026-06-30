import type { SaleItem, SalesReturnReason } from '@/types';

// ── Returnable item (sale item enriched with return state) ──────────

export interface ReturnableItem extends SaleItem {
  maxReturnableQty: number;
  returnQty: number;
  refundAmount: number;
  selected: boolean;
  salePrice: number;
  /** Tax-inclusive per-unit refund price (what the customer actually paid per unit). */
  refundUnitPrice: number;
}

// ── Due allocation row ──────────────────────────────────────────────

export interface DueAllocation {
  dueId: string;
  saleId: string;
  invoiceNumber: string;
  dueAmount: number;
  allocatedAmount: number;
  selected: boolean;
}

// ── Raw pending-due shape from API ──────────────────────────────────

export interface PendingDueRaw {
  id?: string;
  _id?: string;
  saleId: string | { _id: string; invoiceNumber?: string };
  invoiceNumber?: string;
  currentAmount: number;
}

// ── Constants ───────────────────────────────────────────────────────

export const RETURN_REASONS: { value: SalesReturnReason; label: string }[] = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'defective', label: 'Defective' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'customer_changed_mind', label: 'Customer Changed Mind' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' },
];
