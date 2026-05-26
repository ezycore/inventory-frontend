---
name: sales-flow
description: 'Build, edit, debug, or audit the EasyStock SALES FLOW end-to-end (FE side): Sale list/create → Payment drawer → Sales Return creation & details → Customer Ledger sheet → Customer Credit Balance. USE WHEN: editing sales history page, payments drawer (`components/sales/history/payments-drawer.tsx`), return details sheet, customer ledger sheet, debugging "Paid column wrong after return", "cash refund not in payment list", "where did 200 tk go?" reconciliation, "use credit balance" toggle on payment forms, cross-invoice navigation from credited sale to source return. Touches `app/(protected)/sales/`, `app/(protected)/customers/`, `components/sales/`, `components/customers/`, `services/api/modules/{sales,sales-returns,customers,payments}`. **MUST be updated whenever sales/return/payment/ledger code changes.**'
---

# Sales Flow Skill (Frontend)

End-to-end map of the **Sale → Return → Payment → Customer Ledger** UI. Treat as the single source of truth.

> **Sister skill:** `easystock-backend/.github/skills/sales-flow/SKILL.md`. Keep them in sync. **Always read both** when touching this area.

---

## 1. Mental model

```
Sales list ──► Row "Summary" ──► PaymentsDrawer (timeline mode)
            │                       │ shows: Subtotal, Total, Paid (cash),
            │                       │        Refund Credit Applied,
            │                       │        Cash Refunded, Net Received, Due
            │                       │ timeline: sale-payments + return-credits
            │                       │           + cash-refunds (chronological)
            │
            └──► Row "Payment" ──► PaymentsDrawer (payment mode)
                                    │ form: amount, account OR "use credit balance"

Returns list ──► ReturnDetailsSheet ──► reconciliation block:
                                          Gross − Deduction = Net
                                          = (this sale) + (other dues) + cash + customerCredit
                                          ✓ balanced

Customers list ──► CustomerLedgerSheet ──► header: opening / sales / received / refunded / creditBalance / outstanding
                                           rows: date | description | ref | debit | credit | balance
                                           cross-link: click ref → opens that sale's PaymentsDrawer
```

---

## 2. File map

### Pages
| File | Purpose |
|------|---------|
| [app/(protected)/sales/page.tsx](../../../app/(protected)/sales/page.tsx) | Sell / POS page |
| [app/(protected)/sales/history/page.tsx](../../../app/(protected)/sales/history/page.tsx) | Sales history table |
| [app/(protected)/sales/returns/page.tsx](../../../app/(protected)/sales/returns/page.tsx) | Sales returns table |
| [app/(protected)/sales/customers/page.tsx](../../../app/(protected)/sales/customers/page.tsx) | Customer list w/ "View Ledger" |

### Components
| File | Purpose |
|------|---------|
| [components/sales/history/columns.tsx](../../../components/sales/history/columns.tsx) | History table columns. `Paid` = real cash. Hover tooltip shows breakdown |
| [components/sales/history/payments-drawer.tsx](../../../components/sales/history/payments-drawer.tsx) | Sale summary + transaction timeline + payment form; supports `useCreditBalance` toggle; refund allocation block renders invoice (with copy icon) + `customerCredit` row |
| [components/sales/returns/return-details-sheet.tsx](../../../components/sales/returns/return-details-sheet.tsx) | Wraps shared sheet for sales context; maps `adjustOtherDues[].invoiceNumber` → `referenceLabel` and forwards `customerCredit` |
| [components/sales/returns/refund-allocation-card.tsx](../../../components/sales/returns/refund-allocation-card.tsx) | Sales adapter over shared card; enables `showCustomerCredit` and passes `currentCustomerCreditBalance` |
| [components/sales/returns/use-sales-return-page.ts](../../../components/sales/returns/use-sales-return-page.ts) | Owns `customerCreditAmount` state; subtracts it from `remainingForRefund`; emits `refundAllocation.customerCredit` on submit |
| [components/shared/returns/refund-allocation-card.tsx](../../../components/shared/returns/refund-allocation-card.tsx) | Shared card with optional `showCustomerCredit` slot (sales only) |
| [components/shared/returns/return-details-sheet.tsx](../../../components/shared/returns/return-details-sheet.tsx) | Shared return sheet w/ reconciliation block (4-part allocation); copy-icon on cross-invoice refs via `CopyableRef` |
| [components/customers/CustomerLedgerSheet.tsx](../../../components/customers/CustomerLedgerSheet.tsx) | Customer chronological ledger w/ running balance + cross-invoice links |
| [components/customers/CustomerLedgerSheet.tsx#creditBadge](../../../components/customers/CustomerLedgerSheet.tsx) | Header chip showing `creditBalance` (store credit) |

### API
| File | Purpose |
|------|---------|
| [services/api/modules/sales-orders/api.ts](../../../services/api/modules/sales-orders/api.ts) | Raw fetchers incl. `getTransactions(saleId)` (unified timeline) |
| [services/api/modules/sales-orders/hooks.ts](../../../services/api/modules/sales-orders/hooks.ts) | `useSales`, `useSalePayments`, `useSaleTransactions`, `useAddSalePayment` |
| [services/api/modules/sales-returns/api.ts](../../../services/api/modules/sales-returns/api.ts) | Sales return fetchers |
| [services/api/modules/sales-returns/hooks.ts](../../../services/api/modules/sales-returns/hooks.ts) | `useSalesReturns`, `useSaleReturns`, `useCustomerPendingDues`, `useCreateSalesReturn` |
| [services/api/modules/customers/api.ts](../../../services/api/modules/customers/api.ts) | `getLedger(customerId)` returns `{ sales, payments, returns, inboundCredits, creditBalance, page, limit, total, totalPages, hasNext, hasPrev }` |
| [services/api/modules/customers/hooks.ts](../../../services/api/modules/customers/hooks.ts) | `useCustomerLedger` |

### Types
| File | Purpose |
|------|---------|
| [types/index.ts](../../../types/index.ts) | `Sale`, `SalesReturn`, `Customer`, `Payment`, `RefundAllocation`, `CustomerLedger` |

---

## 3. Sale display contract

Sale object now exposes **all** of these — UI must render the full breakdown, never a single "Paid" number:

| Field | Meaning | Color hint |
|---|---|---|
| `totalAmount` | invoice total | neutral |
| `paidAmount` | real cash received | green |
| `refundCreditApplied` | due cleared via return credit | blue |
| `refundedAmount` | cash given back to customer | red (with `-`) |
| `dueAmount` | `total − paid − refundCreditApplied` | red if > 0 |
| `netReceived` (derived: `paidAmount − refundedAmount`) | actual money kept | bold |

History table "Paid" column = `paidAmount` only. Hover tooltip shows the full breakdown.

---

## 4. Refund allocation (4 parts — always visible)

`SalesReturn.refundAllocation` (persisted on doc):

```ts
{
  adjustSaleDue?: number;                            // this invoice's due
  adjustOtherDues?: { dueId, saleId, invoiceNumber, amount }[];  // other invoices
  accountRefund?: { accountId, accountName, amount, paymentMethod };  // cash
  customerCredit?: { amount };                       // → customer creditBalance
}
```

**Return details sheet — reconciliation block** must render all four and show sum = net refund (✓ green / ✗ red mismatch).

**Cross-invoice rendering**:
- On Sale-A (the returned invoice) drawer: timeline includes the return event + per-part chips.
- On Sale-B (whose due was reduced via `adjustOtherDues`) drawer: timeline shows "Refund credit applied: ₹X from Return RET-... (Invoice INV-...)" — clickable, opens Sale-A's drawer.

Both directions powered by `GET /sales/:id/transactions` (backend merges & links).

**Response shape (must match what `payments-drawer.tsx` consumes):**

```ts
{
  transactions: Array<{
    id: string;
    kind: "payment" | "credit_balance_payment" | "cash_refund"
        | "credit_applied_self" | "credit_applied_from_other";
    direction: "in" | "out" | "neutral";
    amount: number;
    date: string;
    paymentMethod?: string;
    accountName?: string;
    reference?: { kind: "payment" | "salesReturn"; id: string; label: string };
    sourceSale?: { id: string; invoiceNumber: string }; // only on credit_applied_from_other
    notes?: string;
  }>;
  summary: {
    saleTotal; cashPaid; creditBalancePaid; cashRefunded;
    refundCreditApplied; netReceived;
    paidAmount; refundedAmount; refundCreditAppliedOnSale; dueAmount; status;
  };
}
```

- `credit_applied_from_other.sourceSale` is the click target for cross-invoice navigation.
- `summary` is the SOURCE OF TRUTH for the breakdown chips above the timeline — don't recompute on the FE.

---

## 5. Customer credit balance UX

- **Customer page chip**: header of CustomerLedgerSheet shows `creditBalance` with badge.
- **Payments drawer (payment mode)**: when customer has `creditBalance > 0`, show a "Use credit balance" toggle. When on, hide account picker; cap amount at `min(due, creditBalance)`.
- **Sell page** ([app/(protected)/sales/page.tsx](../../../app/(protected)/sales/page.tsx)): when a customer is selected, the Order Summary header shows two chips — outstanding **Due** (orange) and store **Credit** (emerald) — sourced from `useCustomerPendingDues(customerId)` (`{ totalDue, creditBalance }`). When `creditBalance > 0` and `total > 0`, an emerald **"Use store credit"** Switch + capped number Input appears below the payment form (max = `min(creditBalance, total)`). Toggling on auto-fills the max and subtracts it from the auto-filled `paidAmount`. The Payment Summary then renders a `Store credit applied −{amount}` row. On submit, the amount is sent as `CreateSalesOrderData.creditBalanceAmount` on `POST /sales` (NOT a separate `addPayment` call) — BE applies it atomically inside the createSale transaction (deducts wallet, sets `Sale.refundCreditApplied`, writes a `Payment{ paymentMethod:"credit" }`). Reset on customer change + after successful sale.
- **Return creation form**: shared `RefundAllocationCard` exposes `showCustomerCredit` slot (sales adapter turns it on). Hook state: `customerCreditAmount` is subtracted from `remainingForRefund` and submitted as `refundAllocation.customerCredit.amount`. Header shows the customer’s current credit balance (`sale.customerId.creditBalance`) for context.

---

## 6. Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| History "Paid" shows inflated number after return | Reading inflated `paidAmount` from old BE | Verify BE returns true `paidAmount`; this skill assumes Phase-1 BE fix |
| Drawer shows "Paid 260, Due 0" but customer didn't really pay 260 | Same | Render full breakdown (§3) |
| Cash refund line missing in payment list | Using `useSalePayments` (sale type only) | Switch to `useSaleTransactions` (unified) |
| "Where did 200 tk go?" complaint | Return sheet not rendering reconciliation block | Render all 4 parts of `refundAllocation` (§4) |
| Cross-invoice link missing | Backend `/transactions` not joining via `refundAllocation.adjustOtherDues.saleId` | See BE sister skill §6 |
| Credit balance not deducted on payment | Forgot to send `useCreditBalance: true` | Wire toggle into mutation payload |
| Store credit not applied on a new sale (wallet unchanged, sale shows full due) | Sell page forgot to send `creditBalanceAmount` in `CreateSalesOrderData` | Include `creditBalanceAmount` in the `POST /sales` body — do NOT chain a separate `addPayment` call for credit on creation |
| Customer ledger out of order | Page boundaries cut across sale/payment/return | BE returns raw `sales[] + payments[] + returns[] + inboundCredits[]` — merge & sort client-side by `createdAt` for display, use `creditBalance` for the header chip |

---

## 7. ⚠️ Maintenance discipline (MANDATORY)

**Any change in these areas MUST update this skill in the same PR/commit:**

- `app/(protected)/sales/**`, `app/(protected)/customers/**`
- `components/sales/**`, `components/customers/**`, `components/shared/returns/**`
- `services/api/modules/{sales,sales-returns,customers,payments}/**`
- `types/index.ts` (Sale/SalesReturn/Customer/Payment/RefundAllocation)

Checklist on every change:
1. New field on Sale/SalesReturn/Customer rendered? → update §3 / §4.
2. New endpoint or response shape? → update §2 API table.
3. New UX (toggle, link, badge)? → update §5.
4. Bug surfaced/fixed? → add row to §6.

**Also update the BE sister skill** in the same change. Either both move or neither moves.
