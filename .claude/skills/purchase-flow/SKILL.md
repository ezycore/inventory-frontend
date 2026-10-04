---
name: purchase-flow
description: 'Build, edit, debug, or audit the EzyCore PURCHASE FLOW end-to-end (FE side): Purchases list/create → Payment drawer → Purchase Return creation & details → Supplier Ledger sheet → Supplier Credit Balance. USE WHEN: editing purchases history page, payments drawer (`components/purchases/history/payments-drawer.tsx`), return details sheet, supplier ledger sheet, debugging "Paid column wrong after return", "cash refund not in payment list", "where did N tk go?" reconciliation, "use supplier credit" toggle on payment forms, cross-PO navigation from credited PO to source return. Touches `app/(protected)/purchases/`, `app/(protected)/suppliers/`, `components/purchases/`, `components/suppliers/`, `services/api/modules/{purchase-orders,purchase-returns,suppliers,payments}`. **MUST be updated whenever purchases/return/payment/supplier-ledger code changes.** Backend mirror: `inventory-backend/.claude/skills/purchase-flow/SKILL.md`.'
---

# Purchase Flow Skill (Frontend)

Mirror of the backend purchase-flow skill, focused on FE wiring. Money flow is inverted vs. sales-flow:
**we pay supplier (cash out); supplier may refund us (cash in)**. Read the BE skill before assuming a contract.

> **Sister skill:** [`inventory-backend/.claude/skills/purchase-flow/SKILL.md`](../../../../inventory-backend/.claude/skills/purchase-flow/SKILL.md)
> **Sales mirror:** [`.claude/skills/sales-flow/SKILL.md`](../sales-flow/SKILL.md)

---

## 1. File map

### Routes / pages
| Path | Purpose |
|------|---------|
| `app/(protected)/purchases/page.tsx` | Create PO (per-supplier cart, payment form) |
| `app/(protected)/purchases/orders/page.tsx` | Draft / ordered PO list |
| `app/(protected)/purchases/orders/[id]/edit/page.tsx` | Edit pending PO |
| `app/(protected)/purchases/history/page.tsx` | Received PO list + `SummaryCards` (StatsCard) + payment drawer trigger |
| `app/(protected)/purchases/returns/page.tsx` | Purchase return list + `SummaryCards` (StatsCard) + return details |
| `app/(protected)/suppliers/page.tsx` | Suppliers list + `SupplierLedgerSheet` |

### Components
| Path | Purpose |
|------|---------|
| `components/purchases/seller-payment-section.tsx` | **Per-seller** payment block rendered inside each supplier card on the create-PO page. Plain controlled inputs (NOT a nested DynamicForm) wired to `purchase-page-store`: AccountSelect + Paid Amount, supplier-credit Switch (only when `pendingDues.creditBalance > 0`) with capped Input, Notes textarea, per-seller Paid/Credit/Due summary. Calls `useSupplierPendingDues(seller.supplierId)` for live `creditBalance` + `totalDue` badges. |
| `components/purchases/history/summary-cards.tsx` | `SummaryCards` — StatsCard wrapper (Total Orders / Amount / Paid / Due) |
| `components/purchases/history/payments-drawer.tsx` | **Slim composer (~150 LOC)** — mirrors `components/sales/history/payments-drawer.tsx`. Composes `PaymentEntryForm`, `PurchaseDetailsBlock`, `PurchaseItemsList`, `ReturnsHistoryList`, `TransactionsTimeline`, `PaymentHistoryList`. NO inline JSX for those sections — edit the sub-components instead. |
| `components/purchases/history/purchase-details-block.tsx` | Exports `PurchaseDetailsBlock` (header info grid + money summary + notes) and `PurchaseItemsList` (per-item card showing Price × Qty, Discount, Subtotal, **Cost Price** with `×conversionFactor` suffix when UoM conversion applies; Qty + Received badges in the header). |
| `components/purchases/history/payment-entry-form.tsx` | **Thin adapter (~50 LOC)** over `components/shared/payments/payment-entry-form.tsx`. Passes `doc={status, dueAmount}` + `credit={available: order.supplierId.creditBalance, label: 'Use supplier credit', enabled, setEnabled}`. |
| `components/purchases/history/returns-history-list.tsx` | **Thin adapter (~70 LOC)** over `components/shared/returns/returns-history-list.tsx`. Maps `PurchaseReturn.refundAllocation` → `NormalizedReturnAllocation`: `adjustPurchaseDue` → `documentDueAdjustment`, `adjustOtherDues` → `otherDueAdjustments`, `supplierCredit` → `counterpartyCredit` ("Adjusted to supplier credit"). |
| `components/purchases/history/payment-history-list.tsx` | **Thin adapter (~55 LOC)** over `components/shared/payments/payment-history-list.tsx`. Maps `Payment[]` → `PaymentHistoryItem[]`. |
| `components/purchases/history/transactions-timeline.tsx` | **Thin adapter (~75 LOC)** over `components/shared/transactions/transactions-timeline.tsx`. Tone map: payment & credit_balance_payment = `out` (we pay supplier); cash_refund = `in` (supplier refunds us). Source = `{ prefix: 'From PO', label: orderNumber, onClick: onNavigateToPurchaseOrder }`. |
| `components/purchases/history/use-purchase-history-page.ts` | Page hook — wires `usePurchaseOrderTransactions`, holds `useSupplierCredit` state, gates payload (`accountId` / `paymentMethod` undefined when using credit). |
| `components/purchases/returns/summary-cards.tsx` | `SummaryCards` — StatsCard wrapper (Total / Refund / Pending) |
| `components/purchases/returns/*` | Create return, allocation form (adjustPurchaseDue / adjustOtherDues / accountRefund / supplierCredit) |
| `components/suppliers/SupplierLedgerSheet.tsx` | Right-sheet ledger view per supplier; 3-card summary (Total Paid / Total Due / Supplier Credit — uses `ledger.creditBalance` snapshot); inline payment form with supplier-credit toggle. Renders `inboundCredits` rows (blue `Undo2` icon, "Credit Applied") with optional `onOpenPurchaseOrder` prop for cross-PO deep-link. |
| `components/suppliers/columns.tsx` | Suppliers list — includes `creditBalance` column (blue when > 0). |

### API modules
| Path | Endpoints |
|------|-----------|
| `services/api/modules/purchase-orders/api.ts` | `GET/POST/PUT/DELETE /purchases/orders`, `GET /purchases/orders/:id/payments`, `GET /purchases/orders/:id/transactions`; the file also exports the **returns** object (`GET/POST /purchases/returns`) and `addPayment` (`POST /payments`, `type: "purchase" \| "purchaseRefund"`) — there is no separate `purchase-returns` or `payments` module |
| `services/api/modules/suppliers/api.ts` | `GET/POST/PUT/DELETE /suppliers`, `GET /suppliers/:id/ledger` |

### Types
`types/index.ts`: `PurchaseOrder`, `PurchaseReturn`, `Supplier`, `SupplierDue`, `Payment`, `PurchaseRefundAllocation`, `SupplierLedgerEntry`, `SupplierLedger` (now includes `inboundCredits?: SupplierLedgerInboundCredit[]` + `creditBalance?: number`), `SupplierLedgerInboundCredit` (`returnId`, `returnNumber`, `sourcePurchaseOrderId`, `sourceOrderNumber`, `targetPurchaseOrderId`, `targetOrderNumber?`, `amount`, `date`), `PurchaseReturnsSummary`, `CreatePurchaseOrderDto` (now includes `creditBalanceAmount?: number` mirroring `sale.creditBalanceAmount`), `SupplierPendingDuesResponse` (`{ dues, totalDue, count, creditBalance }`).

### Shared cross-flow modules (used by both sales + purchase history drawers)
| File | Purpose |
|------|---------|
| `components/shared/payments/payment-entry-form.tsx` | Domain-agnostic add-payment form. Props: `doc: { status, dueAmount }`, accounts, amount/account/notes state, optional `credit: { available, label, enabled, setEnabled }`. Purchase adapter passes `credit.label = "Use supplier credit"`. When `credit.enabled === true` the account select is hidden and amount caps at `min(dueAmount, credit.available)`. |
| `components/shared/payments/payment-history-list.tsx` | Domain-agnostic past-payments list. `PaymentHistoryItem = { _id, amount, createdAt, paymentMethod, accountName?, notes? }`. "Add Payment" button shown only in summary mode with `dueAmount > 0`. |
| `components/shared/transactions/transactions-timeline.tsx` | Domain-agnostic timeline. **Tone is inverted for purchase**: `payment` & `credit_balance_payment` = `out` (we pay supplier), `cash_refund` = `in` (supplier refunds us). Adapter chips include `supplierCreditPaid` and `netPaid`. Source = `{ prefix: "From PO", label: orderNumber, onClick: onNavigateToPurchaseOrder }`. |
| `components/shared/returns/returns-history-list.tsx` | Domain-agnostic per-return cards. Purchase adapter maps `adjustPurchaseDue → documentDueAdjustment`, `adjustOtherDues → otherDueAdjustments` (no `reference` slot — purchase has no per-PO copy-id widget), and `supplierCredit → counterpartyCredit` ("Adjusted to supplier credit"). Items render the same `qty × price = gross − discount disc` then `Refund: −lineRefund` math as sales. |

---

## 1b. Per-seller payment architecture (create-PO page)

The create-PO page (`app/(protected)/purchases/page.tsx`) supports **multi-supplier batch creation**. The BE controller (`createPurchaseOrders`) loops `createPurchaseOrder` per supplier, so every payment field MUST be per-supplier:

- **Store** (`services/stores/purchase-page-store.ts`) — `SellerSession` owns `paymentInfo?: { accountId, accountName, paymentMethod, paidAmount }`, `notes?: string`, and `creditApplied: number`. Setters: `setPaymentInfo(sellerId, info)`, `setNotes(sellerId, notes)`, `setCreditApplied(sellerId, amount)`. `getSellerDueAmount(sellerId) = max(0, netAmount - paidAmount - creditApplied)`.
- **Component** — `<SellerPaymentSection seller netAmount isAccountsEnabled formatCurrency />` rendered inside each seller card. Plain controlled inputs only (a nested DynamicForm per card would race with the active-seller form). Toggle gates on `supplierCreditBalance > 0`; Input is capped at `min(supplierCreditBalance, max(0, netAmount - paidAmount))`.
- **Accounts fetch (must match sales)** — use `useAccounts({ all: true, fields: "_id,name,isDefault,balance,type,status" })`. Lean payload, single call, same cache key shape as sales (`form-configs.tsx` payment section uses the same query string). DO NOT use `useAccounts({ limit: 100, isActive: true })` — it hits the paginated endpoint and returns full Account docs.
- **Auto-init per seller** (`SellerPaymentSection`) — when `isAccountsEnabled && accounts.length && netAmount > 0 && !seller.paymentInfo`, the component pre-selects the account with `isDefault: true` (fallback `accounts[0]`) and pre-fills `paidAmount = max(0, netAmount - creditApplied)`. Guarded by a per-seller `useRef` so user edits are never overwritten. Mirrors the sales pattern in `components/sales/sell/use-sell-page.ts` (sales reads `user.defaultData.accountId`; purchase derives from the accounts list because PO creation runs once-per-seller in a loop and we want the *current* default, not the user's stored preference).
- **Page** — NO global payment form, NO global notes field. The sidebar Order Summary only shows batch totals (`grandPaid`, `grandCreditApplied`, `grandDue`) summed over `sellersWithItems`.
- **Supplier-switch handler MUST read store via `usePurchasePageStore.getState()`** inside `handleSupplierFieldChange`, not via the destructured `activeSeller` from the render closure. Reason: DynamicForm fires `onFieldChange` events in rapid succession (the supplier `select` calls `controllerField.onChange` → `handleChange` → autofill which fires more `onFieldChange`s synchronously). The `useCallback`-captured `activeSeller` can be stale across that burst, causing the IF-branch `items.length > 0 && supplier.value !== activeSeller.supplierId` to evaluate against an empty seller and incorrectly take the ELSE branch — which **renames the current seller in place instead of creating a new one**, silently destroying the previous supplier's items. After the fix, the handler also derives `targetSellerId` once and applies `setSupplier` + `setDiscountType` + `setDiscountValue` to that ID (not to the stale `activeSeller.id`).
- **Submit** — `handleCompleteOrder` reads `seller.paymentInfo`, `seller.creditApplied`, `seller.notes` per seller and builds payload per supplier:
  ```ts
  orderData.payment = { accountId, paidAmount: min(sellerPaid, max(0, netAmount - sellerCredit)) };
  if (sellerCredit > 0) orderData.creditBalanceAmount = sellerCredit;
  if (seller.notes) orderData.notes = seller.notes;
  ```
  The cap on `paidAmount` mirrors BE's `CREDIT_PLUS_PAID_EXCEEDS_TOTAL` guard so the request never gets rejected for accidental overpayment.

> **Anti-pattern (do NOT regress):** A single `paymentForm = useForm(...)` whose values get copied to every seller on submit. That makes every supplier's Payment doc / ledger entry use the same account and amount.

---

## 2. Money-flow inversion (FE display rules)

| UI element | Sales side | Purchase side |
|---|---|---|
| Payment direction badge | "Money in" / green | "Money out" / red |
| Refund row in drawer | "Refunded to customer" (out) | "Refunded by supplier" (in) |
| Credit balance toggle | "Use customer credit" | "Use supplier credit" |
| Ledger entry type | `sale` / `salesRefund` | `purchase` / `purchaseRefund` |
| Account effect description | `−` cash on refund | `+` cash on refund |

**Always read the BE response — do not invent direction signs on the FE.** BE returns explicit `direction: "in" | "out" | "neutral"` and `sourcePurchase` for cross-PO links.

---

## 3. Critical contracts (DO / DON'T)

- **DO** use `useSupplierLedger(supplierId, filters)` hook — never call `apiClient.get('/suppliers/.../ledger')` directly from a component.
- **DO** use `usePurchaseOrderTransactions(poId)` for the unified per-PO timeline (queryKey `queryKeys.purchaseOrders.transactions(id)`).
- **DO** use `queryKeys.suppliers.*`, `queryKeys.purchaseOrders.*`, `queryKeys.purchaseReturns.*` for invalidation. After a payment or return, invalidate the PO detail + supplier ledger + purchase list + transactions.
- **DO** display `dueAmount = invoiceAmount − paidAmount − refundCreditApplied`. Don't re-derive from columns; use BE field.
- **DO** when posting `AddPurchasePaymentDto` with `useSupplierCredit: true`, omit `accountId` (BE branch hard-codes `paymentMethod:"credit"` and skips Transaction/Account mutation). Validator allows missing `accountId` only when `useSupplierCredit === true`.
- **DO** show the supplier-credit toggle only when `supplier.creditBalance > 0`; cap payment amount at `min(po.dueAmount, supplier.creditBalance)`.
- **DO NOT send `paymentMethod` from the FE** — BE defaults to `"cash"` (mirrors sales-flow). The payment form has no payment-method picker.
- **DON'T** mutate `paidAmount` on the FE after a return — BE never mutates it either. Returns and supplier-credit payments affect `refundCreditApplied` / `refundedAmount`, not `paidAmount`.
- **DON'T** swap the StatsCard variants without checking dark-mode contrast — use semantic variants (`primary`, `success`, `warning`, `destructive`).
- **DON'T** reintroduce a global payment form or global notes field on the create-PO page — they must stay on each `SellerSession` (see §1b).
- **DO** read `useSupplierPendingDues(supplierId).data.data.creditBalance` for the create-PO credit toggle; the endpoint now returns `{ dues, totalDue, count, creditBalance }` (see BE skill §5). The returns page reads `.data.data.dues` for the cross-PO allocation list.
- **DO** set `CreatePurchaseOrderDto.creditBalanceAmount` (not a new field) when consuming supplier credit at PO creation — mirrors `sale.creditBalanceAmount`. BE persists it on `order.refundCreditApplied` and creates a `paymentMethod:"credit"` Payment.
- **DO** round every money value to 2 decimals with `roundMoney` from `@/lib/money` before putting it in any payload (item `price`/`costPrice`/`discount`, `additionalDiscount`, `taxTotal`, `creditBalanceAmount`, allocation amounts, `deductionAmount`, payment `amount`/`paidAmount`). BE mirrors this at the Zod boundary via `moneyAmount()` (`validators/common.ts` → `.transform(roundMoney)`). Both repos share an identical `roundMoney`/`roundTo` (`frontend/lib/money.ts` ⇄ `backend/src/utils/money.ts`).

---

## 4. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| "Paid column wrong after return" | FE subtracted refund from `paidAmount` | Read `paidAmount` as-is; show net via `paidAmount − refundedAmount` separately |
| "Cash refund not in payments drawer" | Drawer only reads `/payments`, ignoring refund Payments + transactions | Use `<TransactionsTimeline>` fed by `usePurchaseOrderTransactions` (merges payments + cash refunds + credit applications) |
| "Where did N tk go?" | Sum mismatched — forgot `refundCreditApplied` on PO | Reconcile: `invoice = paid + dueAmount + refundCreditApplied` |
| "Supplier credit toggle missing" | `supplier.creditBalance` is 0 or undefined, or toggle gated incorrectly | Toggle renders only when `(supplier.creditBalance ?? 0) > 0` AND a `setUseSupplierCredit` setter is passed |
| "Submit disabled with supplier credit on" | Old guard required `accountId` even in credit branch | Submit rule: `(!useSupplierCredit && !paymentAccountId) || !paymentAmount` |
| "All suppliers got the same account / paid amount" on batch create | Page was using a single global `paymentForm` and copying its values into every order | Per-seller `paymentInfo` / `notes` / `creditApplied` on `SellerSession` + `<SellerPaymentSection>` per card (see §1b) |
| "`supplierCreditBalance` always 0 on create-PO page" | Reading `pendingDuesData?.data?.creditBalance` instead of `pendingDuesData?.data?.data?.creditBalance` (response is double-wrapped via envelope) | Use the unwrapped hook value; if reading raw API, go through `.data.data.creditBalance` |
| "Switching supplier with items in cart overwrites the previous seller (renames mr y → mr x, items survive)" | `handleSupplierFieldChange` used the `useCallback`-closure `activeSeller`; the closure went stale across the synchronous burst of `onFieldChange` events emitted by DynamicForm's select+autofill, so `items.length > 0` evaluated to `0` and the ELSE branch ran | Read fresh state via `usePurchasePageStore.getState()` inside the handler and apply mutations to a single derived `targetSellerId` (see §1b) |
| "Payment Account empty / Paid Amount empty on every new seller card" | `SellerPaymentSection` had no auto-init effect; sales has `useEffect` in `use-sell-page.ts` that purchase did not mirror | Per-seller `useEffect` (guarded by `useRef`) that pre-selects `isDefault` account and pre-fills `paidAmount = netAmount − creditApplied` when `seller.paymentInfo` is `null` (see §1b) |
| "Account dropdown call differs from sales (`/accounts?limit=100&isActive=true` vs sales' lean `/accounts?all=true&fields=...`)" | Two different filter shapes hit two different cache keys and fetch full Account docs unnecessarily | Use `useAccounts({ all: true, fields: "_id,name,isDefault,balance,type,status" })` everywhere in the payment UI (see §1b) |
| "`REFUND_ALLOCATION_MISMATCH` / allocation sum becomes 0 on purchase return" | FE was sending `adjustSupplierDue` but BE validator/service only knows `adjustPurchaseDue`; Zod stripped the unknown key so the allocation total dropped to 0 | FE must send `adjustPurchaseDue` (this PO's due only) + `adjustOtherDues[]` (cross-PO) — never `adjustSupplierDue`. See `components/purchases/returns/use-purchase-returns-page.ts` |
| "`adjustSupplierDue: 500.00000000000006` 400 error / allocation sum off by a fraction" | JS float drift (`Math.min(...) + otherDueTotal`) was sent unrounded | Round every money field to 2dp via `roundMoney` from `@/lib/money` before building the payload. BE also normalizes at the Zod boundary (`moneyAmount().transform(roundMoney)` in `validators/common.ts`) |
| "Return Details sheet shows **Customer Credit** / 'Converted to store credit' for a purchase return" | Shared `return-details-sheet.tsx` previously carried both `customerCredit` + `supplierCredit`; the purchase adapter stuffed `supplierCredit` into the `customerCredit` slot | Shared sheet now exposes ONE generic `refundAllocation.counterpartyCredit`; the variant config supplies labels (`Supplier Credit` / `Adjusted to supplier credit`). Purchase adapter maps `supplierCredit \u2192 counterpartyCredit`, sales maps `customerCredit \u2192 counterpartyCredit`. Never reintroduce domain-named credit fields on shared components. |
| "Create PO rejected with 403 `PLAN_LIMIT_EXCEEDED`" | Org hit its per-day purchase quota from the MissionControl entitlement (plan limit `purchasePerDay`) | Not a bug — surface `getErrorMessage(error)` as a toast (mutation error handler already does). Drafts are exempt, so "Save draft" still works. Limits managed in the Billing page; see BE sister skill §8. |

---

## 5. Maintenance discipline (MANDATORY)

After touching ANY of the files above:
1. Update this skill (file map, contract, pitfalls — whichever applies).
2. Update the BE mirror (`inventory-backend/.claude/skills/purchase-flow/SKILL.md`) if the contract crosses the wire.
3. Never let the two skills drift. Either both move or neither moves.

---

## Draft mode (PurchaseOrder)

### Files
- `app/(protected)/purchases/page.tsx` — Purchases create page. Reads `?draftId=...` via `useSearchParams`; fetches via `usePurchaseOrder(draftId)`; hydrates the seller store on first match (guarded by `hydratedDraftIdRef`). Buttons branch on `isDraftMode`.
- `components/purchases/history/columns.tsx` — Cell actions: Pencil (Edit draft) + Trash2 (Delete draft), both `hidden: (row) => row.status !== "draft"`. Payment action `disabled` for drafts.
- `components/purchases/history/use-purchase-history-page.ts` — `handleEditDraft` → `router.push('/purchases?draftId=' + order._id)`. `handleDeleteDraft` uses `window.confirm` + `useDeleteDraftPurchaseOrder`.
- `components/purchases/history/filters.ts` — `Draft` option first in status filter.
- `components/purchases/status-config.tsx` — `draft` entry with Clock icon, `secondary` variant.
- `types/index.ts` — `UpdatePurchaseOrderDraftDto`, `FinalizePurchaseOrderDto`, `CreatePurchaseOrderDto.status?: "draft"`.
- `services/api/modules/purchase-orders/{api,hooks}.ts` — `updateDraft` (PATCH `/purchases/orders/:id`), `finalizeDraft` (POST `/purchases/orders/:id/finalize`), `deleteDraft` (DELETE `/purchases/orders/:id`) + hooks (`useUpdateDraftPurchaseOrder`, `useFinalizeDraftPurchaseOrder`, `useDeleteDraftPurchaseOrder`). Finalize invalidates `purchaseOrders.all + detail + inventory + suppliers + accounts`.

### Flow (single supplier per draft)
1. **Save as Draft (create)**: Each seller becomes one PO via `useCreatePurchaseOrder` with `status:"draft"` → `router.push('/purchases/history?status=draft')`.
2. **Edit draft**: History → Edit (Pencil) → `router.push('/purchases?draftId=' + orderId)`. Page hydrates supplier, items, additionalDiscount, invoiceNumber/Date, notes. `purchaseType` defaults to `"instant"` (user can switch before finalizing).
3. **Update Draft**: `useUpdateDraftPurchaseOrder.mutateAsync({ id, data })` → after success, `clearAll()` + `supplierForm.reset(...)` + `productForm.reset()` + `router.push('/purchases/history?status=draft')` (mirrors Create-Draft so the user never gets stuck on the form).
4. **Finalize**: `useFinalizeDraftPurchaseOrder.mutateAsync({ id, data })` with `status: "received" | "ordered"` derived from `seller.purchaseType` (`"instant"` → `"received"`, else `"ordered"`). On success `clearAll()` + `router.replace('/purchases/history')`.
5. **Delete draft**: `window.confirm` → `useDeleteDraftPurchaseOrder`.

### Button labels (order-summary sidebar in `app/(protected)/purchases/page.tsx`)
- Primary: "Complete Order" → "Finalize Order" when `isDraftMode`.
- Secondary: "Save as Draft" → "Update Draft" when `isDraftMode`. Loading text "Saving..." while `updateDraftMutation.isPending`.

### Pitfalls
- A draft has exactly ONE supplier. When in `isDraftMode`, both action handlers must call `mutateAsync` with `sellers[0]` only — DO NOT iterate the multi-seller array.
- `draftOrder.supplierId` may be a populated `Supplier` object OR a string. Cast through `unknown` before string narrowing to satisfy TS.
- Hydrated items use the same `addItem(sellerId, ...)` shape the page uses for fresh selections — pass `inventoryId`, `productName`, `quantity`, `price` (already per-package), `costPrice`, `discount`, `conversionFactor`, `purchaseUnitName`.
- **Unit conversion on hydrate**: PO lines store `price`/`costPrice` **per purchase unit** (the pack price — backend `PurchaseOrder.items`, see its CLAUDE.md "UOM conversion"), the same units the create page works in. Hydrate them as-is (`price: it.price`) — never multiply by `conversionFactor`. *(Corrected 2026-10-04: this line used to say the opposite, which contradicted both the backend and the hydrate code.)*
- **Editable Sale Price (MRP) → `updateMrp`**: Price (labelled "Sale Price" since 2026-10-04; the field and `updateMrp` still mean the product MRP) is editable on the add form and in the shared `EditProductDialog` (`components/purchases/edit-product-dialog.tsx`, used by New Purchase **and** Edit Purchase Order). Editing it keeps cost and re-derives discount (`discountForEditedPrice`); a line whose price differs from where it started (`isMrpEdited`) carries `updateMrp: true`, and the backend writes `price / conversionFactor` back as the product/variant MRP on a non-draft save (backend `purchase-flow` skill §7c). Rules: a **draft** hydrate keeps the stored flag (the draft never applied it); an **ordered-PO edit** hydrates every line with `updateMrp: false` — resending a stored `true` would revert a later hand edit of the MRP. Helpers live in `components/purchases/helpers.ts`.
- **Per-item discount is NOT stored on PO items.** Backend PurchaseOrder items have only `price` and `costPrice` — the discount is implicit as `price - costPrice` per unit. On hydrate, derive it: `perUnitDiscount = max(0, it.price - it.costPrice)`. Saving back uses `discount: cart.item.discount / cf` but the BE re-computes/drops it; it round-trips only through `costPrice`.
- **Restore seller `discountValue` from the supplier's default discount, NOT by deriving it from items.** BE does not persist the seller-level `discountValue` field separately. BE `purchase-order.service.ts` nest-populates `supplierId.defaultDiscountId` (path → `defaultDiscountId`, populated `value type`) on `getPurchaseOrderById` / `getPurchaseOrders`. On hydrate, read `const sd = supplierObj?.defaultDiscountId; const discountType = sd?.type ?? "percentage"; const discountValue = sd?.value ?? 0;` and call `setDiscountType(sellerId, discountType)` + `setDiscountValue(sellerId, discountValue)` — mirrors the supplier-select handler. Then call `supplierForm.reset({ supplierId, purchaseType, discountType, discountValue, invoiceNumber, invoiceDate })` together — using `setValue` per-field races with combobox initialisation and the supplier may not appear selected. `Supplier.defaultDiscountId` is typed as `string | Discount | null` to accommodate both the raw-id and populated shapes.
- Always guard hydration with `hydratedDraftIdRef` — otherwise editing wipes user changes on next render.
- Payment action in history must be `disabled` for drafts (no due yet).
