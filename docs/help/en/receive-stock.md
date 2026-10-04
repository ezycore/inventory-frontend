---
title: Receive stock from a supplier
slug: receive-stock
summary: Record what you bought so it lands in your stock count, now or when it arrives.
order: 50
covers_routes:
  - /purchases
  - /purchases/orders
  - /purchases/history
features:
  - purchases
ui_labels:
  - purchases:create.title
  - purchases:create.subtitle
  - purchases:form.instantOption
  - purchases:form.orderOption
  - purchases:create.importLowStock
  - purchases:orders.receiveItems
  - purchases:orders.subtitle
  - purchases:summary.saveAsDraft
  - purchases:form.price
---

# Receive stock from a supplier

**New Purchase** is where you *Record stock you buy from suppliers.* This is how stock gets into
EzyCore — recording a purchase is what makes your stock count go up.

## The one choice that matters

Every purchase is one of two kinds, and picking the right one keeps your stock accurate:

- **Instant Purchase (Receive Now)** — the goods are in your hands. Stock goes up immediately.
- **Create Order (Receive Later)** — you have placed an order that has not arrived. Stock does
  **not** change yet.

Use Instant Purchase for a cash purchase from the market. Use Create Order for anything being
delivered, then receive it when it turns up. Getting this wrong is the most common cause of stock
counts that do not match the shelf.

## Recording a purchase

1. Choose the supplier. You need at least one supplier saved first.
2. Add products — search by name, or scan a barcode to add a line.
3. Set the quantity and the cost price for each line. The cost price you enter here updates the
   product's cost, so it feeds straight into your profit and stock valuation figures.
   **Sale Price** starts at the product's current selling price (MRP). If the price on the new stock
   is different, type the new one: saving the purchase updates the product's sale price, and its
   online price too if it has its own. When you buy in packs, enter the pack's price and it is
   divided per piece. **Discount (per unit)** is what the supplier takes off the sale price, so
   Sale Price − Discount = Cost Price; change any one and the other two follow.
4. If you track expiry, enter the batch number and expiry date for each line.
5. Enter what you paid. Paying less than the total leaves a balance owing to that supplier.
6. Complete the purchase.

**Import Low Stock** fills the order with everything currently below its threshold — the fastest way
to build a restock order.

Not ready to finish? **Save as Draft** keeps everything and changes no stock.

## Receiving an order that arrives

Purchase Orders lists *Orders placed with suppliers, awaiting delivery.* When a delivery arrives,
open the order and choose **Receive Items**.

Confirm the quantity that actually arrived, line by line. If the supplier sent 8 of something you
ordered 10 of, enter 8 — the order stays partly received and remembers the outstanding 2. Only what
you confirm is added to stock.

You can record a payment at the same time.

## Your opening stock

To load stock you already own on day one, record it as an Instant Purchase against the supplier you
bought it from. If you cannot remember, create a supplier called "Opening Stock" and use that — the
important thing is that the quantities and cost prices are right.

## Purchase history

Purchase History is every completed purchase, with what was bought, what it cost, and what remains
unpaid.

If a delivery turns out to be damaged or wrong after you have received it, see
[Send stock back to a supplier](./purchase-returns.md).

## Next

[Make a sale](./make-a-sale.md).
