// coding-standard: maintained
import type { TransactionCategory } from "@/types";

/**
 * The ledger category vocabulary, mirroring the backend's `src/constants/transaction.ts`.
 *
 * `TransactionCategory` is derived from the generated API types, and the `satisfies` clauses below
 * pin these arrays to it — so if the backend adds, renames or drops a category, regenerating
 * `types/api-generated.ts` turns the drift into a **compile error** here instead of a filter that
 * silently lists a value the API rejects. That is exactly what went wrong before: this list offered
 * `refund` (rejected by the model) and `investment` (since renamed `capital_in`).
 *
 * Every entry needs a matching `transactions.categories.<key>` message in `messages/{en,bn}/accounts.json`.
 */
export const ALL_TRANSACTION_CATEGORIES = [
  "sale",
  "purchase",
  "saleRefund",
  "purchaseRefund",
  "salary",
  "rent",
  "utilities",
  "shipping",
  "delivery",
  "adjustment",
  "other",
  "capital_in",
  "capital_out",
  "transfer",
  "opening_balance",
] as const satisfies readonly TransactionCategory[];

/**
 * What a human may post. Settlement categories (`sale`, `purchase`, `saleRefund`,
 * `purchaseRefund`) and internal ones (`transfer`, `opening_balance`) are absent on purpose —
 * the sale/purchase/return/transfer flows own them and the API rejects them here.
 *
 * The two directions differ: owner capital only ever flows in on the income form and out on the
 * expense form.
 */
export const INCOME_CATEGORIES = [
  "capital_in",
  "shipping",
  "adjustment",
  "other",
] as const satisfies readonly TransactionCategory[];

export const EXPENSE_CATEGORIES = [
  "salary",
  "rent",
  "utilities",
  "shipping",
  "delivery",
  "adjustment",
  "other",
  "capital_out",
] as const satisfies readonly TransactionCategory[];
