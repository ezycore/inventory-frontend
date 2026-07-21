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
  - /reports/profit-loss
  - /reports/position
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
  - reports:profitLoss.subtitle
  - reports:profitLoss.expensesNotTracked
  - reports:position.subtitle
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

**Profit & Loss** — *Revenue minus cost of goods and operating expenses.* The one report that
answers "did I actually make money this month". It reads top to bottom like a statement:

- **Revenue**, less any **sales returns**, gives net revenue.
- Less **cost of goods sold** — what the items you sold cost you — gives **gross profit**.
- Less **operating expenses** (rent, salary, utilities and the rest, broken down by category),
  plus any other income, gives **net profit**.

Three things worth understanding before you rely on it:

**Revenue counts the sale, not the payment.** A credit sale that nobody has paid yet is still
revenue on the day you made it. Expenses work the other way — they count when you pay them. That
means this is not an audited financial statement, and the report says so at the bottom.

**Buying stock is not an expense here.** Money spent on stock becomes inventory, not cost. It only
reaches this report as cost of goods sold, on the day the item actually sells. If purchases were
subtracted as well, every restocking month would look like a loss.

**Owner money in and out never appears.** Investing your own money into the business is not income,
and taking money out is not an expense — both are capital, and they are reported separately on the
Accounts page. See [Track your cash and bank](./money-in-and-out.md).

If the Accounts feature is off, the report still shows revenue, cost of goods and gross profit — but
it warns you: *The Accounts module is off, so operating expenses are not being tracked. Net profit
below equals gross profit — it does not mean you had no expenses.* That is a gap in the data, not a
month with no bills.

**Business Position** — *What the business is worth right now — assets minus what you owe.* Unlike
every other report this one has no date range: it is a snapshot of today.

- **Assets** — cash and bank balances, stock value, and money customers owe you.
- **Liabilities** — money you owe suppliers, plus any customer credit you are holding.
- **Net position** — assets minus liabilities.

**Stock is counted at what it cost you, not what you will sell it for.** The margin is not yours
until the item actually sells, so counting stock at retail would inflate this number.

It is a snapshot, not a balance sheet — there is no owner's equity side, and it is not something to
file. If the Accounts feature is off, cash shows as zero and the report warns you; stock,
receivables and payables are still real, because those come from your sales and purchases rather
than from the Accounts module.

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
