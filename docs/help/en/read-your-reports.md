---
title: Read your reports
slug: read-your-reports
summary: Find out what sold, what it earned you, what you owe, and what your stock is worth.
order: 90
covers_routes:
  - /reports
  - /reports/inventory
  - /reports/sales
  - /reports/valuation
  - /reports/purchases
  - /reports/cash
  - /reports/tax
  - /reports/employees
  - /reports/export
features:
  - sales
  - accounts
  - tax
ui_labels:
  - reports:landing.subtitle
  - reports:purchases.subtitle
  - reports:cash.subtitle
  - reports:tax.subtitle
  - reports:tax.outputByRateTitle
  - reports:tax.inputByRateTitle
  - reports:employees.title
  - reports:employees.subtitle
  - reports:export.title
  - reports:export.subtitle
---

# Read your reports

Reports let you *Analyze sales, purchases, inventory, and finances — or export your data.* Each takes
a date range, and each respects the location picker in the top bar.

Which reports you see depends on the features your plan includes and your role — a cashier will not
see the same list as an owner.

## The four to know first

**Sales Report** — what sold, when, and at what margin. Your best sellers and your quiet days. This
is the one most owners open daily.

**Inventory Report** — what you hold right now, by product, category and location.

**Stock Value** — what your stock is worth at cost. The number your accountant wants at period end,
and the one to check before deciding you can afford more stock.

**Purchase Report** — a *Detailed analysis of purchase orders*, including order status. Useful for
supplier negotiations, and for spotting a cost price that has crept up.

## Money and tax

**Cash Report** — a *Cash flow and account balances overview*, with income, expense and transaction
count per account. Needs the Accounts feature — see
[Track your cash and bank](./money-in-and-out.md).

**VAT Report** — *Output VAT, input VAT, and net VAT payable for the period.* This is your filing
report. It breaks down into:

- **Output VAT by Rate (Sales)** — what you collected from customers.
- **Input VAT by Rate (Purchases)** — what you paid to suppliers.
- A VAT Ledger listing every taxable document, and a trend chart.

**Net VAT payable is not always output minus input.** Only a standard-rated registrant can reclaim
the VAT it paid on purchases. On any other registration the input VAT is shown for information and
is *not* deducted — it is part of your cost instead, and the report says so. Your registration type
lives in Settings → VAT; see [Set up discounts and tax](./discounts-and-tax.md).

## Stock and staff

**Expiry Report** — batches expired or expiring soon, so you can discount or return them before they
become dead stock. See [Catch stock before it expires](./expiry-tracking.md).

**Staff Report** — *Activity and performance of your staff.* Sales count, sales amount and profit per
person, plus purchases recorded. Read it with some care: sales amount reflects who was at the counter,
not who is best at selling, and a slow shift is not the same as a slow employee.

## Export

**Export Data** lets you *Download your data as CSV files* — sales, purchases, inventory, products,
customers and suppliers, for the period you select. This is how you get data to your accountant, or
into a spreadsheet for something the reports do not cover.

## If the numbers look wrong

Almost always one of these:

- **Wrong location.** Reports respect the location picker in the top bar.
- **Wrong date range.** Check it before anything else.
- **Cost prices missing or wrong.** Profit and stock value are calculated from cost price. A product
  with no cost price appears to be pure profit.
- **Stock adjusted instead of purchased.** An adjustment adds stock without recording what it cost,
  so profit looks better than it is. See [Keep your stock accurate](./track-your-stock.md).
- **Expired stock never written off.** It still counts toward stock value as though you could sell it.
