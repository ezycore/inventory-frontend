---
title: See abandoned carts
slug: storefront-abandoned-carts
summary: Find out how many shoppers fill a cart and leave, what it was worth, and which step lost them.
order: 105
covers_routes:
  - /ecommerce/carts
features:
  - storefront
---

# See abandoned carts

Most people who put something in a cart never buy it. Across online stores generally, around **7 in
10 carts** are abandoned — so this is normal, not a sign something is broken. What matters is knowing
*how many*, *what they were worth*, and *which step lost them*.

**Abandoned Carts** answers all three. It is read-only: you are looking at shoppers' carts, not
editing them.

## The four numbers at the top

- **Abandoned carts** — carts that still have items in them and have not been touched for at least an
  hour. The one-hour wait matters: without it you would be counting people who are still shopping.
- **Value left behind** — what those carts add up to. Treat it as an *opportunity*, not lost money;
  a good share of it was never going to convert.

- **Cart abandonment** — of the carts started in the last 30 days, the share that never became an
  order.
- **Checkout abandonment** — of the carts that got as far as the checkout page, the share that never
  became an order. This is the harsher number, and the more useful one: these shoppers were trying to
  buy.

**All four cover the same last 30 days** — as do the funnel, the most-abandoned list, and the cart
rows below them. Everything on the page is one period, so you can read the headline number and the
list under it together without accidentally comparing two different spans of time.

A dash (—) instead of a percentage means there is not enough data yet. It does not mean zero.

## The purchase funnel

The funnel shows how many carts reached each step, and how many were lost between them. Read it
top to bottom and look for the **biggest single drop** — that is where to spend your effort.

1. **Built a cart** — added at least one item.
2. **Reached checkout** — opened the checkout page.
3. **Signed in** — chose to use an account rather than checking out as a guest.
4. **Email verified** — of those, the ones who have confirmed their address.
5. **Ordered** — became a real order.

Steps 3 and 4 are **not** walls: shoppers can check out as guests, so a cart that skips them and
still reaches **Ordered** is a perfectly healthy one. Read them as "how many chose an account",
not as drop-off — a big gap between step 2 and step 3 with a healthy step 5 means guest checkout is
doing its job.

Signed-in shoppers are worth having (order history, saved addresses, and they are the only ones
reminder emails can reach), so **Google sign-in** in your store settings is still worth turning on —
it makes an account one tap, and those accounts arrive already verified.

## Most-abandoned products

The products with the most value sitting in abandoned carts. If one product dominates this list, the
problem is usually that product — its price, or it being out of stock — rather than your checkout.

## The four tabs

- **Abandoned** — untouched for over an hour, no order. This is the default.
- **Active now** — carts being worked on right now. Give these time; they are not lost.
- **Ordered** — carts that became orders.
- **All** — every cart that ever held an item.

Search matches the name, email or phone on the cart — whether it came from a shopper's account or
from what a guest typed at checkout.

## Who a cart belongs to

The Shopper column has three answers, and the difference between them matters:

- **A name and email with no tag** — the shopper is signed in. This is their account.
- **A name or phone tagged "Guest"** — they are not signed in, but they got as far as filling in the
  checkout form, so you have a real contact detail. It is captured as they type, which means a cart
  abandoned *between* the form and the Place order button still shows who left it. A guest cart that
  became an order shows the buyer from that order.
- **"Guest — not reachable"** — the cart never reached the checkout form, so there is genuinely no
  name and no number. Nothing can be done with these individually, which is exactly why the funnel
  above matters more than the list.

A guest's phone number is a contact detail, not permission to market to them. Automatic reminders
still only go to shoppers with an account (see below) — reaching out to a guest is a call you make
deliberately.

## What you can do about it

The most common causes of abandonment, roughly in order:

1. **Unexpected delivery cost.** Shoppers who only see the charge at checkout often leave. Keep your
   delivery charges modest and predictable.
2. **A long checkout form.** Trim the required fields under Store Settings → Checkout to the ones you
   genuinely need to deliver.
3. **A price or stock problem on one product.** Check the most-abandoned list.
4. **Guests who left a number.** These are the only rows you can act on one by one — a short call
   about a cart abandoned an hour ago converts far better than any email.

## Things worth knowing

- Carts appear here a short while after the shopper acts, not instantly.
- A shopper who orders and then starts a new cart shows as two rows — one ordered, one active. That
  is correct; they are two separate shopping trips.
- If you add items to your own cart while previewing your store from **Customize**, nothing is
  recorded. Your own testing does not pollute these numbers.

## Reminder emails

You can have EzyCore email a shopper a link back to their cart. Turn it on under **Store
Settings → Checkout → Email shoppers who leave items behind**, and choose when the reminders go.

That one switch is the only one. Settings → Notifications lists *Abandoned cart reminder* so you can
see the message exists, but the row is read-only and links back here — one switch means there is
never a second one quietly cancelling the first.

Two limits are deliberate:

- **At most two reminders per cart**, ever. More reads as spam and costs you the subscriber.
- **Only shoppers who signed in** can be emailed automatically. A guest may have left you a phone
  number at checkout, but that was given to complete an order, not to receive marketing — so
  EzyCore never messages it for you.

Shoppers who switch off *Promotional email* in their account never receive these, even when the
feature is on. That switch is theirs, not yours.

**If the shopper never verified their email, they get their verification link instead.** They cannot
place an order until they confirm their address, so a "come back to your cart" note would send them
into a wall — the useful message is the one that unblocks them. That link is not marketing, so it
goes out even if they turned *Promotional email* off. Either way it counts as one of their two
reminders.

The link expires after 7 days and works once. It rebuilds the cart at **today's** prices, and drops
anything no longer for sale — the shopper is told when that happens rather than handed a quietly
shorter cart. Nothing in a cart is ever reserved.
