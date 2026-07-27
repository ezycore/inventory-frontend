---
title: Keep your stock accurate
slug: track-your-stock
summary: Check stock levels, fix miscounts, and see where stock went.
order: 70
covers_routes:
  - /inventory
  - /inventory/lowstock
  - /inventory/adjust
  - /inventory/movements
  - /inventory/transfers
ui_labels:
  - inventory:stock.title
  - inventory:stock.subtitle
  - inventory:adjust.title
  - inventory:adjust.subtitle
  - inventory:lowstock.title
  - inventory:lowstock.subtitle
  - inventory:lowstock.createPurchaseOrder
  - inventory:transfers.title
  - inventory:transfers.subtitle
  - inventory:movements.title
---

# Keep your stock accurate

Normally you never touch these screens — recording sales and purchases keeps stock right on its own.
They are for when reality and the system disagree.

## Current Stock

**Current Stock** shows *Live stock levels for every product.* Counts are per location, so check the
location picker in the top bar if a number looks wrong.

## Low Stock

**Low Stock** lists *Items running low that need restocking* — everything at or below the threshold
you set on the product. **Create Purchase Order** turns that list straight into an order to your
supplier, which is the fastest way to restock.

If this list is empty or full of surprises, your thresholds are wrong rather than your stock.

## Adjust Stock

**Adjust Stock** is how you *Correct stock counts after recounts, damage, or loss.*

Use it when the shelf and the screen disagree — after a stock take, after breakage, after theft, or
after finding something that was never recorded. Enter the count you actually have, and give a
reason. The reason is worth taking seriously: it is what makes your loss figures meaningful months
later.

Do **not** use Adjust Stock to record buying or selling. A purchase records what you paid and who you
paid; an adjustment records neither, so using it for a purchase makes your profit figures wrong.

## Transfer Stock

**Transfer Stock** lets you *Move stock from one location to another.* The sending location goes down, the
receiving location goes up, and your total is unchanged. Only relevant if you have more than one
location.

## Stock History

**Stock History** is the audit trail: every movement, what caused it, when, and who did it. When a
count looks wrong, this is the screen that tells you why — it will show the sale, purchase,
adjustment or transfer that moved it.

## Doing a stock take

1. Count what is physically there, section by section.
2. Compare against Current Stock, filtered to the same category or location.
3. Enter the real counts in Adjust Stock, with a reason.
4. Check Stock History afterwards to confirm the corrections landed.

Do it when the shop is closed, or at least when nothing is selling — a sale recorded mid-count will
put you back where you started. If stock does move while your list is open, submitting is refused
rather than silently overwriting the sale: remove the affected rows, re-check the count, add them
again. The same applies to the location — a list counted at one location cannot be submitted at
another, so switch back or clear it.

## Next

[Read your reports](./read-your-reports.md).
