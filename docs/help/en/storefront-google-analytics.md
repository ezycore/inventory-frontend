---
title: Measure visitors with Google Analytics
slug: storefront-google-analytics
summary: Connect your own Google Analytics to see how many people visit your shop, where they come from, and which visits turn into sales.
order: 108
# A row on Store Settings → Marketing, not a screen of its own, so it shares that route with
# `storefront-setup` (lower `order`, so the "?" on Store Settings still opens the setup guide).
covers_routes:
  - /ecommerce/settings
features:
  - storefront
---

# Measure visitors with Google Analytics

Your orders tell you who bought. Google Analytics tells you about everyone else: how many people
visited, whether they came from Facebook, Google or a link someone shared, and which of those
visits ended in a sale. If you run Google Ads, it is also how Google learns which ads sell.

It is free, and the data stays in **your own** Google Analytics account.

## Connect it

1. Go to [analytics.google.com](https://analytics.google.com/) and sign in with a Google account.
2. Create a property for your shop, then a **Web** data stream with your shop's web address.
3. Open **Admin → Data streams** and choose your web stream. The **Measurement ID** is at the top
   right. It starts with **G-**.
4. In EzyCore, open **Ecommerce → Store Settings → Marketing** and tap **Google Analytics** to open
   it. Turn on **Enable Google Analytics**, paste the Measurement ID, and save.

An ID starting with **UA-** is an old Universal Analytics id, which no longer collects data. Use
the G- one.

Your visits show in the **Realtime** report within minutes. The other reports can take a day or
two to fill in. Your own preview visits are never counted — check it on the live shop.

## What your shop reports

- **Page views** — every page a shopper opens.
- **Product views** — when a shopper opens a product.
- **Add to cart** — each time something goes into the cart, for the quantity added.
- **Checkout started** — once per checkout.
- **Purchases** — when an order is placed, with the order number, the items, the coupon if one
  was used, and the delivery charge.

## Why GA4 revenue is lower than your order totals

Google Analytics counts **revenue as what the shopper paid for the products**, after any discount.
The **delivery charge is reported separately** as shipping. So for an order of ৳1,000 of products,
a ৳100 coupon and ৳80 delivery:

- your order total in EzyCore is **৳980**
- GA4 revenue is **৳900**, and GA4 shipping is **৳80**

When a discount is spread across several items, each item's price can be off by a paisa or two
from rounding, so GA4 revenue can sit a few paisa under the figure above.

GA4 learns about a sale when it is placed. If you later cancel or edit an order in EzyCore, GA4
still shows the original sale.

## Cookies, and the banner

Google Analytics uses cookies to recognise a returning shopper. Whether shoppers are asked first is
the **Cookie banner** card at the top of the **Marketing** tab — the same banner Microsoft Clarity
uses, so one answer covers both:

- **No banner** — the default. Nobody is asked, and Google Analytics measures every visit.
- **Europe only** — shoppers on a European clock are asked, and measured only if they accept.
- **Everyone** — every shopper is asked, and measured only if they accept.

Choosing the setting that is right for where you sell is up to you; your shop follows it.

## Turning it off

Switch **Enable Google Analytics** off and save. The tag stops loading on the next page view. Your
Measurement ID stays saved, so turning it back on is one switch.
