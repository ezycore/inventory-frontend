---
title: Move your shop to EzyCore
slug: move-your-shop
summary: Bring your products, customers and past orders across from WooCommerce or another system.
order: 35
covers_routes:
  - /products/migrate
ui_labels:
  - layout:nav.items.import-export
  - importExport:page.tabs.move
  - importExport:page.tabs.import
  - products:products.migrate.openButton
  - products:products.migrate.noAccess
  - products:products.migrate.form.storeUrl
  - products:products.migrate.form.keyHelpTitle
  - products:products.migrate.form.autoCreate
  - products:products.migrate.form.mirrorImages
  - products:products.migrate.form.importOrders
  - products:products.migrate.form.submit
  - products:products.migrate.run.previewTitle
  - products:products.migrate.run.notes
  - products:products.migrate.run.start
  - products:products.migrate.run.stop
  - products:products.migrate.run.keyDropped
  - products:products.migrate.run.columns.skipped
  - customers:legacyOrders.title
---

# Move your shop to EzyCore

Already selling somewhere else? You don't have to type your catalogue in again. How you bring it
across depends on where your shop lives today.

## Which way to use

- **Your WooCommerce store is still online** → use **Move from WooCommerce**. It brings products,
  customers and, if you want, past orders in one go. This is the easiest way.
- **You only have a WooCommerce export file** (the old site is closed, or you can't make a key) →
  upload it on the **Import** tab. See **From a WooCommerce export file** below.
- **Anything else** — your own website, a custom app, another POS, a spreadsheet → fill in EzyCore's
  import template, or ask our support team to move it for you. See **From another system** below.

## Move from WooCommerce

You need permission to import products and customers. Without it the page says *You need permission to import both products and customers to move a store in.*

1. Open **Import & Export** in the sidebar and choose **Move your shop**.
2. In **Store address**, type your WooCommerce shop's address, for example `https://yourshop.com`.
3. Make a key in your WordPress admin. **Where to find the key** on the page shows the steps:
   WooCommerce → Settings → Advanced → REST API → Add key, choose **Read**, then Generate API key.
   Paste both values, the consumer key and the consumer secret. Read is enough: nothing on your
   WooCommerce store is changed.
4. Choose what to bring:
   - **Create missing categories, brands and tags** — leave it ticked. Without it, a product whose
     category doesn't exist here yet is not imported.
   - **Copy product images into EzyCore** — leave it ticked if you plan to close the old site. The
     images are copied here, so they keep working after the old site is gone. They use your storage.
   - **Keep my past orders as history** — see **Past orders** below.
5. Press **Check my store**. The key is checked straight away, so a mistyped key or address fails
   here, not halfway through.
6. EzyCore reads your store. You can leave the page; it keeps going. When it is done you see
   **Here's what will be imported**: how many products, customers and orders it found, and
   **Notes** about anything it could not bring. **Nothing has been saved yet.**
7. Read the notes, then press **Start import**. You can leave the page again. **Stop** halts it.

When it finishes, the page says *Your WooCommerce key has been deleted from EzyCore.* You can also
delete the key in WooCommerce: it is not needed again.

**Stock goes to the location you are working in.** Switch to the right shop or warehouse in the top
bar before you start.

## What comes across

- **Products** — with their sizes and colours as variants, prices, images, categories, brands, tags
  and stock. A sale running today comes across as the price, with the regular price beside it. The stock count is what your WooCommerce store shows today, after its own
  orders took stock out.
- **Customers** — the ones with an account on your store, and also the buyers who checked out as
  guests. They are matched by phone number, so two orders from the same phone become one customer.
  Your own admin and staff accounts are left out.
- **Old links** — if your shop moves its own domain to EzyCore, old WooCommerce links to a product or
  a category still work. They open the same product or category here.

### Past orders

With **Keep my past orders as history** ticked, your WooCommerce orders come across as history. Each
customer shows theirs under **Earlier orders from WooCommerce**.

They are history only. They are not sales here: they don't take stock, don't add money to your
accounts and don't appear in your reports. Your sales figures start from the day you start selling
on EzyCore.

## What does not come across

- **Shop logins.** A customer is brought across as a customer record, not as a login to your online
  shop. A returning shopper creates an account again.
- **Coupons, reviews, blog posts and pages.** Set them up again here.
- **"Any size" options.** WooCommerce lets an option match every size. A variant here needs its own
  size, so these are left out and listed in the notes.
- **Changes made after the move.** Running it again brings products and customers added since. A
  product already here is not updated. It shows under **Already here**.

## When it goes wrong

- **Check my store fails.** Check the address opens your shop in a browser. Make sure you pasted
  both values of the key. In WordPress, **Settings → Permalinks** must be set to anything except
  "Plain". A security plugin or firewall on your hosting can also block the request: ask your host to
  allow the WooCommerce REST API.
- **A product is missing.** Read the notes; each one names the product and the reason. The usual
  reason is a missing category with **Create missing categories, brands and tags** unticked.
- **The stock is lower than you expected.** It is the count your WooCommerce store shows now, not what
  you first put in.
- **The stock is in the wrong shop.** It went to the location you were working in. Move it with a
  stock transfer.

## From a WooCommerce export file

In WooCommerce, open **Products → Export** and download the file. In EzyCore, open **Import & Export**;
on the **Import** tab, press **Import** on the Products card and upload that file as it is. No editing
is needed.

Tick **Create missing categories, brands and tags** so products whose category doesn't exist here yet
still come in; the preview lists what will be created before anything is saved. **Copy product images into EzyCore** is ticked for a WooCommerce file: the images are copied in the background after the
import. Importing the same file again skips what is already here.

The export file holds products only. Customers and orders need **Move from WooCommerce**.

## From another system

On the **Import** tab of **Import & Export**, download the Products template and fill in one row per
product. A product with sizes or colours takes one row for the product and one row per variant, with
the product's name in each variant's **Parent** column. Customers and suppliers have their own cards
and templates there — see [Import and export your data](./import-and-export.md).

**We can move it for you.** If your shop runs on its own website, a custom app, another POS, or a
spreadsheet you'd rather not reformat, our support team moves it. You send us a copy of your data — an
export or a backup file. We never need the password to your old website or its database. We turn the
copy into EzyCore's import files, and you see the same preview before anything is saved in your shop.
When it is done, we delete the copy.

## Next

[Add suppliers and customers](./add-contacts.md).
