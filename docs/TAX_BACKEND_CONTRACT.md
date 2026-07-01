# Tax — Backend Contract & Handoff

Status: **frontend complete (Phases 1–7)**, backend **pending**.

The frontend now sends tax inputs and displays tax everywhere (sell, sale detail/receipt, purchases, sales returns, purchase returns). The backend is the source of truth for persisted totals. This document defines what the frontend sends, what it expects back, and the exact tax math the backend must match so previewed numbers don't jump on save.

The reference implementation of the math lives in `utils/tax.ts` (unit-tested in `utils/tax.test.ts`). Backend must reproduce it bit-for-bit.

---

## 1. Tax model & terminology

Two independent concepts — do not conflate:

| Field | Values | Meaning |
|---|---|---|
| `taxType` | `"inclusive"` \| `"exclusive"` | **Price semantics.** Inclusive = the price already contains tax. Exclusive = tax is added on top. |
| `Tax.type` | `"percentage"` \| `"fixed"` | How the `Tax` entity's rate is calculated. (Only `percentage` is wired through tax math today; `taxRate` is a percent.) |

- `taxRate` is always a **percent** (e.g. `15` = 15%).
- A product references a `Tax` via `taxId`; the effective rate is `product.taxRate ?? product.tax.rate`.

### Decisions already locked (do not re-litigate)

1. **Backend owns the persisted math.** Frontend computes a preview only.
2. **Discount before tax.** Line discount first, then the order-level "additional discount" is spread across lines proportionally to each line's net, then tax is computed on the reduced net.
3. **Per-line rates for sales** (products differ). **Order-level lump for purchases** (one manual `taxTotal` per supplier).
4. **Round each line's tax to 2 decimals, then sum.**

---

## 2. Tax math (must match `utils/tax.ts`)

For one line — `net = (price − lineDiscount) × qty` (after the proportional share of the order discount has been subtracted from `net`):

```
EXCLUSIVE:  tax       = round2(net × rate/100)
            lineTotal = net + tax            // tax added on top

INCLUSIVE:  base      = net / (1 + rate/100)
            tax       = round2(net − base)   // tax extracted from the price
            lineTotal = net                  // unchanged; tax already inside
```

Order rollup:

```
itemsSubtotal = Σ net (as entered, before the order discount)
addedTax      = Σ tax over EXCLUSIVE lines      // the part that increases the total
includedTax   = Σ tax over INCLUSIVE lines      // informational; already in the subtotal
taxTotal      = addedTax + includedTax
grandTotal    = itemsSubtotal − additionalDiscount + addedTax
```

`round2(n) = Math.round(n * 100) / 100`.

### Order-discount spreading

```
totalNet      = Σ lineNet
share_i       = totalNet > 0 ? lineNet_i / totalNet : 0
discountedNet = max(0, round2(lineNet_i − additionalDiscount × share_i))
```

Tax is then computed on `discountedNet`. `additionalDiscount` is clamped to `[0, totalNet]`.

### Worked examples

| Case | Lines | addl disc | taxTotal | grandTotal |
|---|---|---|---|---|
| Exclusive | 1×(price 100, qty 2, 15%) | 0 | 30 | 230 |
| Inclusive | 1×(price 115, qty 1, 15%) | 0 | 15 | 115 |
| Exclusive + order disc | 1×(100, 1, 15%) | 10 | 13.50 | 103.50 |
| Mixed | excl(100,1,15%) + incl(115,1,15%) | 0 | 30 (15+15) | 230 |
| Spread | excl(100,1,10%) + excl(300,1,10%) | 40 | 36 | 396 |

---

## 3. Products

The product form already submits `taxType` and `taxId`. Backend must persist and echo them.

**`POST /products`, `PATCH /products/:id`** — accept:

| Field | Type | Notes |
|---|---|---|
| `taxType` | `"inclusive" \| "exclusive"` | Default `"inclusive"` if omitted (matches the product model + product form default). |
| `taxId` | `string` (Tax `_id`) | Optional. |

**Product responses** must include `taxType`, `taxId`, and ideally the populated `tax` (so the UI can read `tax.rate`) and/or a flat `taxRate`.

**`GET /inventory/sellable-products`** — each item **must** include `taxRate` (number, percent) and `taxType`. Without these, the sell-page preview defaults every line to `0` / `"inclusive"` and the tax line never appears.

---

## 4. Sales — create & finalize

### `POST /sales`  (body = `CreateSalesOrderData`)

`items[]` per line:

| Field | Type | Notes |
|---|---|---|
| `productId`, `inventoryId`, `variantId`, `productName` | — | unchanged |
| `quantity`, `price`, `costPrice`, `discount` | number | `discount` is per-unit |
| **`taxRate`** | number (percent) | NEW — backend computes line tax from this |
| **`taxType`** | `"inclusive" \| "exclusive"` | NEW |
| `batchId` | string? | optional |

Order body: `additionalDiscount`, `totalPrice`, `costPrice`, `notes`, `payment?`, `dueAmount?`, `creditBalanceAmount?`, `status?`.

> ⚠️ **Double-count risk.** The frontend now sends `totalPrice` = **grand total (tax-inclusive)**, computed by the preview, AND the per-line `taxRate`/`taxType`. The backend must **recompute** `taxTotal`/`grandTotal` from the line inputs and treat them as authoritative — it must **not** add tax a second time on top of the `totalPrice` it receives. If the backend prefers to trust the client total, it must NOT also add tax.

### `POST /sales/:id/finalize`  (body = `FinalizeSaleDto`)

`items[]` carry the same NEW `taxRate` / `taxType` fields. Same compute-and-return expectation.

### Sale responses (the `Sale` model)

Backend must populate:

| Field | Type | Meaning |
|---|---|---|
| **`taxTotal`** | number | Σ line tax for the sale |
| `totalAmount` | number | Grand total, tax-inclusive (= `subtotal − additionalDiscount + addedTax`) |
| `items[].taxRate` | number | echoed |
| `items[].taxType` | string | echoed |
| `items[].taxAmount` | number | computed line tax |

The sale detail / receipt view groups `items[]` by `taxRate`+`taxType` to show the breakdown, and reads `taxTotal`/`totalAmount` for the summary.

---

## 5. Sales returns

Refunds are now **tax-inclusive** — the customer paid net + tax, so the refund returns net + tax.

**`POST` sales-return** — `items[]` now include:

| Field | Type | Notes |
|---|---|---|
| `productId`, `variantId`, `inventoryId`, `productName` | — | unchanged |
| `quantity` | number | returned qty |
| `price`, `costPrice`, `discount` | number | unchanged |
| **`taxRate`** | number | NEW — for backend verification |
| **`taxType`** | string | NEW |
| `refundAmount` | number | **already tax-inclusive** — `qty × computeLineTax(price−discount, rate, type).lineTotal` |

Backend must honor the tax-inclusive `refundAmount` (or recompute identically). The refund allocation (account refund / store credit / due adjustment) is all driven off this amount.

---

## 6. Purchases — create, finalize, draft

Purchases use a **single order-level `taxTotal`** (a number per supplier), entered manually in the UI — not per-line tax. The DTOs already declared `taxTotal`; the frontend previously hardcoded `0` and now sends the real value.

**`POST /purchases/orders`, `POST .../finalize`, `PATCH .../draft`** — `taxTotal` (number) is now populated from the supplier's manual Tax field. The order total the backend stores should be `subtotal − additionalDiscount + taxTotal` (tax added on top of the net; it is separate from the discount).

No per-line tax fields are sent for purchases. No backend schema change needed — just stop ignoring a previously-zero field.

---

## 7. Purchase returns

Because purchase tax is an order-level lump, refunds allocate it **proportionally**:

```
taxFactor = order.taxTotal / order.subtotal
refundAmount = round2(qty × costPrice × (1 + taxFactor))
```

**`POST` purchase-return** — `refundAmount` per item is now tax-inclusive (cost share + proportional tax share). Backend must honor it (or recompute with the same `taxFactor`). No new per-line fields.

---

## 8. Verification checklist

- [ ] `GET /inventory/sellable-products` returns `taxRate` + `taxType` per item.
- [ ] `POST /products` / `PATCH /products/:id` persist `taxType` + `taxId`; product GET echoes them (+ populated `tax`).
- [ ] `POST /sales` & `/finalize` accept line `taxRate`/`taxType`; compute `taxTotal`; **do not** double-add tax onto the received `totalPrice`.
- [ ] `Sale` responses include `taxTotal`, tax-inclusive `totalAmount`, and `items[].taxRate/taxType/taxAmount`.
- [ ] Backend tax math matches the worked examples in §2 (run them as fixtures).
- [ ] Sales-return endpoint honors the tax-inclusive `refundAmount`.
- [ ] Purchase create/finalize/draft store the non-zero `taxTotal` (total = subtotal − discount + taxTotal).
- [ ] Purchase-return endpoint honors the proportional tax-inclusive `refundAmount`.

---

## 9. Frontend touch-points (for reference)

| Concern | File |
|---|---|
| Tax math (authoritative reference) | `utils/tax.ts`, `utils/tax.test.ts` |
| Types | `types/index.ts` (`TaxType`, `Product`, `Sale`, `SaleItem`, `SaleItemPayload`), `components/sales/types.ts` (`OrderItem`, `ExtractedProduct`, `ProductApiItem`) |
| Sell flow | `components/sales/sell/use-sell-page.ts`, `order-summary-sidebar.tsx` |
| Product extraction | `components/sales/helpers.ts` |
| Sale display / receipt | `components/sales/history/sale-details-block.tsx` |
| Sales returns | `components/sales/returns/use-returnable-items.ts`, `use-sales-return-page.ts` |
| Purchases | `services/stores/purchase-page-store.ts`, `components/purchases/use-purchase-page.ts`, `items-table.tsx`, `order-summary.tsx` |
| Purchase returns | `components/purchases/returns/helpers.ts`, `use-purchase-returns-page.ts` |
