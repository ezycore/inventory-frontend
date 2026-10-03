---
title: Make a sale
slug: make-a-sale
summary: Ring up a sale, take payment, and find it again afterwards.
order: 60
covers_routes:
  - /sales
  - /sales/history
  - /sales/pos
features:
  - sales
ui_labels:
  - sales:sell.title
  - sales:sell.subtitle
  - sales:sell.scanBarcode
  - sales:sell.summary.confirmOrder
  - sales:sell.summary.finalizeSale
  - sales:sell.summary.saveAsDraft
  - sales:sell.summary.useStoreCredit
  - sales:sell.cart.autoFefo
  - sales:history.title
  - sales:history.walkInCustomer
  - sales:sell.openPos
  - sales:pos.exit
  - sales:pos.checkout
  - sales:pos.browse.tabBrowse
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
5. Press **Confirm Order**. (The button reads **Finalize Sale** instead when you are completing a
   sale you picked up from **Save as Draft**.)

Paying less than the total leaves the rest owing on the customer's ledger — which is exactly how you
sell on credit. It also means a mistyped payment quietly creates a debt, so check the figure before
finalising.

If the customer has credit on their account, **Use store credit** appears and can be applied to the
sale.

## The full-screen counter (POS)

**Open POS** on New Sale (or **POS** in the sidebar) opens the same sale on the whole screen, made
for a till with a barcode scanner:

- One box scans and searches. A scanner adds the item straight away; typing a name lists matches
  with their photos. Press **F2** to jump back to the box from anywhere.
- **F4** jumps to the customer and **F8** confirms the order.
- **Browse products** shows your stock as photo tiles, by category — tap a tile to add one, and a
  product with sizes asks which. **Cart** shows what is in the sale, with the running total on the tab.
  Scanning or picking the same item again adds one more.
- Customer discount, store credit, drafts, payment and receipts work exactly as on **New Sale** — it
  is the same sale, and the cart carries over between the two screens.
- **Save as Draft** keeps you on the counter, ready for the next customer.
- On a phone the cart shows as cards, the camera button scans barcodes, and **Checkout** opens the
  payment.
- **Exit to dashboard** in the top corner leaves the counter.

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
