---
title: Set up discounts and tax
slug: discounts-and-tax
summary: Define the discount and tax rates you reuse, and decide where tax applies.
order: 45
covers_routes:
  - /discounts
  - /taxes
  - /settings/tax
features:
  - tax
ui_labels:
  - settings:discounts.title
  - settings:discounts.subtitle
  - settings:taxRates.title
  - settings:taxRates.subtitle
  - settings:taxSettings.title
  - settings:taxSettings.whereTitle
  - settings:taxSettings.salesHint
  - settings:taxSettings.purchaseHint
  - settings:taxSettings.whereDescription
  - settings:taxSettings.financialYearTitle
---

# Set up discounts and tax

Both of these are lists you define once and reuse. Setting them up before you start selling saves
correcting invoices later.

## Discounts

**Discounts** holds the *Discount rates you can apply to sales and purchases.* Define the ones you
actually offer — a staff discount, a wholesale rate, a seasonal promotion — and they become
selectable at the counter instead of being typed in by hand each time.

Saved rates beat typed-in numbers for one practical reason: a discount typed at the counter is
whatever the person felt like giving, and it shows up nowhere as a policy. A named rate is
consistent, and your reports can tell you what it cost you.

You can still apply a one-off discount on a line or a whole order at the point of sale — see
[Make a sale](./make-a-sale.md).

## Tax rates

**Tax Rates** holds *The tax rates applied to your sales and purchases.* Add each rate you are
required to charge, with its percentage.

Tax is applied per line, so a single invoice can mix rates — some items taxed, others not. Products
carry their own rate, which is why getting this list right before you add products saves rework.

## Where tax applies

**Tax Settings** controls the switches, under **Where tax applies**:

- **Sales tax** — *Apply tax on sales and sales returns.*
- **Purchase tax** — *Apply tax on purchases and purchase returns.*

You can have one on and the other off. *Returns automatically follow their parent area*, so you never
configure returns separately — turning on sales tax covers sales returns too.

**Financial year** sets the default date range for your tax reports. Set it to your real financial
year so the Tax Report opens on the right period instead of the calendar year.

## If tax is not showing up

Work down this list — it is almost always one of them:

1. **Tax Management** is off in Feature Settings. Nothing tax-related appears at all. See
   [Set up your shop](./set-up-your-shop.md).
2. The switch for that area is off — sales tax on, purchase tax off, or the reverse.
3. The product has no tax rate set against it.
4. Your plan does not include tax, in which case the settings page will say so.

## Next

For what you owe at the end of the period, see [Read your reports](./read-your-reports.md).
