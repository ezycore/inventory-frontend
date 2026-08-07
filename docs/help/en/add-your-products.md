---
title: Add your products
slug: add-your-products
summary: Set up categories, brands and units, then add the things you sell.
order: 30
covers_routes:
  - /products
  - /categories
  - /brands
  - /tags
  - /units
  - /variants
ui_labels:
  - products:products.page.title
  - products:products.page.subtitle
  - products:products.filters.statusActive
  - products:products.page.exportNote
---

# Add your products

**Products** is the list of *All the products you stock and sell.* Everything else in EzyCore —
stock counts, sales, purchases, reports — refers back to it.

## Set up the basics first

Four small lists make products quicker to add and reports far more useful. Fill them in before you
start:

- **Units** — how you measure and sell each item: piece, box, kg, litre. Required.
- **Categories** — how you group products: Medicine, Cosmetics, Stationery. Used everywhere for
  filtering and reporting.
- **Brands** — the manufacturer or label. Optional, but useful if you stock several brands of the
  same thing.
- **Tags** — free labels you can put on any product: New Arrival, Clearance, Eid Special. Optional.
- **Variants** — the ways one product differs: Size, Colour. Only needed for products that come in
  options.

You can add any of these while creating a product, but doing them up front is faster.

## Sub-categories

A category can have one level of sub-categories under it — Phones → Accessories, Medicines →
Syrups. Pick a **Parent category** when you create one.

Two things worth knowing:

- **A product's category stays the top-level one.** Choosing a sub-category adds detail; it does not
  move the product out of its category. So a report or filter for "Phones" still includes everything
  filed under "Phones → Accessories".
- **Two parents can each have a sub-category with the same name.** "Accessories" under Phones and
  "Accessories" under Laptops are two different things, and that is allowed.

A category that has sub-categories cannot be deleted until you remove or move them first. Turning a
category off also turns its sub-categories off; turning it back on does **not** switch them back on,
so a sub-category you retired stays retired.

## Tags

Tags are labels, not a second category. A product can carry several, and you filter by them — any
match counts, so filtering by "Clearance" and "Eid Special" shows products with either.

The reason to use them: a **campaign** can be pointed at a tag. "20% off everything tagged Eid
Special" is one campaign instead of picking eighty products by hand.

Tags do not appear as a column in your sales or stock-value reports. A product can carry two tags,
so its value would be counted twice and the totals would not add up. Use them to *filter* a report
instead.

You cannot delete a tag that is still on a product — take it off those products first.

## Add a product

Give a product a name, a unit, a selling price and a cost price. Everything else is optional.

- **Cost price** is what you pay. It drives your profit figures and stock valuation, so keep it
  honest even if it is an estimate.
- **Selling price** is what the customer pays. You can override it at the point of sale.
- **Barcode** lets you scan the item instead of searching for it.
- **Low stock threshold** is the level at which the item appears in your Low Stock alerts.

New products are **Active** by default, meaning they can be sold. Set a product to inactive when you
stop selling it — this is better than deleting, because deleting loses its sales history.

## Products with options

If a product comes in several sizes or colours, add it as a variant product. Each variant carries its
own barcode, price and stock count, but they share one product page.

Use a variant product when the options are genuinely the same item — a shirt in S/M/L. Use separate
products when they are different things that happen to be related.

## Combo products

A combo sells several products bundled together as one priced unit — a gift set, a meal deal.
Selling a combo takes stock from each of the products inside it. Combos need the Combo Products
feature turned on.

## Importing many products at once

You can import products from a CSV file instead of typing them one by one, which is the sensible way
to load an existing catalogue.

One limitation to know: *Only single products are exported — variant & combo products aren't
supported in CSV export; manage them in the product form.* Variant and combo products have to be
created in the app.

## Next

[Add suppliers and customers](./add-contacts.md).
