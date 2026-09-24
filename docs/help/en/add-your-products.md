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

**Products** is the list of *Everything you sell.* Stock counts, sales, purchases and reports all
refer back to it.

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

Give a tag a **Filter group** — "Fabric", "Occasion" — and your online shop lists it under that
heading in its filters instead of under a plain "Tags", so shoppers read it in their own words.

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

## Creating a product does not stock it

A product is set up once for the whole business — every shop and warehouse uses the same one. Stock
is not: it is counted per location. So creating a product and stocking it are two separate steps,
and the form only does the second one if you ask it to.

The **Track stock** switch at the top of the stock section is what asks. Turn it on and the product
is added to the stock of the location you pick there, with the opening quantity and cost price you
give it. Leave it off and the product is still saved and still appears in your product list — it
just holds no stock anywhere.

That matters more than it sounds. A product with no stock record at a location is not "zero stock"
there: **it does not appear in the sell, purchase or adjust-stock screens at all.** Nothing on the
Products list flags this, because that table has no stock column.

Two things follow:

- **Track stock only appears while you are creating a product.** Open an existing product and the
  section is gone. Stock it from **Current Stock → Add Inventory** instead.
- **It stocks one location.** To carry the same product in a second shop or a warehouse, switch
  location in the top bar and add it there too. A variant product takes one entry per variant, per
  location.

[Keep your stock accurate](./track-your-stock.md) covers Add Inventory in full.

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
