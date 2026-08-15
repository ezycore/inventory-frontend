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
features:
  - multiLocation
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

### When a product says "reserved"

If you run an online store, some rows show a second line like **4 reserved · 21 sellable**.

The big number is always what is **physically on your shelf** — it is what a stock count would find,
and it is what your stock value is based on. The reserved part is stock you have already promised to
online orders you confirmed. It is still yours and still on the shelf, but it is spoken for, so the
sell screen and your online store will not let anyone buy it twice.

That is why the counter can offer fewer units than this page shows. Nothing is missing — the
difference is sitting in your confirmed online orders. Cancelling one of those orders puts its stock
straight back on sale.

The practical lesson: confirm online orders you can actually fulfil, promptly, and cancel the ones
you cannot. A confirmed order you never ship holds stock away from customers standing in front of
you. See [Handle online orders](/help/storefront-orders).

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

### Products with expiry dates

If a product is tracked by expiry date, stock is held in batches, and every adjustment has to say
which batch it affects — otherwise the batch list and the total stock would stop agreeing.

- **Adding stock** asks for the expiry date of what you are adding, and an optional batch number.
- **Removing stock** shows your batches, soonest expiry first, and fills in the oldest ones
  automatically. That is usually what you want, since the oldest stock is normally the spoiled stock.
  If the damaged goods came from a different batch, change the numbers — they just have to add up to
  the amount you are removing.

Anything taken from a batch that is already past its expiry date is recorded as an **expiry
write-off** rather than an ordinary adjustment, so spoilage stays separate from miscounts in your
reports.

## Transfer Stock

**Transfer Stock** lets you *Move stock from one location to another.* The sending location goes down, the
receiving location goes up, and your total is unchanged. It only appears once **Multiple Locations**
is switched on under Customize workspace — with a single location there is nowhere to transfer to.

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
