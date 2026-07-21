---
title: Open your online store
slug: storefront-setup
summary: Turn on your storefront, set how it trades, and put it on your own domain.
order: 100
covers_routes:
  - /ecommerce
  - /ecommerce/dashboard
  - /ecommerce/settings
  - /settings/domains
features:
  - storefront
ui_labels:
  - settings:domains.title
  - settings:domains.subtitle
  - settings:domains.addDescription
---

# Open your online store

The storefront gives you *a public online store with shopper accounts, online orders, and courier
delivery*, running on the same products and stock as your counter. One stock count serves both — sell
the last unit in the shop and it stops being available online.

Turn on **Ecommerce Storefront** in Feature Settings to begin. See
[Set up your shop](./set-up-your-shop.md).

## Store Settings

This is where you set how your store trades. Work through it before you tell anyone the address:

- **Store identity** — name, contact details and the branding shoppers see.
- **Delivery** — the areas you deliver to and what you charge for each. Get this wrong and you either
  lose money on every distant order or lose the order at checkout.
- **Payment** — how shoppers pay. Cash on delivery is the standard option; card and mobile payment
  depend on what your plan and gateway support.
- **Order rules** — minimum order value and anything else that governs what shoppers may place.

## Your store dashboard

The ecommerce **Dashboard** covers online trade only — orders, revenue and activity from the
storefront, kept separate from your counter figures. When you want the whole business in one view,
use the main dashboard instead.

## Custom Domains

By default your store lives on a workspace subdomain. **Custom Domains** lets you *Connect your own
domain to this workspace. Add the DNS records we show, then verify ownership.*

Use a subdomain you control — *e.g. shop.yourbrand.com — a subdomain you control.*

The sequence is:

1. Add the domain here.
2. Copy the DNS records shown and add them at your domain registrar.
3. Come back and verify.

**DNS is not instant.** Records commonly take minutes and occasionally hours to propagate, so a
failed check straight after adding them usually means "not yet", not "wrong". Re-check after a
while before changing anything — repeatedly editing records while waiting is the most reliable way
to make this take longer.

Your store stays reachable on its original address throughout, so nothing breaks while you wait.

## Next

[Choose what to sell online](./storefront-catalog.md).
