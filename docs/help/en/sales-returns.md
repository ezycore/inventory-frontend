---
title: Take back a sold item
slug: sales-returns
summary: Record what a customer brought back and settle the money owed either way.
order: 65
covers_routes:
  - /sales/returns
features:
  - sales
  - returns
ui_labels:
  - sales:returns.title
  - sales:returns.findSale
  - sales:returns.findSaleDescription
  - sales:returns.itemsDescription
  - sales:returns.allocation.adjustCurrentSaleDue
  - sales:returns.allocation.adjustOtherCustomerDues
  - sales:returns.reasons.damaged
  - sales:returns.reasons.expired
  - common:returns.deductionFeeOptional
  - sales:returns.filters.processed
---

# Take back a sold item

**Sales Returns** handles a customer bringing something back. Recording it here puts the stock back
and settles the money — doing it as a stock adjustment instead loses the money side entirely.

## Record the return

1. **Find Sale.** *Enter a sale ID or invoice number to process a return.* You cannot start a return
   without the original sale, which is one good reason to put walk-in sales through the system
   properly rather than taking cash off the books.
2. **Pick the items.** *Choose which items the customer is returning and specify quantities* — a
   customer who bought three and brought back one is a quantity of 1, not a whole-sale return.
3. **Give a reason:** **Damaged**, Defective, Wrong Item, Customer Changed Mind, **Expired** or
   Other. Reasons are worth entering honestly — they are what tell you months later whether you have
   a supplier quality problem or just an indecisive customer.
4. **Deduction / Fee (Optional)** takes something off the refund — a restocking fee, or the cost of
   damage the customer caused. Leave it empty to refund in full.

## Where the money goes

This is the part to get right, and it only appears if you have the **Account Management** feature
turned on. Without it the return is still recorded and stock still moves, but there is nowhere to
settle the cash — so if you refund customers at all, turn Accounts on before you need it. See
[Track your cash and bank](./money-in-and-out.md).

You can split the refund across any of these:

- **Adjust Current Sale Due** — the customer never finished paying for this sale, so the refund
  reduces what they still owe. No cash changes hands.
- **Adjust Other Customer Dues** — they owe money on *other* sales; put the refund against those
  instead.
- **Cash refund** — pay it out of one of your accounts. Choose which account, so your cash figures
  stay right.
- **Store credit** — park it on their account for next time. It appears automatically at the counter
  on their next sale.

For a customer who still owes you money, settling against the due is almost always better than
handing back cash and leaving the debt standing.

## What happens to the stock

Returned items go back into your stock at the location you are working in, ready to sell again.

**That is wrong for anything you cannot resell.** A returned item marked **Damaged** or **Expired**
still lands back on your shelf count, so follow it with a stock adjustment to write it off — see
[Keep your stock accurate](./track-your-stock.md). Skipping that is the most common reason a stock
count drifts upward over time.

## Tracking returns

The returns list shows every return with its status — Pending, **Processed** or Cancelled — and can
be filtered by reason. The summary tiles across the top give you total returns, the value returned
and how much has actually been refunded in cash.

If the same product keeps coming back as Defective, that is a supplier conversation, not a customer
one. See [Send stock back to a supplier](./purchase-returns.md).
