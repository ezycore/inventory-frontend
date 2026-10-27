---
title: Show your products on Facebook, Instagram and Google
slug: storefront-product-feed
summary: Turn on your product feed and paste one link into Facebook Commerce Manager or Google Merchant Center, so your catalog there stays up to date on its own.
order: 108
# A row on Store Settings → Marketing, not a screen of its own, so it shares that route with
# `storefront-setup` (lower `order`, so the "?" on Store Settings still opens the setup guide).
covers_routes:
  - /ecommerce/settings
features:
  - storefront
---

# Show your products on Facebook, Instagram and Google

Your **product feed** is one link that lists every product in your online store — photo, name,
description, price, sale price, stock and the link to its page. Facebook and Instagram catalogs,
Google Shopping, TikTok and Pinterest all read the same link, and they re-read it every day. So
when you add a product, change a price or sell out, it updates there on its own — nothing to
upload again.

A catalog is what **catalog ads** use: Facebook shows each person the products they looked at on
your shop. Shoppers still buy on your own website.

## Turn it on

1. Open **Ecommerce → Store Settings → Marketing** and tap **Product feed**.
2. Turn on **Enable product feed** and save.
3. The **Feed link** appears. Tap the copy button.

The link looks like `https://yourshop.com/feeds/products.xml`. If your shop has its own domain,
the link uses it.

## Connect it to Facebook and Instagram

1. Open [Commerce Manager](https://business.facebook.com/commerce/) and choose your catalog (or
   create one for **E-commerce**).
2. Go to **Catalog → Data sources → Add items → Data feed**.
3. Choose **Scheduled feed**, paste the feed link, and set it to repeat **daily**.

Facebook reads the link right away. The first check can take a few minutes.

## Connect it to Google

1. Open [Merchant Center](https://merchants.google.com/) and go to **Products → Add product
   source**.
2. Choose **Add products from a file**, enter the feed link, and set it to fetch **daily**.

## What is in the feed

- Every product shown in your online store. A product hidden from the store is left out.
- A product with options (size, colour) is listed once per option, grouped as one product.
- A running campaign or a compare-at price shows as the **sale price**, the same as your shop.
- **Sold out** products stay in, marked out of stock. Facebook and Google stop advertising them,
  and bring them back when stock returns. A product set to **hide when out of stock** leaves the
  feed while it is sold out.
- A product needs **a photo and a price** to be listed. Facebook and Google reject items without
  them.

Turning the feed off makes the link stop working. Your catalog on Facebook or Google then stops
updating.
