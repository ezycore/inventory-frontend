# COD remittance — the frontend half

**Status:** **COMPLETE — F0 through F4 shipped 2026-09-12**, the day it was written and the day the
backend half shipped. What landed matches this plan; §10 records the three places reality argued back.

**Backend plan:** [`cod-remittance.md`](../../../inventory-backend/docs/plan/cod-remittance.md) — read
its **§12 "What the implementation changed"** before touching anything here. This file does not
restate the business problem or the ledger design; it owns only what the merchant sees.

**File paths below include files that do not exist yet** (everything under
`components/ecommerce/payouts/` and `services/api/modules/courier-payouts/`) — `docs/plan/**` is
exempt from `docs:verify` for exactly this reason. Every path cited as *existing* was checked.

**Owner docs after landing:** [`storefront`](../../.claude/skills/storefront/SKILL.md) (the payout
screens), [`accounting-ledger`](../../.claude/skills/accounting-ledger/SKILL.md) (the clearing
account type and the two reports), [`query-cache`](../../.claude/skills/query-cache/SKILL.md) (the
new events).

> **The one-line summary.** The backend can now park COD with a courier, read the courier's real
> charge, and reconcile a remittance. None of it is reachable from the UI, and four places on screen
> now state something untrue because of it. F0 is the part that is *wrong*; F1–F4 are the part that
> is *missing*.

---

## 0. What the backend shipped, and what it left unreachable

Eight endpoints, none of which this app calls:

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/ecommerce/payouts` | `storefront.orders.view` |
| `POST` | `/api/ecommerce/payouts` | `storefront.orders.manage` |
| `GET` | `/api/ecommerce/payouts/:id` | `storefront.orders.view` |
| `POST` | `/api/ecommerce/payouts/:id/post` | `storefront.orders.manage` |
| `POST` | `/api/ecommerce/payouts/sync` | `storefront.orders.manage` |
| `GET` | `/api/ecommerce/payouts/summary` | `storefront.orders.view` |
| `POST` | `/api/ecommerce/orders/:id/courier-charges` | `storefront.orders.manage` |
| `PATCH` | `/api/ecommerce/orders/:id/courier-cost` | `storefront.orders.manage` |

All eight are gated on the **`storefront`** feature, not `accounts`. That is deliberate on the
backend (a merchant with the ledger switched off still needs to know what the courier is holding;
posting degrades, recording does not) and it constrains where these screens may live — see **D1**.

Six new response fields on endpoints this app *already* calls, every one of them currently ignored:

| Field | Endpoint | What it means |
|---|---|---|
| `summary.withCourier` | `GET /api/accounts/summary` | COD a courier holds. **Excluded** from `totalBalance`. |
| `summary.withCourier` | `GET /api/reports/cash` | Same, and excluded from that report's `totalBalance` and `accountCount`. |
| `assets.withCourier` | `GET /api/reports/position` | Same, excluded from `assets.cash`, **included** in `assets.total`. |
| `type: "courier_clearing"` | every account response | A fifth account type. |
| `courier.charges` | `GET /api/ecommerce/orders/:id` | Quoted vs the courier's actual bill, with provenance and an append-only `history[]`. |
| `courier.remittance` | `GET /api/ecommerce/orders/:id` | `not_collected` / `with_courier` / `remitted`, plus the payout that cleared it. |

### 0.1 The FE type gate is red right now

`types/api-generated.ts` is generated from the backend's `openapi.json`, and the backend's copy has
moved:

```
$ grep -c payouts inventory-backend/docs/reference/openapi.json   # 36
$ grep -c payouts inventory-frontend/types/api-generated.ts       #  0
$ grep -c withCourier inventory-frontend/types/api-generated.ts   #  0
```

`pnpm verify:api-types` regenerates into a temp file and fails on any difference, so **this repo's
own gate fails until `pnpm gen:api-types` is run and committed**. That is step zero of F0, not a
task of its own.

---

## 1. What is wrong on screen right now

These are not missing features. The backend change made existing frontend code state something
untrue, and it is stating it today.

### 1.1 A clearing account renders as **Cash**

`components/accounts/cardview.tsx:147`:

```ts
const config = typeConfig[item.type] || typeConfig.cash;
```

`getTypeConfig` returns four keys. A `courier_clearing` account falls through the `||` and is drawn
with the cash label, the emerald gradient and the `Wallet` icon — money the courier has not handed
over yet, presented as cash in the drawer. That is precisely the conflation the whole
`courier_clearing` type exists to prevent, reproduced in the one place a merchant actually looks.

It does render: `accountService`'s generic list has **no** `systemKey` exclusion (only
`getPaymentOptions` does, `inventory-backend/src/services/account.service.ts:264`), and that is
deliberate — a merchant must be able to see the balance. So the row arrives and the card mislabels it.

Widening `AccountType` alone will **not** catch this: the config map is typed `Record<string, …>`,
so nothing fails to compile. See **D3**.

### 1.2 The card offers three actions the server refuses

The same card wires Edit, Delete, Add investment, Withdraw capital
(`app/(protected)/accounts/page.tsx:344`). Against a system account the backend answers:

- rename / retype / restatus / renumber → `ACCOUNT_SYSTEM_LOCKED`
- delete → `ACCOUNT_IN_USE_DEFAULT` (a `systemKey` account is permanently in use — it is the
  counterparty of its courier's whole remittance history)

So every one of them is a live button that produces an error toast. Owner capital in or out of a
courier's clearing account is not a thing that can be meant.

### 1.3 The accounts tiles lost money, and do not say so

`getAccountStats` (`app/(protected)/accounts/page.tsx:56`) renders four tiles: `totalBalance`, then
`byType.cash` / `.bank` / `.mfs`. The backend now keeps `courier_clearing` out of `totalBalance` and
reports it as `summary.withCourier` — and `withCourier` has **zero hits anywhere in this repo**.

Net effect the first time a payout is parked: the Total Balance tile drops by the clearing amount,
no tile accounts for the difference, and the card grid below still shows that money — labelled Cash
(1.1). The tiles and the cards disagree, and the screen offers no reading of why.

`accountCount` was the mirror-image slip: `accountService.getAccountSummary` counted **every** active
account, so `stats.totalBalanceDescription` ("Across {count} accounts") counted clearing accounts
whose balance it had just excluded, while the *cash report's* `accountCount` excluded them. **Fixed on
the backend 2026-09-12** — the count now counts what `totalBalance` sums, in both endpoints, pinned by
a cross-endpoint test in `cod-remittance.service.test.ts`. Nothing to do on this side.

### 1.4 Both money reports do the same, and one leaks the enum

- `components/reports/cash/cash-summary-cards.tsx:53` — same `totalBalance` tile, same silent drop.
  Its type is `CashReport["summary"]` from the generated spec, so after regen `withCourier` exists
  on the type and renders nowhere. An added field is never a compile error.
- `components/reports/position-report.tsx:85` — `assets.cash` has a row, `assets.withCourier` does
  not. Here the money vanishes from the asset lines while remaining inside `assets.total`, so the
  rows stop summing to their own total.
- `components/reports/cash/cash-account-table.tsx:26` degrades honestly and ugly:
  ```ts
  return tAccountTypes.has(key) ? tAccountTypes(key) : type;
  ```
  With no message key it prints the raw `courier_clearing`. One key pair in
  `accounts.accounts.types` fixes this **and** 1.1 — both read that namespace.

---

## 2. What does not exist at all

### 2.1 No payout screen, so nothing ever posts

The sharpest gap, and it is not cosmetic. `courierPayoutSweep.job` records payouts as `pending` and
**posts nothing** by design — no poller can know which bank or bKash account the money landed in,
and the pending state is also the merchant's chance to see the courier's deductions before agreeing
to them. With no screen to confirm one, `postPayout` is never called, so:

- the clearing balance only ever grows;
- the net never reaches a real account;
- the deductions are never booked as expenses;
- the delivery expense deferred at dispatch (`codHeldByCourier`) is never booked **at all**.

That last one matters most: the feature is not merely invisible without this screen, it is inert,
and its absence quietly suppresses an expense the old code did book.

### 2.2 The order page says nothing about charges or remittance

`order.courier.charges` carries the live evidence the whole plan was built on — quoted ৳70 against
an actual ৳186.35 — with `source` provenance and an append-only `history[]`. `courier.remittance`
says whether this parcel's money is still with the courier and which payout cleared it. The order
detail page (`app/(protected)/ecommerce/orders/[id]/page.tsx`) renders neither, and there is no way
to ask a courier what a parcel really cost (`POST …/courier-charges`).

### 2.3 The P4 summary has no consumer

`GET /api/ecommerce/payouts/summary` answers four questions — COD in transit with ageing buckets
measured from the **collection** (not the order), quoted-vs-actual variance with `withoutActual`
held separate, delivery margin against the courier's real bill, and payout history with
`unreconciled` / `pending` counts. Nothing calls it.

---

## 3. Decisions

### D1 — The URL decides the feature gate, so the page goes at `/ecommerce/payouts`

`featuresForPath` (`lib/nav-utils.ts:171`) matches a pathname against nav items **by URL prefix** and
accumulates `features` down the chain; `RouteAccessGuard`
(`components/shared/route-access-guard.tsx:93`) locks the screen on the result. The nav tree's
position is irrelevant — the URL alone picks the gate.

Consequences, and they are not stylistic:

- `/accounts/payouts` would inherit **`accounts`** from the `/accounts` row (`constants/navItem.ts:396`,
  `features: ["accounts"]`). A storefront merchant with the ledger off would be shown a
  feature-locked screen for a page the backend serves them.
- `/reports/courier-money` would inherit the Insights gate and the `reports.view` permission, which
  is not what the endpoint requires either.
- `/ecommerce/payouts` inherits `storefront` from the `/ecommerce` row — the correct gate, for free,
  even before a nav entry exists.

"Courier remittance is money, so it belongs under Money" is the wrong instinct here: the gate lives
in the path.

### D2 — A nav row is still required, for the *permission*

`permissionsForPath` (`lib/nav-utils.ts:112`) works the same way, and the nearest gated ancestor of
`/ecommerce/payouts` is `/ecommerce` → `storefront.view`. The endpoints want
`storefront.orders.view` / `.manage`. A role holding `storefront.view` but not
`storefront.orders.view` would pass the frontend guard and then 403 every request behind it — the
exact failure `RouteAccessGuard`'s docstring says the table exists to prevent.

So add the row to `constants/navItem.ts` beside **Online Orders** (`:104`), which already carries
`features: ["storefront"]` + `permissions: ["storefront.orders.view"]` and sits under **Sell** for a
reason the comment there spells out: online orders are sales, so they live with the ledger rather
than with the storefront's setup screens. Remittance is the tail of that same money.

Title **"Courier Payouts"** — `title` is identity (the message key source and the kbar keyword), so
it also fixes `layout.nav.items.courier-payouts` in both locales.

### D3 — `AccountType` widens; the account form's list does not

Mirror the backend's own split (`ACCOUNT_TYPES` vs `MERCHANT_ACCOUNT_TYPES`):

- `types/index.ts:2071` — `AccountType` gains `"courier_clearing"`; `Account` gains `systemKey?: string`;
  `AccountSummary` (`:2100`) gains `withCourier` and a `courier_clearing` key in `byType`.
- `CreateAccountDto.type` must **not** widen — a merchant cannot create one of these. Give the form
  its own `MerchantAccountType` (the four) and leave the select options at
  `app/(protected)/accounts/page.tsx:187` alone. They are already correct, which is what that
  backend split was for.
- Retype `getTypeConfig`'s return to `Record<AccountType, …>` and **drop the `|| typeConfig.cash`
  fallback**. Then the fifth type is a compile error today and the sixth is a compile error in
  future, instead of silently rendering as cash. This is the whole value of the change: the fallback
  is what turned a new enum member into a lie.

### D4 — Clearing accounts stay on the accounts page; only their actions go

Hiding the card would hide the balance, and "where is my money" is the question this feature
answers. Keep the row, gate the action menu on `item.systemKey` (Edit / Delete / capital in / capital
out gone; **View transactions stays** — the remittance history is the useful part), and let the card
say plainly that the system maintains it. Same reasoning as the backend's lock: the account is
readable, not editable.

### D5 — The payout screens are English; the accounts and reports strings are bilingual

`components/ecommerce/**` is English-only by convention — 2 of 147 files use `useTranslations`, and
there is no `messages/en/ecommerce.json`. New payout screens follow their neighbours; do **not**
open a namespace for them.

The F0 fixes are the opposite: `accounts.*` and `reports.*` are fully translated, so every key lands
in `messages/en/` **and** `messages/bn/` in the same commit, per `docs/I18N-GLOSSARY.md`. New keys:
`accounts.accounts.types.courier_clearing`, `accounts.stats.withCourier` +
`withCourierDescription`, `reports.cash.withCourier`, `reports.position.withCourier`.

### D6 — The post dialog reuses `useOrderAccountOptions`

`hooks/use-order-account-options.ts` already exists for exactly this shape of problem: an order-money
picker gated by `storefront.orders.manage` rather than `accounts.view`. It reads
`GET /api/accounts/payment-options`, which the backend now filters with `systemKey: {$exists: false}`
— so **a clearing account can never be offered as a payout destination**, which would otherwise mean
transferring the courier's money to the courier.

It also returns `accountsEnabled: false` when the ledger module is off. That is the correct UI for
the backend's degrade: the payout can be **recorded** (the statement is a fact) and cannot be
**posted** (there is no ledger to post into). Say so on the button rather than hiding the screen.

### D7 — P4 lives on the payouts page, not under `/reports`

Same gate argument as D1, plus a real one: "what is the courier holding" and "what did the courier
charge" are the two halves of one screen. A merchant reconciling a statement wants the ageing next
to the payout they are confirming, not in another section under a different permission. Sections on
`/ecommerce/payouts`, with `StatsCard` tiles at the top the way the orders list already does.

### D8 — Two events, not one

`services/api/invalidation.ts` gets both, because they dirty different things:

- **`payout.recorded`** — a statement was filed. No money moved: `courierPayouts` root +
  `storefrontOrders` (lines stamp `remittance.payoutRef`). **No `MONEY`.**
- **`payout.posted`** — the transfer and the expenses were written: `courierPayouts` +
  `storefrontOrders` + `storefrontDashboard` + `MONEY` (`:43` — accounts, transactions, and
  `DERIVED` dashboard/reports).

Collapsing them into one would refetch the whole ledger on a pending record that touched none of it,
and — worse in the other direction — a single coarse event invites reusing `order.settled` (`:186`),
which does not name the payouts root at all.

`refreshCharges` is a mutation whose *response* matters and which **also writes** (it can post a
delta correction to the ledger), so it must invalidate — `order.settled` is the right existing event.
It may not go in `READ_ONLY_MUTATIONS`; `services/api/__tests__/invalidation.test.ts` is a hard gate
and that list is a claim that the endpoint writes nothing.

### D9 — The client never computes a money figure

`reconciled`, `residual`, `unrecordedGross` and every deduction total are server answers derived
from the clearing accounts. The record form sends the courier's stated `gross`, `deductions` and
`net` and lets the backend refuse `PAYOUT_UNRECONCILED` — surfaced as a **field-level error on the
net**, naming the arithmetic (`gross − deductions ≠ net`), not a toast.

Precedent, and the reasoning is already written down in
`components/ecommerce/orders/order-collection-dialog.test.tsx`: *"Its job is not to compute money;
the server re-derives every figure and refuses a request that does not reconcile."* Showing a
client-computed expected-net beside the merchant's typed net is fine — it is a hint, and it must
never be submitted in place of what the statement says.

### D10 — Never add `withCourier` into a cash figure

The same invariant the backend carries into both reports, restated on this side because a tile is
the easiest place to break it: a screen may show cash and with-courier side by side, but nothing may
sum them and call the result cash. Where a total is genuinely needed, `assets.total` already has it
and the label is *assets*, not cash.

---

## 4. Phases

### F0 — Stop the screens lying (§1)

`pnpm gen:api-types` **first**, and commit the regenerated file (§0.1).

| File | Change |
|---|---|
| `types/index.ts` | `AccountType` += `courier_clearing`; `Account.systemKey?`; `AccountSummary.withCourier` + `byType.courier_clearing`; new narrow `MerchantAccountType` for `CreateAccountDto`/`UpdateAccountDto` |
| `components/accounts/cardview.tsx` | `Record<AccountType, …>`, fallback dropped, `courier_clearing` tokens (a "held elsewhere" look — not emerald, not a wallet); action menu gated on `systemKey`; a one-line "maintained by the system" note |
| `app/(protected)/accounts/page.tsx` | A With-courier tile reading `summary.withCourier`, sited next to Total Balance so the difference reads; `courier_clearing` added to the **filter** options (not the form's) |
| `components/reports/cash/cash-summary-cards.tsx` | With-courier tile from `summary.withCourier` |
| `components/reports/position-report.tsx` | A `withCourier` row after `cash`, so the asset rows sum to `assets.total` again |
| `messages/en/accounts.json`, `messages/bn/accounts.json`, `messages/en/reports.json`, `messages/bn/reports.json` | D5's keys |

`accountCount` needed no frontend change: it was a backend disagreement, fixed there (§8.1).

### F1 — The API module (no UI)

Per `CLAUDE.md` §"Adding a New Resource Module" and the
[`api-module`](../../.claude/skills/api-module/SKILL.md) skill:

- `services/api/modules/courier-payouts/api.ts` — `list`, `get`, `record`, `post`, `sync`, `summary`;
  envelopes typed off `@/types/api` (`CourierPayout`, `CourierPayoutSync`, `CourierMoneySummary`)
- `services/api/modules/courier-payouts/hooks.ts` — `createResourceHooks()` + `useCourierMoneySummary`
- `services/api/query-keys.ts` — `courierPayouts: { ...resourceKeys("courier-payouts"), summary: () => […] }`;
  the summary key **under the payouts root** so posting one flushes it
- `services/api/invalidation.ts` — D8's two events
- `services/api/index.ts` — barrel
- `services/api/modules/storefront-orders/api.ts` + `hooks.ts` — `refreshCourierCharges(id)`,
  returning `CourierChargeRefresh`

### F2 — The payout screens

- `app/(protected)/ecommerce/payouts/page.tsx` — list + `StatsCard` tiles + `ListPagination` +
  `ListSearchInput`, following the **orders list** convention (hand-rolled `Card` rows), not
  `DataCard`/`DataTable`: these are the ecommerce screens' neighbours.
  Filters: provider, status, reconciled.
- `components/ecommerce/payouts/payout-row.tsx` — statement ref, courier, received, gross → net, a
  deductions cell, and the two flags that matter (`pending`, `!reconciled`) as badges.
- `components/ecommerce/payouts/payout-record-dialog.tsx` — the statement form (D9). Deduction
  fields named as the courier names them; `delivery` and `paymentCharge` never merged.
- `components/ecommerce/payouts/payout-detail-sheet.tsx` — the lines. An unmatched line
  (`orderId` absent) and an RTO line (`collected: 0` with a full delivery fee) are **normal** and
  must read as normal, not as errors. `residual` / `unrecordedGross` shown with the sentence that
  explains each.
- `components/ecommerce/payouts/payout-post-dialog.tsx` — destination account (D6) + the deductions
  the merchant is agreeing to, before the button.
- `components/ecommerce/payouts/payout-sync-button.tsx` — `POST /sync`, reporting per-courier
  `found` / `recorded` / `error`; Steadfast is the only real feed, the other two are assembled.
- `constants/navItem.ts` + `messages/{en,bn}/layout.json` — D2's row and its label key.

### F3 — The order page

- `components/ecommerce/orders/order-courier-charges.tsx` — quoted vs actual, the `source` badge
  (`quote` < `manual` < `webhook` < `api` < `payout`), `history[]` as a small provenance list, and
  the refresh action. `supported: false` must render as *"Steadfast publishes no charge"* — not a
  failure, and never a guessed number.
- `components/ecommerce/orders/order-remittance-row.tsx` — `with_courier` (with the clearing amount)
  / `remitted` (with a link to the payout) / `not_collected` (renders nothing).
- Wire both into `app/(protected)/ecommerce/orders/[id]/page.tsx` beside `OrderCollectionSummary`,
  which already owns "what the courier handed over at the door" — remittance is the next step of the
  same story.

### F4 — The money summary (P4)

- `components/ecommerce/payouts/cod-in-transit.tsx` — per courier, amount, parcels, `oldestDays`, the
  ageing buckets. Show the **two independent answers** (orders vs clearing accounts) side by side as
  the backend returns them; a disagreement is the finding, so it must not be reconciled into one
  number on this side.
- `components/ecommerce/payouts/charge-variance.tsx` — quoted vs actual vs margin, `withoutActual`
  stated separately (parcels with no courier figure are not parcels we got right), plus the outliers.
- `components/ecommerce/payouts/payout-history.tsx` — deduction totals by kind, `unreconciled` and
  `pending` counts.
- Link the F0 With-courier tile on `/accounts` to this page. That tile is where a merchant notices
  the money, and it is currently a dead end.

---

## 5. Traps

1. **`/accounts/payouts` inherits the wrong gate** (D1). Prefix matching, not tree position.
2. **Widening `AccountType` alone changes nothing** — `Record<string, …>` plus `|| typeConfig.cash`
   swallows it silently (1.1). Retyping the map is the fix; the union is only half of it.
3. **An added response field is never a compile error.** Nothing will tell you `withCourier` is
   unrendered. Grep the field, don't trust `typecheck`.
4. **Never render courier charges on a shopper surface.** `toShopperOrder` is a **blocklist** and
   strips `charges` / `remittance` / `shippingCostAdjustmentTxnIds`; the shopper types simply do not
   carry them. If a field appears on a storefront component, something is being read from the admin
   shape.
5. **A short payout is not an error state.** `reconciled: false` with a `residual` is a finding to
   show; the merchant still posted a real statement. Only the statement's own arithmetic refuses.
6. **A payout covering fewer parcels than the clearing balance is not short at all** (backend §12).
   Do not compute a shortfall client-side to "help".
7. **`delivery` and `paymentCharge` stay separate.** The payment charge is the disbursement fee
   (bKash's cut); folding it into delivery overstates shipping cost and makes delivery margin
   unreadable.
8. **`codFee` absent ≠ `codFee` 0.** Steadfast itemises none; render "—", not "৳0".
9. **Don't add a `messages` namespace for the ecommerce screens** (D5), and don't leave the accounts
   or reports keys English-only.
10. **`pnpm verify:api-types` is a gate**, and it is red before regen (§0.1).
11. **Every new mutation hook must invalidate or be listed with a reason** —
    `services/api/__tests__/invalidation.test.ts` is a hard gate, and `refreshCharges` writes (D8).

---

## 6. Test matrix

Colocated `*.test.tsx`, jsdom, mocked `@/services/api` — the house pattern
(`order-collection-dialog.test.tsx` is the closest model).

| # | Case | Asserts |
|---|---|---|
| 1 | `AccountCardView` with `type: "courier_clearing"` | Its own label and icon — **not** Cash |
| 2 | Same card, `systemKey` set | No Edit / Delete / capital actions; View transactions still there |
| 3 | Accounts tiles with `withCourier: 5000` | A with-courier tile renders it; Total Balance does not include it |
| 4 | `CashAccountTable` with a `courier_clearing` row | Translated label, not the raw enum |
| 5 | `PositionReport` | The asset rows sum to `assets.total` |
| 6 | Payout record dialog, `gross − deductions ≠ net` | Submit blocked or the server error lands **on the net field** (D9) |
| 7 | Payout record dialog submit | Sends the typed figures verbatim — no client-substituted net |
| 8 | Post dialog with `accounts` off | Records, cannot post, and says which |
| 9 | Post dialog account options | No `courier_clearing` account offered as a destination |
| 10 | Payout detail with an unmatched line + an RTO line | Both read as normal, neither as an error |
| 11 | Payout detail, `reconciled: false` + `residual` | Both shown, with the explanation |
| 12 | Charges panel, `supported: false` | "no charge published" — no number invented |
| 13 | Charges panel with `history[]` | Newest actual wins; provenance order preserved |
| 14 | Remittance row, all three statuses | `not_collected` renders nothing |
| 15 | COD-in-transit | Both answers rendered; not summed or reconciled |
| 16 | Variance | `withoutActual` stated separately from the parcels that matched |
| 17 | `invalidation.test.ts` | Both new events non-empty and keyed under owned roots; `refreshCharges` covered |
| 18 | `nav-utils.test.ts` | `featuresForPath("/ecommerce/payouts")` → `storefront`; `permissionsForPath` → `storefront.orders.view` |

Test 18 is the one that pins D1 and D2 against a future URL change.

---

## 7. Docs to update when this lands

- [`.claude/skills/storefront/SKILL.md`](../../.claude/skills/storefront/SKILL.md) — the payout
  screens, the new events, the order-page panels. Links to the backend `storefront-orders` skill; do
  not restate the contract.
- [`.claude/skills/accounting-ledger/SKILL.md`](../../.claude/skills/accounting-ledger/SKILL.md) —
  the fifth account type, the "never sum with-courier into cash" rule (D10), the locked-account UI.
- [`.claude/skills/reporting-analytics/SKILL.md`](../../.claude/skills/reporting-analytics/SKILL.md) —
  the two report changes.
- `CLAUDE.md` — "Route Structure" gains `/ecommerce/payouts`.
- `docs/help/en/` + `docs/help/bn/` — a guide for reconciling a courier payout, then `pnpm help:build`
  and `pnpm help:verify` (a new sidebar route with no guide covering it is a `help:verify` failure).
- `mission-control/docs/EZYCORE_MASTER_REFERENCE.md` — the admin-page count and the new screen.

---

## 8. Open questions

1. ~~**`accountCount` disagrees between two endpoints.**~~ **Closed 2026-09-12.**
   `getAccountSummary` used `accounts.length` while the cash report excluded clearing accounts from
   its count, so the two endpoints described different sets and the accounts tile read "Across 3
   accounts" over the sum of 2. Fixed in `account.service.ts`: the count is incremented in the same
   branch that adds to `totalBalance`, so the pair cannot drift again. A test now asserts both
   endpoints agree rather than pinning either figure.
2. **Does the payouts list need a location filter?** Clearing is per (courier × location) and a
   payout is stamped with one location, but one courier account shipping from two branches produces
   **one** statement (backend §10.6, unmeasured — no live multi-branch courier merchant exists). Until
   that is observed, the list stays location-scoped like every other screen and the flag on the payout
   is the signal.
3. **Should a `pending` payout be visible on the order it covers?** The line is stamped at record
   time, so the order could say "in a payout awaiting confirmation". Useful, or noise on a screen
   that already has a lot — decide after a merchant has used F2 once.
4. **Where does the with-courier figure belong on the ecommerce dashboard?** `/ecommerce/dashboard`
   is the storefront's own overview and this is storefront money. Out of scope here; worth asking once
   F4 exists.

---

## 9. Rejected

- **Its own top-level nav group ("Remittance").** One screen does not earn a group, and the rail is
  already at the length that pushed Products below the fold once (`constants/navItem.ts`, the Store
  group's comment).
- **A report under `/reports`.** D1/D7 — wrong gate, wrong permission, and it splits the ageing from
  the payout it explains.
- **Posting a payout straight from the list row.** It writes a transfer and several expenses against
  an account the merchant must choose; a row action with no confirmation is how the wrong destination
  gets picked.
- **Hiding clearing accounts from the accounts page.** D4 — it hides the balance, which is the
  question being answered.
- **Computing the reconciliation client-side to preview it.** D9. The clearing balances are the
  basis and the client does not have them.

---

## 10. What the implementation changed

Three things the plan had slightly wrong, and one it got right for the wrong reason.

1. **The payouts route inherits an any-of gate too.** §D1 predicted
   `featuresForPath("/ecommerce/payouts") === { all: ["storefront"], anyOf: [] }`. It is actually
   `all: ["storefront"]` **plus** `anyOf: [["sales", "storefront"]]`, inherited from the Sell group
   the row sits in. Harmless — `storefront` satisfies the any-of on its own, so a shop-less online
   merchant still gets in — but the test now asserts the real shape *and* that
   `unmetRouteFeatures` returns nothing for a storefront-only workspace, which is the fact that
   actually matters.
2. **The invalidation-coverage gate only sees `invalidate(qc, …)`.** Its "a module's mutations
   refresh the lists that module reads" pass matches that exact spelling, so the module's hooks were
   written with `queryClient` and skipped the check silently while still passing the looser "every
   mutation invalidates something" gate. Renamed to `qc` — house convention anyway — and the module
   is now enumerated by both passes.
3. **The with-courier tile had to become a fifth tile, not a replacement.** The accounts banner is a
   four-column grid with a hardcoded four-card skeleton; a fifth tile would sit alone on a second
   row. It renders only when `withCourier !== 0` and the grid switches to five columns when it does,
   so a merchant who never ships COD sees the screen unchanged.
4. **`AccountType` widening alone changed nothing, as predicted — but not for the predicted
   reason.** The plan said the config map's `Record<string, …>` typing would swallow it. True, and
   also: `getAccountFormConfig`'s option list is a plain array of string literals, so nothing there
   would have complained either. The fix that matters is the one that turns the *next* account type
   into a compile error: `Record<AccountType, …>` with no fallback.

Everything else shipped as written, including the two gate tests (§6 case 18) that exist to stop
`/ecommerce/payouts` being "tidied" into the Money group later.
