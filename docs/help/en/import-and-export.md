---
title: Import and export your data
slug: import-and-export
summary: Bring products, stock, customers and suppliers in from a file, take your data out, and see what was imported.
order: 36
covers_routes:
  - /import-export
ui_labels:
  - layout:nav.items.import-export
  - importExport:page.tabs.import
  - importExport:page.tabs.export
  - importExport:page.tabs.move
  - importExport:page.tabs.history
  - importExport:import.button
  - importExport:import.template
  - importExport:export.filesTitle
  - importExport:export.button
  - importExport:history.columns.skipped
  - importExport:history.columns.failed
  - reports:export.title
---

# Import and export your data

Everything that comes into EzyCore from a file, or goes out to one, is in one place: **Import & Export**
in the sidebar. It has four tabs. You only see the parts your role is allowed to use.

## Import

**Import** has a card for each kind of data: products, opening stock, customers and suppliers.

1. Press **Download template** on the card. It is a spreadsheet with the right columns and an example
   row.
2. Fill it in, in Excel or Google Sheets, and save it as CSV.
3. Press **Import** and choose the file. If your columns are named differently, you are asked which
   column is which.
4. You see every row before anything is saved: what will be added, what is already here, and which
   rows have a problem and why. Fix those in the file and try again, or import the rest.

What to know about each card:

- **Products** — a product with sizes or colours takes one row for the product and one row per
  variant, with the product's name in each variant's **Parent** column. A WooCommerce product export
  works as it is.
- **Opening stock** — goes to the location you are working in. Switch location in the top bar first.
- **Customers** — the phone number is how a customer is recognised. A phone already here is skipped,
  never added twice.
- **Suppliers** — a supplier with the same name, phone or email as one already here is skipped.

Importing the same file twice is safe: what came in the first time shows as already here.

## Export

**Export** has two parts.

**Files you can import back** — products and stock, in the same format as the import templates. Use
the filters on the card (status, category, brand, stock level) to choose what goes into the file,
then press **Download CSV**. Edit the file in a spreadsheet and import it again. Stock comes from the
location you are working in. Only single products are exported; variant and combo products are not.

**Export Data** — your business records (sales, purchases, orders, products, customers, suppliers) for
the period you pick. This is the file to send to your accountant.

## Move your shop

Bring a whole shop across from WooCommerce in one go, or ask our support team to move a shop from
another system for you. [Move your shop to EzyCore](./move-your-shop.md) explains every way.

## History

**History** lists every import: when, what, which file, who did it, how many rows were added, were
**Already here**, or were **Not imported**. When rows failed, open *Why rows failed* to see each row
number and the reason. Moves from WooCommerce are listed below, each as one entry; **Open** shows its
results.

## Next

[Add suppliers and customers](./add-contacts.md).
