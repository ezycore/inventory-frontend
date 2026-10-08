---
title: Give and honour a warranty
slug: warranty
summary: Put warranty terms on a product, print them on the invoice, record serial / IMEI numbers, check a sale later and log the claim.
order: 66
covers_routes:
  - /sales/warranty
features:
  - warranty
ui_labels:
  - sales:warranty.page.title
  - sales:warranty.page.tabs.lookup
  - sales:warranty.page.tabs.claims
  - sales:warranty.lookup.placeholder
  - sales:warranty.lookup.logClaim
  - sales:warranty.detail.replace
  - sales:warranty.status.returned_to_customer
  - products:products.form.warrantyMonths
  - products:products.form.warrantyKind
  - products:products.form.trackSerial
  - products:products.form.serialKind
  - sales:serials.edit
  - sales:serials.missingConfirm
  - sales:warranty.claim.pickSerials
---

# Give and honour a warranty

A warranty is a promise made at the counter: "1 year replacement", "6 months service". EzyCore keeps
that promise on the sale, so when the customer comes back you look it up instead of digging for the
paper memo.

**Warranty starts switched off.** Turn on **Warranty** under **Customize workspace** at the bottom of
the sidebar. That also turns on serial / IMEI numbers.

## 1. Put the warranty on the product

Open the product and fill in **Warranty (months)**. Leave it empty for no warranty. Choose the
**Warranty type** — Replacement, Service (repair) or Parts only — and an optional note such as
"Motor only".

Every sale freezes the warranty at the moment it is made. If you change the months later, customers
who already bought keep exactly what they were promised.

When you sell it, the line in the cart shows the warranty, for example *12 months · Replacement*,
so you can tell the customer before the sale.

## 2. It prints on the invoice

Each item sold with a warranty prints a line under its name, for example *12-month replacement
warranty, until 03 Oct 2027*. The warranty starts on the day of sale, on your shop's calendar.

## 3. Check a sale

Go to **Sales → Warranty → Check warranty** and type the *Invoice no., serial / IMEI or phone*. You
see each item that carries a warranty, whether it is still covered and how many days are left. Items
the customer already returned are not claimable.

A serial / IMEI number finds the sale at **any branch** of your shop, and the result says which branch
sold it.

## 4. Log the claim

Press **Log claim** on the item, say how many and what is wrong. A claim on an expired warranty is
still allowed — it is marked out of warranty, so you can charge for the repair.

Open the claim from the **Claims** tab to move it along: in repair, sent to supplier, ready to
collect, rejected — and finally handed back to the customer.

**Replace from stock** hands a new unit out of this location's stock in place of the faulty one. The
faulty unit is not put back into stock. The replacement keeps the original warranty end date.

## 5. Record serial and IMEI numbers

For phones and electronics, an invoice number only proves the customer bought *a* phone from you. The
serial or IMEI number proves it is *this* phone.

1. Open the product and, in its Warranty section, tick
   **Record serial / IMEI number of each unit sold**. Choose the **Number type** —
   *IMEI (mobile phone)* gives a warning when a number does not look like an IMEI.
2. When you sell it, the line in the cart shows how many numbers are entered, for example
   *IMEI 0/2*. Click it, then scan the barcode on the box or type the number — one per unit.
3. If you finish the sale with numbers missing, EzyCore asks once. Press **Sell anyway** to sell now;
   a manager can add them later.
4. A manager opens the sale and presses **Add / edit serials** to add a missing number or fix a typo.
   Every change is kept with who made it and when. Online orders and combo products get their numbers
   this way too — on an online order, the button is on its line items once the order is shipped or
   ready for pickup.

The numbers print on the invoice under the item. When logging a claim, **Which unit?** lists them —
tick the unit the customer brought back. When you replace from stock, you are asked for the new
unit's number; searching that number later finds the original sale and its original warranty end
date.

### What it does not do

EzyCore does not know which numbers are in your stock. It warns if a number was already sold on
another invoice ("Already sold on INV-…"), but it does not stop the sale — a returned phone can be
sold again.
