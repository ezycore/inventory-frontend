---
name: sales-flow
description: 'Build, edit, debug, or audit the EzyCore SALES FLOW end-to-end (FE side): Sale list/create → Payment drawer → Sales Return creation & details → Customer Ledger sheet → Customer Credit Balance. USE WHEN: editing sales history page, payments drawer (`components/sales/history/payments-drawer.tsx`), return details sheet, customer ledger sheet, debugging "Paid column wrong after return", "cash refund not in payment list", "where did 200 tk go?" reconciliation, "use credit balance" toggle on payment forms, cross-invoice navigation from credited sale to source return. Touches `app/(protected)/sales/`, `app/(protected)/customers/`, `components/sales/`, `components/customers/`, `services/api/modules/{sales,sales-returns,customers,payments}`. **MUST be updated whenever sales/return/payment/ledger code changes.**'
---

# Sales Flow Skill (Frontend)

End-to-end map of the **Sale → Return → Payment → Customer Ledger** UI. Treat as the single source of truth.

> **Sister skill:** `inventory-backend/.claude/skills/sales-flow/SKILL.md`. Keep them in sync. **Always read both** when touching this area.

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
| [app/(protected)/sales/page.tsx](../../../app/(protected)/sales/page.tsx) | New Sale (sell page). Header has **Open POS**, carrying `?draftId=` when one is open |
| [app/(protected)/sales/pos/page.tsx](../../../app/(protected)/sales/pos/page.tsx) | Full-screen POS counter (`POS_PATH`, `constants/pos.ts`). Rendered without the sidebar by `ProtectedShell`; still under the `/sales` `RouteAccessGuard` |
| [app/(protected)/sales/history/page.tsx](../../../app/(protected)/sales/history/page.tsx) | Sales history table |
| [app/(protected)/sales/returns/page.tsx](../../../app/(protected)/sales/returns/page.tsx) | Sales returns table |
| [app/(protected)/customers/page.tsx](../../../app/(protected)/customers/page.tsx) | Customer list w/ "View Ledger" |

### Components
| File | Purpose |
|------|---------|
| [components/sales/history/columns.tsx](../../../components/sales/history/columns.tsx) | History table columns. `Paid` = real cash. Hover tooltip shows breakdown |
| [components/sales/history/payments-drawer.tsx](../../../components/sales/history/payments-drawer.tsx) | Thin orchestrator (~150 lines) — composes the 6 sub-components below; supports `mode: 'payment' \| 'summary'`; preserves 26-prop public API |
| [components/sales/history/payment-entry-form.tsx](../../../components/sales/history/payment-entry-form.tsx) | **Thin adapter (~50 LOC)** over `components/shared/payments/payment-entry-form.tsx`. Passes `doc={status, dueAmount}`, `credit={available: sale.customerId.creditBalance, label: 'Use store credit', enabled, setEnabled}`. |
| [components/sales/history/sale-details-block.tsx](../../../components/sales/history/sale-details-block.tsx) | Exports `SaleDetailsBlock` (money/meta InfoField grids + notes) + `SaleItemsList` |
| [components/sales/history/returns-history-list.tsx](../../../components/sales/history/returns-history-list.tsx) | **Thin adapter (~80 LOC)** over `components/shared/returns/returns-history-list.tsx`. Maps `SalesReturn.refundAllocation` → `NormalizedReturnAllocation`: `adjustSaleDue` → `documentDueAdjustment`, `adjustOtherDues` → `otherDueAdjustments` with `<CopyableInvoice>` reference, `customerCredit` → `counterpartyCredit` ("Converted to store credit"). |
| [components/sales/history/transactions-timeline.tsx](../../../components/sales/history/transactions-timeline.tsx) | **Thin adapter (~70 LOC)** over `components/shared/transactions/transactions-timeline.tsx`. Tone map: payment & credit_balance_payment = `in`; cash_refund = `out`. Source = `{ prefix: 'From sale', label: invoiceNumber, onClick: onNavigateToSale }`. |
| [components/sales/history/payment-history-list.tsx](../../../components/sales/history/payment-history-list.tsx) | **Thin adapter (~55 LOC)** over `components/shared/payments/payment-history-list.tsx`. Maps `Payment[]` → `PaymentHistoryItem[]` (extracts `accountName` from `payment.accountId.name`). |
| [components/sales/history/copyable-invoice.tsx](../../../components/sales/history/copyable-invoice.tsx) | Tiny inline invoice # + clipboard copy button (1.5s check icon) |
| [components/sales/sell/use-sell-page.ts](../../../components/sales/sell/use-sell-page.ts) | Sell orchestrator hook (cart, customer, discounts, submit) — **the one sale engine for New Sale AND the POS**. `useSellPage({ homePath, afterDraftSave, renderThumb })`: where a finalized draft lands, whether saving a draft leaves for the drafts list (`"history"`, default) or stays (`"stay"`, POS), and an optional cart photo. After a sale/draft the form resets to the default customer + payment account (`resetCustomerForm`), not to empty pickers. **Line price is editable** (`handleUpdatePrice`, New Sale table + POS cards): this sale only, never the product MRP (the MRP is changed at purchase — `purchase-flow` skill); combo lines stay read-only (server-priced); a customer discount in force (store `orderDiscountType/Value` — NOT the line's `discountType/discountValue`, which are frozen at add time) is re-applied to the new price; otherwise the line's own discount is left alone. **Never clamp the discount in the price handler**: it runs per keystroke, so typing "500" passes through 5 and a clamp ratchets the discount down for good (browser-caught 2026-10-04) — `toSaleItemPayload` caps `discount ≤ price` at submit instead, because the server computes `qty × (price − discount)` with no floor. It reads via `useSellPageStore.getState()` on purpose — depending on `items` would rebuild the cart columns on every keystroke and drop the input's focus |
| [components/sales/sell/order-summary-sidebar.tsx](../../../components/sales/sell/order-summary-sidebar.tsx) | New Sale's right-side summary (subtotal, discount, total, payment form, confirm) — composed from the four shared pieces below |
| [components/sales/sell/customer-balance-chips.tsx](../../../components/sales/sell/customer-balance-chips.tsx), [store-credit-toggle.tsx](../../../components/sales/sell/store-credit-toggle.tsx), [payment-breakdown.tsx](../../../components/sales/sell/payment-breakdown.tsx), [last-sale-receipt.tsx](../../../components/sales/sell/last-sale-receipt.tsx) | Shared by New Sale and the POS — never re-draw them. `PaymentBreakdown` computes Change against the total **after** store credit (`paid − (total − credit)`), the same base as `dueAmount` |
| [components/sales/pos/](../../../components/sales/pos/) | The POS counter's presentation only. `pos-screen.tsx` — layout by width: ≥1024 px scan/search + **Browse products ↔ Cart** tabs on the left, customer + payment always on the right (360/380/420 px); below that the same tabs full width and Checkout as a bottom sheet. The customer form mounts in ONE place for the current width (`useMatchesMedia`, `hooks/use-matches-media.ts`) — never render it twice. `pos-product-browser.tsx` + `pos-category-nav.tsx` (rail or chips) + `pos-product-tile.tsx` + `pos-variant-picker.tsx` size to their OWN width via Tailwind container queries (`@container`), as does `pos-cart.tsx` (New Sale's `salesColumns` table at `@3xl`, `pos-cart-cards.tsx` below). `use-pos-catalog.ts` joins the sellable rows (price/stock — the search box's cached list) to `GET /products?all&fields=name,images,categoryId,subcategoryId` (photos + category names, gated on `products.view`) through the pure, tested `pos-catalog.ts` — categories come from the products, so empty ones never show. Also: top bar, customer panel (New Sale's customer form config), checkout panel (payment method as buttons over `/accounts/payment-options`), camera scan dialog, F2/F4/F8 shortcuts |
| [components/sales/product-search.tsx](../../../components/sales/product-search.tsx) | The sell-side Fuse product picker. `onScan` makes it ONE scan-or-search box (scanner burst or unmatched Enter → `onScan`; Bangla digits normalized; exact barcode lists one row); `thumbnails` adds photos |
| [components/sales/returns/return-details-sheet.tsx](../../../components/sales/returns/return-details-sheet.tsx) | Wraps shared sheet for sales context; maps `adjustOtherDues[].invoiceNumber` → `referenceLabel` and forwards `customerCredit` → shared generic `counterpartyCredit`. The shared sheet labels it via `variant` config (`Customer Credit` / `Converted to store credit`). |
| [components/sales/returns/refund-allocation-card.tsx](../../../components/sales/returns/refund-allocation-card.tsx) | Sales adapter over shared card; enables `showCustomerCredit` and passes `currentCustomerCreditBalance` |
| [components/sales/returns/use-sales-return-page.ts](../../../components/sales/returns/use-sales-return-page.ts) | Owns `customerCreditAmount` state; subtracts it from `remainingForRefund`; emits `refundAllocation.customerCredit` on submit. Delegates to `use-returnable-items.ts` + `use-refund-allocation.ts` |
| [components/sales/returns/use-returnable-items.ts](../../../components/sales/returns/use-returnable-items.ts) | Per-line return qty/reason state + computed return totals |
| [components/sales/returns/use-refund-allocation.ts](../../../components/sales/returns/use-refund-allocation.ts) | `adjustSaleDue` / `adjustOtherDues` / `accountRefund` allocation state + remaining math |
| [components/shared/returns/refund-allocation-card.tsx](../../../components/shared/returns/refund-allocation-card.tsx) | Shared card with optional `showCustomerCredit` slot (sales only) |
| [components/shared/returns/return-details-sheet.tsx](../../../components/shared/returns/return-details-sheet.tsx) | Shared return sheet w/ reconciliation block (4-part allocation); copy-icon on cross-invoice refs via `CopyableRef` |
| [components/customers/customer-ledger-sheet.tsx](../../../components/customers/customer-ledger-sheet.tsx) | Thin orchestrator — owns ledger query, pagination and a `mode` of `"ledger" | "invoice" | "bulk"`; composes the sub-components below. `bulk` is the customer-level receipt (§4b of the BE skill) and is the only mode that fetches `useCustomerOutstanding`. |
| [components/customers/customer-ledger-summary.tsx](../../../components/customers/customer-ledger-summary.tsx) | 4-stat header (Total Paid / Total Due / Refunded+credit / Store Credit); returns null when accounts disabled |
| [components/customers/customer-ledger-entries.tsx](../../../components/customers/customer-ledger-entries.tsx) | Per-entry renderers (sale w/ Pay Due / inboundCredit / return / cashRefund / payment / receipt); exports `LedgerEntry` discriminated union |
| [components/customers/ledger-receipt-entry.tsx](../../../components/customers/ledger-receipt-entry.tsx) | One multi-invoice receipt row — total collapsed, expands to the per-invoice split |
| [components/customers/group-ledger-payments.ts](../../../components/customers/group-ledger-payments.ts) | `groupLedgerPayments` — folds payment rows sharing a `receiptNumber` into one `receipt` entry; rows without one pass through |
| [components/customers/customer-payment-form.tsx](../../../components/customers/customer-payment-form.tsx) | In-sheet **single-invoice** payment form w/ sale mini-card; Cancel returns to ledger view |
| [components/customers/customer-bulk-payment-form.tsx](../../../components/customers/customer-bulk-payment-form.tsx) | **Receive Payment** — one amount across many invoices; blocks submit while anything is unallocated |
| [components/customers/payment-allocation-table.tsx](../../../components/customers/payment-allocation-table.tsx) | Per-invoice split rows (checkbox + editable amount), oldest first |
| [components/customers/use-bulk-payment-allocation.ts](../../../components/customers/use-bulk-payment-allocation.ts) | Allocation state. Auto mode mirrors the server's oldest-first fill; touching a row flips to manual and the split is sent with `autoAllocate: false` |
| [components/customers/payment-source-fields.tsx](../../../components/customers/payment-source-fields.tsx) | **Shared** amount + account select + store-credit toggle + notes — used by BOTH payment forms. Do not re-inline these fields. |
| [components/customers/columns.tsx](../../../components/customers/columns.tsx) | Customers list — includes `creditBalance` column (blue when > 0). Parity with suppliers list. |

### API
| File | Purpose |
|------|---------|
| [services/api/modules/sales-orders/api.ts](../../../services/api/modules/sales-orders/api.ts) | Raw fetchers incl. `getTransactions(saleId)` (unified timeline) |
| [services/api/modules/sales-orders/hooks.ts](../../../services/api/modules/sales-orders/hooks.ts) | `useSales`, `useSalePayments`, `useSaleTransactions`, `useAddSalePayment` |
| [services/api/modules/sales-returns/api.ts](../../../services/api/modules/sales-returns/api.ts) | Sales return fetchers |
| [services/api/modules/sales-returns/hooks.ts](../../../services/api/modules/sales-returns/hooks.ts) | `useSalesReturns`, `useSaleReturns`, `useCustomerPendingDues`, `useCreateSalesReturn` |
| [services/api/modules/customers/api.ts](../../../services/api/modules/customers/api.ts) | `getLedger(customerId)` returns `{ sales, payments, returns, inboundCredits, creditBalance, page, limit, total, totalPages, hasNext, hasPrev }`; `getOutstanding(customerId)` returns `{ sales, totalDue, creditBalance }`; `receivePayment(customerId, dto)` |
| [services/api/modules/customers/hooks.ts](../../../services/api/modules/customers/hooks.ts) | `useCustomerLedger`, `useCustomerOutstanding` (staleTime 0 — the preview must match the live dues), `useReceiveCustomerPayment` (spreads `sale.paid`) |

### Types
| File | Purpose |
|------|---------|
| [types/index.ts](../../../types/index.ts) | `Sale`, `SalesReturn`, `Customer`, `Payment`, `RefundAllocation`, `CustomerLedger` |

### Shared cross-flow modules (used by both sales + purchase history drawers)
| File | Purpose |
|------|---------|
| [components/shared/payments/payment-entry-form.tsx](../../../components/shared/payments/payment-entry-form.tsx) | Domain-agnostic add-payment form. Props: `doc: { status, dueAmount }`, accounts, amount/account/notes state, optional `credit: { available, label, enabled, setEnabled }`. When `credit.enabled === true` the account select is hidden and amount caps at `min(dueAmount, credit.available)`. Returns null when accounts disabled / due ≤ 0 / cancelled. |
| [components/shared/payments/payment-history-list.tsx](../../../components/shared/payments/payment-history-list.tsx) | Domain-agnostic past-payments list. `PaymentHistoryItem = { _id, amount, createdAt, paymentMethod, accountName?, notes? }`. "Add Payment" button shown only in summary mode with `dueAmount > 0`. |
| [components/shared/transactions/transactions-timeline.tsx](../../../components/shared/transactions/transactions-timeline.tsx) | Domain-agnostic timeline. Per-flow adapter maps wire types → `TimelineData { chips: TimelineChip[], entries: TimelineEntry[] }`. `Tone = "in" | "out" | "neutral"`; same tones are reused across summary chips and entry rows. `source = { prefix, label, onClick? }` powers cross-document deep-links (sales: "From sale #INV-…"; purchase: "From PO #PO-…"). |
| [components/shared/returns/returns-history-list.tsx](../../../components/shared/returns/returns-history-list.tsx) | Domain-agnostic per-return cards. `NormalizedReturn` includes `items` (with `qty × price = gross − discount disc` then `Refund: −lineRefund` math) and `allocation: NormalizedReturnAllocation { documentDueAdjustment?, otherDueAdjustments?: [{ label, amount, reference?: ReactNode }], accountRefund?, counterpartyCredit? }`. Sales adapter passes `<CopyableInvoice>` as the `reference` slot and uses `counterpartyCredit` for "Converted to store credit". |

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

**Return details sheet — reconciliation block** must render all four and show sum = net refund (✓ green / ✗ red mismatch). The shared [`components/shared/returns/refund-allocation-card.tsx`](../../../components/shared/returns/refund-allocation-card.tsx) also renders a reconciliation chip at the bottom of its CardContent: green ✓ when `adjustDocumentDueAmount + totalOtherDuesAllocated + accountRefundAmount + customerCreditAmount === totalRefundAmount` (±0.01), red ✗ with the delta otherwise.

**Sales-history Paid column** ([components/sales/history/columns.tsx](../../../components/sales/history/columns.tsx)) renders `paidAmount` with a tooltip breakdown: Paid (cash) / Refund credit applied / Cash refunded / Net received (= paid − refunded) / Due. The trigger uses dotted underline + `cursor-help` to advertise the tooltip.

**Cross-invoice rendering**:
- On Sale-A (the returned invoice) drawer: timeline includes the return event + per-part chips.
- On Sale-B (whose due was reduced via `adjustOtherDues`) drawer: timeline shows "Refund credit applied: ₹X from Return RET-... (Invoice INV-...)" — clickable, opens Sale-A's drawer.

**Cross-invoice navigation contract:**
- [`PaymentsDrawer`](../../../components/sales/history/payments-drawer.tsx) accepts optional `onNavigateToSale?: (saleId: string) => void`. When provided, `t.sourceSale.invoiceNumber` (kind `credit_applied_from_other`) renders as a `<button>` that calls the handler. The history page wires it via `useSalesHistoryPage().handleNavigateToSale`, which calls `salesApi.getById(saleId)` and sets `selectedSale` + opens drawer in summary mode.
- [`CustomerLedgerSheet`](../../../components/customers/customer-ledger-sheet.tsx) accepts optional `onOpenSale?: (saleId, invoiceNumber?) => void`. When provided, both `sourceInvoiceNumber` and `targetInvoiceNumber` on inbound-credit entries become buttons. The customers page wires it to `router.push("/sales/history")` + a toast hint.

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

### Serial / IMEI on sale lines (`components/sales/serials/`)

Backend plan `docs/plan/sale-serials.md`; behaviour in backend `docs/features/warranty.md` §8. One code
per unit on `Sale.items[].serials`; shown only while `features.warranty` is on (`useSerialsEnabled`).

| File | Purpose |
|---|---|
| `serial-entry-dialog.tsx` | **The one serial input** — one box per unit, Enter/scan advances, camera fills the first blank. Warns (IMEI Luhn, "already sold on INV-…" via `useSerialCheck`), blocks (twice on the sale, too long). Reused by the cart, the sale editor and the replacement step — never hand-roll another. |
| `use-serial-kinds.ts` | `useSerialsEnabled()`; `useSerialKindOf()` — a line's `serialKind`, else looked up by `inventoryId` in the cached sellable-products list (drafts and old persisted carts carry no kind). |
| `cart-line-serials.tsx` | The cart line's "Serials 1/2" chip (New Sale table via `getSalesColumns(..., onUpdateSerials)`, POS cards). |
| `use-serial-checkout.ts` | Checkout gate inside `handleMarkAsSold`: more codes than units → stop; missing → one confirm ("Sell anyway"). Its `ConfirmDialog` is `ctx.SerialsConfirmDialog`, mounted by BOTH sell screens. |
| `sale-serials-editor.tsx` | "Add / edit serials" on a posted sale (`sales.edit`) → `PATCH /api/warranty/sales/:id/serials`; shows each line's change log. `order-sale-serials.tsx` puts it on an online order once it has a Sale. |
| `sale-line-serials.tsx` | Read-only "S/N: …" line (sale details, lookup, claim). |
| `return-serial-picker.tsx` | Optional "which units come back" on a sales return (`ReturnItemsCard.renderItemExtra`). |

`utils/serial.ts` mirrors the backend `normalizeSerial` / `isLikelyImei` exactly — change both. The
payload (`toSaleItemPayload`) sends normalised codes only; blanks never leave the cart.

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
| Allocation 400 / sum off by a fraction (e.g. `...500.00000000000006`) | JS float drift in derived totals sent unrounded | Round every money field to 2dp with `roundMoney` from `@/lib/money` before building the payload (item `price`/`costPrice`/`discount`/`refundAmount`, `adjustSaleDue`, `adjustOtherDues[].amount`, `accountRefund.amount`, `customerCredit.amount`, `deductionAmount`, payment `amount`). BE also normalizes at the Zod boundary via `moneyAmount().transform(roundMoney)` (`validators/common.ts`). Shared helper: `frontend/lib/money.ts` ⇄ `backend/src/utils/money.ts`. |
| `POST /sales` rejected with 403 `PLAN_LIMIT_EXCEEDED` | Org hit its per-day sales quota from the MissionControl entitlement (plan limit `salesPerDay`) | Not a bug — surface `getErrorMessage(error)` as a toast (the mutation error handler already does). Drafts are exempt, so "Save draft" still works. Quota/limits are managed in the Billing page (entitlement-synced); see BE sister skill §8. |

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

---

## 7. Draft mode (Sale)

### Files
- `app/(protected)/sales/page.tsx` — Sell page. Reads `?draftId=...` via `useSearchParams`; fetches via `useSale(draftId)`; hydrates cart/customer/payment store on first match (guarded by `hydratedDraftIdRef`).
- `components/sales/sell/use-sell-page.ts` — Exposes `handleSaveAsDraft`, `handleMarkAsSold`, `isSavingDraft`, `isFinalizing`, `isDraftMode`, `draftId`. Both action handlers branch on `isDraftMode`.
- `components/sales/sell/order-summary-sidebar.tsx` — Dual button stack. Labels switch: "Confirm Sale" ↔ "Finalize Sale"; "Save as Draft" ↔ "Update Draft".
- `components/sales/history/{use-sales-history-page.ts,columns.tsx}` — Cell actions Pencil (Edit draft) and Trash2 (Delete draft) are hidden unless `row.status === "draft"`. `Draft` is the first option in the status filter.
- `types/index.ts` — `UpdateSaleDraftDto`, `FinalizeSaleDto`, `CreateSalesOrderData.status?: "draft"`.
- `services/api/modules/sales-orders/{api,hooks}.ts` — `updateDraftSale` (PATCH `/sales/:id`), `finalizeDraftSale` (POST `/sales/:id/finalize`), `deleteDraftSale` (DELETE `/sales/:id`) + matching hooks (`useUpdateDraftSale`, `useFinalizeDraftSale`, `useDeleteDraftSale`). Finalize invalidates `sales.all + detail + inventory + customers + accounts`.

### Flow
1. **Save as Draft (create)**: `useCreateSalesOrder` with `status:"draft"` → `router.push('/sales/history?status=draft')`. The POS (`afterDraftSave: "stay"`) stays on the counter instead.
2. **Edit draft**: History → Edit (Pencil) → `router.push('/sales?draftId=' + saleId)` → page hydrates. `/sales/pos?draftId=` hydrates the same way; New Sale's **Open POS** passes the id along.
3. **Update Draft**: `useUpdateDraftSale.mutateAsync({ id, data })` → after success, `clearAll()` + `resetCustomerForm()` + `setPaidAmount(0)` + reset additional discount/credit state + `router.push('/sales/history?status=draft')` (mirrors Create-Draft); the POS `router.replace(homePath)` to drop `?draftId=`.
4. **Finalize**: `useFinalizeDraftSale.mutateAsync({ id, data })` then `router.replace(homePath)` (`/sales` or `/sales/pos`).
5. **Delete draft**: `window.confirm` → `useDeleteDraftSale.mutateAsync(saleId)`.

### Pitfalls
- `availableQuantity` MUST be set high (e.g. `999999`) on hydrated items — backend stock is checked at finalize, not at hydration.
- Always guard the hydration `useEffect` with a `hydratedDraftIdRef` sentinel; otherwise toggling fields re-fires the effect and wipes user edits.
- **Restore `orderDiscount` from the customer's default discount, NOT by deriving it from items.** BE does not persist the customer-level `orderDiscountValue` separately — it bakes the percentage into each item's per-unit `discount`. A `useEffect([orderDiscountType, orderDiscountValue, updateItem])` on the sell page re-applies `applyDiscountWithPriority` to every item; with `orderDiscountValue=0` (the default) it wipes the hydrated per-item discounts back to 0. To set the right value, reuse the same source the customer-select handler uses: BE `sale.service.ts` nest-populates `customerId.defaultDiscountId` (path → `defaultDiscountId`, populated `value type`) on `getSaleById`. On hydrate read `const cd = draftSale.customerId?.defaultDiscountId; const discountType = cd?.type ?? "percentage"; const discountValue = cd?.value ?? 0;`, call `setOrderDiscount(discountType, discountValue)` BEFORE the `addItem` loop, and use `customerForm.reset({ customerId, accountId, discountType, discountValue, paidAmount, notes })` (single reset — `setValue` per-field races with combobox initialisation and the customer may not appear selected). Note: `customer.service.ts` renames `defaultDiscountId → defaultDiscount` on its own listing endpoints, but `sale.service.ts` keeps the populated field name as `defaultDiscountId` — types `SaleCustomer.defaultDiscountId` / `Customer.defaultDiscountId` are widened to `string | Discount | null` to reflect both shapes.
- Status filter must include `"draft"`. `CustomAction.hidden` is supported by `ui/components/dataTable/columns.tsx` — use it instead of conditional rendering.
- Don't call `useCreateSalesOrder` inside `handleMarkAsSold` when `isDraftMode` — it would create a NEW sale and leave the draft orphaned.
- **Adding a product already in the cart adds ONE more** (`handleProductSelect`, capped at `availableQuantity` with the `toasts.maxStock` message). Do not route it through the store's `addItem`: that REPLACES a line with the same `inventoryId` at quantity 1, which is why scanning the same box twice used to leave 1. Barcode scans, the search pick and the POS tiles all go through `handleProductSelect`.
