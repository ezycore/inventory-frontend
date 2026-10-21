---
title: Show how much you sell
slug: storefront-social-proof
summary: Put "124 sold" and "Only 3 left" chips on your products and a small "Rahim from Dhaka bought…" popup on your shop.
order: 109
# Social proof is a tab on Store Settings, so it shares that route with `storefront-setup`, which has
# the lower `order` and keeps the "?" there. The Sold counts screen has no sidebar row, so it
# cannot be listed here (help:verify allows sidebar routes only).
covers_routes:
  - /ecommerce/settings
features:
  - storefront
ui_labels:
  - products:products.soldCounts.title
  - products:products.soldCounts.columns.opening
  - products:products.soldCounts.columns.online
---

# Show how much you sell

Shoppers trust a product other people have bought, and act sooner when it is nearly gone. Three
small things on your shop say so:

- a **sold chip** on the product page — "124 sold";
- a **low stock chip** — "Only 3 left";
- a **purchase popup** in a bottom corner — "Rahim from Dhaka bought Cotton Panjabi · 12 min ago".

All three start **off**. Turn them on in **Ecommerce → Store Settings → Social proof**.

## The sold chip

The number is **what you sold before your online shop, plus what it has sold since**.

1. In **Store Settings → Social proof**, turn on **Sold count on products** and save.
2. Tap **Set opening sold counts**. The **Sold counts** screen lists every product. Type how many
   you sold before — in your shop, on Facebook, anywhere — in **Sold before**. **Sold online**
   fills itself in. You can change your numbers any time.
   To fill many at once, pick a category, type a number in **Set the sold count of all … shown
   products to** and tap **Apply**, then correct the odd ones before you save.
3. Save. The chip appears within a minute.

A product with sizes or colours shows **one** number: every size and colour added together.

**When an online sale counts** is your choice: as soon as the order is placed (the default), when
you confirm it, or when it is delivered. Cancelled and rejected orders never count, and items that
come back are taken off. Counter sales from the point of sale are not counted — the chip is about
your online shop.

**Show the chip from** hides it on products that have not sold many yet: "2 sold" puts people off
more than no chip does. **Rounded** shows "120+" instead of 124.

## The low stock chip

Turn on **Low stock on products**. The chip uses your real stock at the location that ships online
orders, so there is nothing to enter.

- **Show when stock is at or below** — the chip shows from this number down to 1. The default is 5,
  so a product with 40 in stock never says "Only 40 left".
- **Wording** — **Show the number** ("Only 3 left") or **No number** ("Almost gone"). You can write
  your own text in English and Bangla; with the number, keep {count} where it goes.
- **Also on product cards** — the chip shows in grids as well, next to the sold count.

On the product page it takes the place of **In stock**. A sold-out product keeps its **Out of
stock** badge, and a product sold on backorder shows the chip only while it still has stock. For a
product with sizes or colours, the chip follows the size or colour the shopper picks. If your
workspace does not track stock, the chip never shows.

## The purchase popup

Turn on **Recent purchase popup**, then choose where the purchases come from:

- **Real orders (recommended)** — your shop's own recent orders.
- **Real orders, topped up with my entries** — your entries fill in while you have fewer than five
  recent orders.
- **My entries only** — lines you write yourself, each naming one of your products.

Entries are shown to shoppers as real purchases. **You are responsible for what they say.**

You also choose how long it waits before the first popup, how long each one stays, the pause
between them, and the most a shopper sees in one visit. Choose what the message shows: the first
name or "Someone", the district or area, the product and its photo, and how long ago. A popup only
ever shows a **first name** and a place — never a phone number, a full name or an address.

The popup never appears on the cart, checkout or account pages, and a shopper who closes it does
not see it again that visit.

## Colours and size

How the chips and the popup look — style, colour, size, corners — is in **Online Store → Customize →
Social proof**, with a live preview. The low stock chip shares the sold chip's style and size, with
its own colour and icon. Until you change anything, they follow your shop's theme.

On the product page both chips sit in the **Stock badge and tags** row, next to "In stock". If you
hide that row in **Online Store → Pages → Product**, the chips go with it there, and show on product
cards only (when **Also on product cards** is on).
