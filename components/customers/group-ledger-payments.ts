// coding-standard: maintained

import type { CustomerLedgerPayment } from "@/types";

/** One multi-invoice receipt, rebuilt from its per-invoice payment rows. */
export interface CustomerLedgerReceiptGroup {
  receiptNumber: string;
  /** Sum of the rows present — see the note in `groupLedgerPayments`. */
  amount: number;
  accountName?: string;
  createdAt: string;
  payments: CustomerLedgerPayment[];
}

/**
 * Split ledger payments into standalone rows and multi-invoice receipts.
 *
 * A customer-level receipt writes one Payment per invoice, all sharing a
 * `receiptNumber`; showing ten rows for one handover is noise, so they collapse
 * into a single entry. Rows without a `receiptNumber` (single-invoice payments,
 * refunds) pass through untouched.
 *
 * The ledger pages by sale, so a receipt that also covered invoices outside the
 * current page contributes only the rows on it — the group's `amount` is the
 * part visible here, not necessarily the full receipt.
 */
export function groupLedgerPayments(payments: CustomerLedgerPayment[]): {
  singles: CustomerLedgerPayment[];
  receipts: CustomerLedgerReceiptGroup[];
} {
  const singles: CustomerLedgerPayment[] = [];
  const byReceipt = new Map<string, CustomerLedgerReceiptGroup>();

  for (const payment of payments) {
    // Refunds never carry a receiptNumber, but guard anyway — they render as a
    // different entry type and must not be folded into a payment group.
    if (!payment.receiptNumber || payment.type === "salesRefund") {
      singles.push(payment);
      continue;
    }

    const existing = byReceipt.get(payment.receiptNumber);
    if (existing) {
      existing.amount = Math.round((existing.amount + payment.amount) * 100) / 100;
      existing.payments.push(payment);
      continue;
    }

    byReceipt.set(payment.receiptNumber, {
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      accountName: payment.accountId?.name,
      createdAt: payment.createdAt,
      payments: [payment],
    });
  }

  return { singles, receipts: [...byReceipt.values()] };
}
