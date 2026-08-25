---
title: Send stock back to a supplier
slug: purchase-returns
summary: Return damaged or wrong goods to a supplier and recover what you paid.
order: 66
covers_routes:
  - /purchases/returns
features:
  - returns
ui_labels:
  - purchases:returns.title
  - purchases:returns.findOrder
  - purchases:returns.findOrderDesc
  - purchases:returns.itemsDesc
  - purchases:returns.adjustThisOrderDue
  - purchases:returns.adjustOtherDuesSupplier
  - purchases:returns.convertToSupplierCredit
  - purchases:returns.supplierCreditDesc
  - purchases:returns.reasonExcessQuantity
  - purchases:returns.reasonQualityIssue
---

# Send stock back to a supplier

**Purchase Returns** is the mirror of a sales return: goods go back *out* to whoever you bought them
from, and the money you paid comes back to you.

## Record the return

1. **Find Purchase Order** — *Enter an order ID or order number to process a return.* The return
   attaches to the original purchase, which is what lets it credit the right supplier at the right
   cost price.
2. *Choose which items to return to the supplier and specify quantities.*
3. **Give a reason:** Damaged, Defective, Wrong Item, **Excess Quantity**, Expired, **Quality Issue**
   or Other.

Reasons matter more here than anywhere else in EzyCore. A supplier who keeps sending Damaged or
Quality Issue stock is costing you money, and the returns list filtered by reason is the evidence you
need when you renegotiate.

## Getting your money back

Choose how the supplier settles it:

- **Adjust This Order's Due** — you have not finished paying for this order, so the return reduces
  what you still owe. Nothing changes hands.
- **Adjust Other Dues to This Supplier** — apply it against your other unpaid orders with them.
- **Convert to Supplier Credit** — *Park the refund as supplier credit balance instead of cash.*
  Use this when the supplier will not pay out but will knock it off your next delivery, which is how
  most supplier relationships actually work.
- Or take it back as cash into one of your accounts.

If you still owe the supplier money, settling against the due is simplest — it keeps your payables
honest without any cash moving.

## What happens to the stock

The returned quantity comes **out** of your stock at your current location, because the goods are
physically going back. Check the location picker in the top bar first if you hold stock in more than
one place.

If the goods never entered your stock — the delivery was short, or you rejected it at the door — do
not record a return. Instead receive only what actually arrived, and the order keeps the shortfall
outstanding. See [Receive stock from a supplier](./receive-stock.md).

## Tracking returns

The list shows every return with its status — Pending, Processed or Cancelled — plus totals for how
much you have sent back and how much is still awaiting processing.

For goods a customer brought back to you, see [Take back a sold item](./sales-returns.md).
