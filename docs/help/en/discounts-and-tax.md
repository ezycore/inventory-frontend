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
  - settings:vatSettings.title
  - settings:vatSettings.registrationTitle
  - settings:vatSettings.typeLabel
  - settings:vatSettings.effectiveFromLabel
  - settings:vatSettings.binLabel
  - settings:vatSettings.rebateNo
  - settings:vatSettings.periodFixed
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

**VAT Rates** holds *The VAT rates applied to your sales and purchases.* Add each rate you are
required to charge, with its percentage.

Tax is applied per line, so a single invoice can mix rates — some items taxed, others not. Products
carry their own rate, which is why getting this list right before you add products saves rework.

## Your VAT registration

**VAT** (Settings) is where you record *how* your business is registered — this is a legal status
with a start date, not an on/off switch.

Pick your **Registration type**:

- **Standard rate (15%)** — you charge VAT on invoices and can reclaim VAT paid on purchases.
- **Reduced / truncated rate** — you charge VAT, but *You cannot reclaim input VAT. VAT paid on
  purchases becomes part of your product cost.*
- **Turnover tax (4%)** — your invoices carry **no VAT line** at all; you pay 4% of turnover.
- **Exempt** / **Not registered** — no VAT on invoices.

This choice changes what the VAT Report tells you to pay, so it matters more than any other setting
on the page.

**BIN (Business Identification Number)** is printed on every tax invoice. A registered buyer needs
it to claim their own rebate, so fill it in before you start invoicing businesses.

### Changing it later

When you change the type, you are asked for an **Effective from** date — the date on your NBR
registration or de-registration. Two rules follow from that:

- Documents dated **before** that date keep the treatment they were issued under. Changing your
  registration never rewrites invoices you have already given customers.
- A month whose return has already been filed **cannot** be changed.

Mid-month dates are fine — NBR dates usually are.

## Filing

*The VAT period is always one calendar month.* You only choose which day of the following month your
return is due (15 by default).

## If VAT is not showing up

Work down this list — it is almost always one of them:

1. **VAT** is off in Feature Settings. Nothing VAT-related appears at all. See
   [Set up your shop](./set-up-your-shop.md).
2. Your registration type is Turnover tax, Exempt or Not registered — those issue invoices with no
   VAT line, by design.
3. The product has no VAT rate set against it.
4. Your plan does not include VAT, in which case the settings page will say so.

## Next

For what you owe at the end of the period, see [Read your reports](./read-your-reports.md).
