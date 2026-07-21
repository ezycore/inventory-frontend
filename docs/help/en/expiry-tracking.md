---
title: Catch stock before it expires
slug: expiry-tracking
summary: See what has expired and what is about to, in time to do something about it.
order: 72
covers_routes:
  - /reports/expiry
features:
  - expiryTracking
ui_labels:
  - reports:expiry.title
  - reports:expiry.subtitle
  - reports:expiry.expiringWithin
  - reports:expiry.expiredBatches
  - reports:expiry.qtyToWriteOff
  - reports:expiry.expiringSoon
  - reports:expiry.qtyAtRisk
  - reports:expiry.colDaysOverdue
  - reports:expiry.colDaysLeft
---

# Catch stock before it expires

If you sell medicine, food or cosmetics, this is the report that saves you money. **Expiry Report**
shows *Batches that have expired or are expiring soon at this location.*

Check it weekly. Expired stock is money already lost; stock expiring in three weeks is money you can
still recover by discounting it.

## Before it works

Two things have to be in place, and both happen before this screen:

1. **Expiry Tracking** must be turned on in Feature Settings — see
   [Set up your shop](./set-up-your-shop.md).
2. **Batch numbers and expiry dates must be entered when you receive stock.** The report can only
   show dates that were typed in at purchase time — see
   [Receive stock from a supplier](./receive-stock.md).

An empty report usually means nobody is entering expiry dates, not that nothing is expiring. If it
looks suspiciously clean, check a recent purchase before you trust it.

## Reading the report

Set **Expiring within** to the warning window you want — 30 days suits fast-moving stock, 90 for
things you order in bulk.

The report then splits in two:

- **Expired Batches** — already past date and still on your shelf. The tile shows the *Quantity to
  write off*: stock you cannot legally or safely sell, still counted as if you can.
- **Expiring Soon** — inside your window. The *Quantity at risk* is what you can still save.

Each row names the product, batch, location and expiry date, plus **Days overdue** for expired stock
or **Days left** for stock still in date.

## What to do about it

**For stock expiring soon:** discount it, move it to a faster-selling location, or return it to the
supplier if your agreement allows — see [Send stock back to a supplier](./purchase-returns.md).

**For stock already expired:** take it off the shelf and write it off with a stock adjustment, giving
expiry as the reason. See [Keep your stock accurate](./track-your-stock.md).

Writing it off matters more than it feels like it does. Until you do, expired stock inflates your
stock value, overstates what you can sell, and quietly hides the real cost of over-ordering.

## One thing to watch

The report covers **this location only**. If you hold stock in more than one place, check each one
using the location picker in the top bar — expired stock in the back warehouse is exactly the stock
nobody looks at.
