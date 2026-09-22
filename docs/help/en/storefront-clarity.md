---
title: See how shoppers use your shop
slug: storefront-clarity
summary: Watch where shoppers tap, how far they scroll and where they give up, using a free Microsoft tool connected to your shop.
order: 107
# Clarity is a TAB on Store Settings, not a screen of its own, so it shares that route with
# `storefront-setup`. That page has the lower `order`, and `findHelpForPath` keeps the first
# match on a tie — so the "?" on Store Settings still opens the setup guide, and this page is
# reached by browsing /help.
covers_routes:
  - /ecommerce/settings
features:
  - storefront
---

# See how shoppers use your shop

Your orders tell you what people bought. They do not tell you what the people who *didn't* buy were
trying to do — which photo they tapped three times expecting it to zoom, where they stopped
scrolling, which step of checkout they closed the page on.

Microsoft Clarity answers that, and it is free. You connect your own Clarity account to your shop;
the recordings and heatmaps live there, in your account, and you open them from a link inside
EzyCore.

**Clarity does not count visitors.** It shows you *how* people use the shop, not how many came.

## Connect it

1. Go to [clarity.microsoft.com](https://clarity.microsoft.com/) and sign in — a Microsoft, Google
   or Facebook account works.
2. Create a project for your shop. Put your shop's web address in it.
3. Open **Settings → Overview**. There is a short code there — that is your **Project ID**.
4. In EzyCore, open **Ecommerce → Store Settings → Clarity**. Turn on **Enable Clarity**, paste the
   Project ID, and save.

Your first recordings appear in Clarity within a couple of hours of a real visitor. Your own
preview visits are never recorded, so you cannot test it by looking at your own draft — open the
live shop, or wait for a customer.

Once an ID is saved, the button **Open your Clarity dashboard** takes you straight there.

## What is worth looking at first

- **Heatmaps** — where people tap on your home page and your product pages. A button nobody taps is
  usually a button nobody can see.
- **Rage clicks** — the same spot tapped again and again. Almost always something that looks
  tappable and isn't.
- **Recordings of sessions that reached checkout and stopped.** These are the most expensive
  sessions you have.

## Cookies, and the banner

**Clarity sets cookies on your shop.** That is a switch inside Clarity, not in EzyCore, and a new
project has it turned on. It is what lets Clarity join a shopper's pages into one recording and
recognise them on a later visit.

If you would rather run without cookies, open Clarity → **Settings → Setup → Advanced settings**
and turn **Cookies** off. Recordings and heatmaps keep working; they simply stop being linked
across pages and visits.

Separately, your shop can **ask** shoppers before Clarity links their visits. Their answer is sent
to Clarity either way — by default we tell it they did not agree. Change **Cookie banner** to pick
who gets asked:

- **No banner** — recommended, and the default. Nobody is asked.
- **Europe only** — only shoppers on a European clock see it. Bangladeshi shoppers never do.
- **Everyone** — every shopper sees it.

Wherever it appears, it is a small bar at the bottom of the page, never a pop-up, and it never
shows on the checkout page.

## What your shoppers' privacy looks like

Clarity records a replay of what happens on the screen. Anything a shopper **types** — name, phone
number, address, card details — is hidden automatically and never reaches Microsoft. On top of
that, your shop also hides saved addresses, order history and profile details from the replay.

Two things to know, because they are yours to answer for:

- Recordings are kept for **30 days** and heatmaps for 13 months, then Microsoft deletes them.
- The Clarity project is **yours**. Anyone you give access to it can watch those replays.

## Turning it off

Switch **Enable Clarity** off and save. The tag stops loading on the next page view and nothing new
is recorded. Your Project ID stays saved, so turning it back on is one switch. To remove it
entirely, clear the Project ID field and save.
