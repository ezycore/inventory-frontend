---
title: Connect Meta ads
slug: storefront-meta-ads
summary: Report your shop's activity and confirmed sales to Meta so your ad spend can be measured properly.
order: 106
covers_routes:
  - /ecommerce/meta
features:
  - storefront
---

# Connect Meta ads

If you run Facebook or Instagram ads, Meta needs to know which of them actually produced a sale.
Without that, it is guessing — and it optimises your budget towards whoever clicks, not whoever buys.

EzyCore reports in two halves, and both matter:

- **The Pixel** runs in the shopper's browser and reports what they did: viewed your shop, opened a
  product, added to cart, started checkout.
- **The Conversions API** runs on our server and reports the **sale** — once, when the order reaches
  the point you choose below.

The sale is always reported from our server. That half cannot be switched off, and it is the half
that keeps working when a shopper has an ad blocker, closes the tab, or is on an iPhone that blocks
tracking. If you also want the sale reported from the shopper's browser, there is a switch for it —
see *Sending the purchase from the browser too* below.

## What you need from Meta

Two values, both from [Events Manager](https://business.facebook.com/events_manager2):

1. Your **Pixel ID** — a long number.
2. A **Conversions API access token** — Events Manager → choose your Pixel → **Settings** →
   Conversions API → *Set up manually* → **Generate access token**.

You do **not** need to build a Meta app or go through app review. If you cannot see the
"Generate access token" button, you do not have developer access to that business — ask whoever
set up the ad account.

Paste both into **Store Settings → Marketing → Meta Pixel** (tap the row to open it), then press **Send test event**. Meta should show it
within a few seconds. Until that works, nothing is being reported.

## When a sale counts

This is the one setting worth thinking about, because **Meta cannot un-count a purchase.** Once a
sale is reported, cancelling or returning the order does not take it back.

| Choice | Meta counts the sale | Worth choosing when |
|---|---|---|
| When the order is placed | Immediately at checkout | You take payment up front. Fastest signal, but it counts orders you later reject and parcels that come back. |
| **When you confirm the order** | When you press Confirm | **The recommended setting.** It counts orders you agreed to ship. |
| When the order is delivered | When the parcel arrives | You want only completed sales counted. Slowest, and the most honest. |

On cash on delivery, the gap between these is large. If a good share of your orders get rejected on
the confirmation call, or come back undelivered, "when the order is placed" will tell Meta you sold
far more than you did.

Changing this setting **applies to new orders only**. Orders already in progress may not be reported
at all, and that cannot be fixed afterwards — so pick it once, early.

## Sending the purchase from the browser too

**Store Settings → Marketing → Meta Pixel → Browser events → Purchase.** Off unless you turn it on.

Some ad setups work better when the purchase also arrives from the shopper's own browser, with
their cookies attached. If yours is one of them, turn this on. Your sale is then reported twice —
once from the browser the moment the order is placed, and once from our server at the point you
chose above — and both carry the **same order reference**, so Meta merges them into one purchase.

**Meta only merges the two if it receives them within 48 hours of each other.** That is the whole
thing to get right, because the browser always reports at checkout while our server reports at the
point you chose:

| Your setting for "when a sale counts" | What happens |
|---|---|
| **When the order is placed** | Both arrive seconds apart. Always merged into one purchase. **Safest.** |
| When you confirm the order | Merged, as long as you confirm within two days. |
| When the order is delivered | Delivery usually takes longer than two days, so **the same sale is counted twice.** |

If you want the browser purchase and you are not certain you will confirm within two days, set
"when a sale counts" to **when the order is placed**. Otherwise leave this switch off — you lose
nothing, because the sale is already being reported from our server.

Meta cannot remove a purchase once it has counted it, so a sale counted twice stays counted twice.
The settings page shows you a warning whenever this switch is on with a setting that risks it.

## Which orders get reported

Orders from your website always count. For the rest you choose:

- **Messenger, WhatsApp, Instagram and post comments** — on by default. Someone ordering under a
  boosted post usually got there because of the ad.
- **Phone orders** — on by default.
- **Manually created ("Other")** — **off** by default. This is where an order you typed in for
  yourself, a friend, or a test lands, and those are not ad results.

## Keeping one order out

Tick **Don't report this order to Meta** when you create an order, or use the toggle on the order
page. Use it for anything personal, internal, or a test.

Tick it **when you create the order** if you are also ticking "Confirm and reserve stock now" —
that confirms the order immediately, so there is no moment afterwards to exclude it.

Once an order has been reported, the toggle locks. That is not a bug: Meta has no way to delete a
purchase, so switching it off would change nothing.

## Checking it works

The **Meta Ad Reporting** page lists every sale we sent and every one we did not, with the reason.
If an order is missing from Meta, look there first — the answer is usually a setting you chose, not
a failure.

A row can say:

- **Reported** — Meta accepted it.
- **Queued** — on its way, normally within a minute.
- **Failed** — something went wrong; the reason is shown and you can retry. An expired access token
  is the usual cause, and only a new token fixes it.
- **Not sent** — a rule you configured, named in plain words.

In Meta's own Events Manager, check the **Event Match Quality** score on your Purchase event. It
tells you how well Meta can tie your sales to real accounts. Higher is better, and it depends
mostly on customers reaching checkout with tracking allowed.

## A note on privacy

Customer details sent to Meta are scrambled first (hashed), so Meta never receives a readable phone
number or email. You are the one deciding to share this data with Meta, so your shop's privacy
policy should say that you use Meta advertising tools.
