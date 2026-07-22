---
name: accounting-ledger
description: 'Accounts, transactions, payments and dues on the FRONTEND — the accounts page, the transactions table + create/transfer dialogs, investment entry, and the payment/due drawers reused across sales and purchases. USE WHEN: building or fixing the accounts list, a transaction or fund-transfer form, recording a payment against a customer/supplier due, showing a ledger/balance, "balance wrong / not updating", credit-balance UI, or the `accounts` feature gate. Touches `inventory-frontend/{app/(protected)/accounts,components/accounts,services/api/modules/accounts,services/api/modules/transactions}`. The MONEY rules (ledger postings, due/credit math, payment→transaction linkage, what is authoritative) are the BACKEND''s — read `inventory-backend/.claude/skills/accounting-ledger/SKILL.md`; this file does not duplicate them.'
---

# Accounting & Ledger Skill (Frontend)

The frontend for money: accounts and their balances, transactions (income/expense/transfer), and the
payment/due surfaces that also appear inside the sales and purchase flows. **The backend is
authoritative for every number** — the FE displays and submits, it never re-derives a balance.

> **The ledger rules are NOT here.** How a payment posts to `Transaction`, how dues and credit balances
> are computed, and what each `type`/`category` means live in
> [`inventory-backend/.claude/skills/accounting-ledger/SKILL.md`](../../../../inventory-backend/.claude/skills/accounting-ledger/SKILL.md).
> Read it before touching anything that changes a balance. FE-entered amounts are requests; the server
> decides the ledger effect.

---

## 1. Pages & components

- [`app/(protected)/accounts/page.tsx`](../../../app/(protected)/accounts) — the accounts list, plus
  `accounts/transactions/` for the ledger view.
- [`components/accounts/`](../../../components/accounts):
  - `cardview.tsx` — account cards with balances.
  - `investment-dialog.tsx` — record an owner investment / capital entry.
  - `transactions/columns.tsx`, `transactions/transaction-dialogs.tsx`,
    `transactions/form-configs.ts`, `transactions/transaction-stats-section.tsx` — the transactions
    table, its create/transfer dialogs, form configs and the stat tiles.

Payments **against a sale or purchase** are recorded from the sales/purchase flows (payment drawers in
`components/sales/*` and `components/purchases/*`), which post through the same accounting endpoints —
see the `sales-flow` / `purchase-flow` skills. Keep the payment-entry UI shared, not re-implemented per
flow.

---

## 2. API modules

- [`services/api/modules/accounts`](../../../services/api/modules/accounts) — account CRUD, balances,
  fund transfer.
- [`services/api/modules/transactions`](../../../services/api/modules/transactions) — the transaction
  ledger (income/expense/transfer entries, stats).

Types come from the generated backend types via `@/types/api` (`ApiAccount`, transaction/payment DTOs).
Credit balance is read from the populated customer/supplier ref — the backend now selects `creditBalance`
on those reads (it previously didn't, so the credit-payment UI read a phantom zero). Trust the server
value; don't compute credit locally.

---

## 3. Gating & display rules

- The whole accounting surface is behind the **`accounts`** feature — gate with
  `isFeatureEnabled(org, "accounts")` (`lib/feature-utils.ts`); hide accounts/transactions/payment UI
  when off.
- Money renders in the org currency via the shared formatter — don't hardcode a symbol or precision
  (money precision is 2; use `NumberField` with `precision={2}` for money inputs).
- A due is `total − paid`; a negative due is a **credit** the customer/supplier holds. Show the
  server-computed value — the FE must not re-total a ledger.

---

## 4. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Balance not updating after a payment | account/transaction queries not invalidated | invalidate `queryKeys.accounts.all()` + `transactions.*` on the mutation |
| Credit balance shows 0 despite credit | reading a field the server didn't select (old bug) | server now returns `creditBalance` on the ref — regen types, read it |
| Transfer double-counts | posting both legs client-side | one transfer call; the backend writes both ledger legs |
| Accounts UI visible without the feature | missing gate | wrap in `isFeatureEnabled(org, "accounts")` |

---

## 5. Things NOT to do

- Don't re-derive a balance, due, or credit on the client — display the server value.
- Don't record a payment outside the shared payment-entry components (keeps sales/purchase parity).
- Don't show the accounting surface when the `accounts` feature is off.
- Don't duplicate the ledger rules here — link to the backend skill.
