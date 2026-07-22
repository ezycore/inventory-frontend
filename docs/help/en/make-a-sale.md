---
title: Make a sale
slug: make-a-sale
summary: Ring up a sale, take payment, and find it again afterwards.
order: 60
covers_routes:
  - /sales
  - /sales/history
features:
  - sales
ui_labels:
  - sales:sell.title
  - sales:sell.subtitle
  - sales:sell.scanBarcode
  - sales:sell.summary.finalizeSale
  - sales:sell.summary.saveAsDraft
  - sales:sell.summary.useStoreCredit
  - sales:sell.cart.autoFefo
  - sales:history.title
  - sales:history.walkInCustomer
---

# Make a sale

**New Sale** is your counter screen — *Create a sale and take payment.* Finishing a sale takes the
items out of stock and records the money.

## Ringing up a sale

1. **Choose the customer.** For counter trade leave it as **Walk-in Customer**. Pick a real customer
   when you are selling on credit or want the sale on their history.
2. **Add the items.** Search by name or category, or use **Scan barcode to add to cart…** and scan
   straight in.
3. **Adjust as needed.** Change quantity, give a discount on a line, or override the price.
4. **Take payment.** Choose the payment method and enter what the customer handed over. Any change
   due is calculated for you.
5. Press **Finalize Sale**.

Paying less than the total leaves the rest owing on the customer's ledger — which is exactly how you
sell on credit. It also means a mistyped payment quietly creates a debt, so check the figure before
finalising.

If the customer has credit on their account, **Use store credit** appears and can be applied to the
sale.

## Batches and expiry

If you track expiry, each line picks its batch as **Auto (FEFO)** — first expiring, first out. The
system sells the batch closest to its expiry date, which is almost always what you want. Override it
only when the customer is taking a specific batch.

## Holding a sale

**Save as Draft** parks the sale without taking anything out of stock. Useful when a customer is
still shopping, or when you need the counter for someone else. Drafts are picked up later from your
sales list.

## What you cannot sell

Items with no stock at your current location cannot be added, and you will be told so. Two things
worth checking when this surprises you:

- The **location picker** in the top bar — the stock may be at your other location.
- Whether the delivery was actually received. Stock on an unreceived purchase order is not yet stock.

## Finding a sale afterwards

**Sales History** lists every sale, searchable by date, customer or invoice number. From there you
can reprint an invoice, record a later payment against a credit sale, or start a return — see
[Take back a sold item](./sales-returns.md).

## Next

[Keep your stock accurate](./track-your-stock.md).
