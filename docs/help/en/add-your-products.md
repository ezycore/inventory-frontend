---
title: Add your products
slug: add-your-products
summary: Set up categories, brands and units, then add the things you sell.
order: 30
covers_routes:
  - /products
  - /categories
  - /brands
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
- **Variants** — the ways one product differs: Size, Colour. Only needed for products that come in
  options.

You can add any of these while creating a product, but doing them up front is faster.

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
