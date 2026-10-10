---
title: Handle online orders
slug: storefront-orders
summary: Work through orders from confirmation to delivery, and see who is buying.
order: 104
covers_routes:
  - /ecommerce/orders
features:
  - storefront
---

# Handle online orders

**Online Orders** is your queue of everything shoppers have placed. Working it promptly is most of
what makes an online store succeed — an order sitting unconfirmed for a day is an order the shopper
has started to regret.

## How an online order moves

An online order is not a counter sale. It arrives before any money or goods have changed hands, and
it moves through stages:

1. **Placed** — the shopper has ordered. Nothing has left your shelf.
2. **Confirmed** — you have accepted it. **This is when the stock is reserved for them**, so it can
   no longer be sold to someone else at the counter.
3. **Dispatched** — handed to your courier or driver.
4. **Delivered and paid** — the money is recorded and the sale is complete.

The reservation at confirmation is the part worth understanding. Confirming an order you cannot
actually fulfil holds stock away from customers standing in front of you; leaving real orders
unconfirmed lets that stock get sold twice. Confirm what you can fulfil, promptly, and cancel what you
cannot.

## Working the queue

For each order you can review what was bought, confirm or cancel it, record dispatch, and print an
invoice. Invoices use the same letterhead as everything else — see
[Set up your receipts and invoices](./receipts-and-printing.md).

Cancelling a confirmed order releases the reserved stock back for sale.

## Cash on delivery

Most orders are cash on delivery: the shopper pays your courier, and the payment is recorded when the
order completes. Until then it is money owed, not money held — so an order marked delivered but never
settled will quietly distort your cash figures. Reconcile with your courier regularly.

## When a parcel comes back

If the shopper refuses a cash-on-delivery parcel, the courier brings it back to you. What happens next
depends on what the courier tells us:

- **Pathao says the parcel is back with you** and the shopper paid nothing — the order is returned for
  you. The goods go back into stock and the sale is reversed. The activity log shows it was done by
  the courier.
- **Anything else** — a "Paid Return" (the shopper paid the delivery charge at the door), an order
  already marked delivered, or a courier that does not report "back with you" — waits for you. These
  orders are counted on the **Courier says returned** card, and the button of the same name above the
  list shows only them. Open each one and press **Return whole order** once the parcel is in your
  hands.

A parcel the courier has reported returned no longer counts as cash in transit. While it travels
back, its courier status reads **Returning to you**, and **Back with you** once Pathao hands it
over — so you know whether the goods are actually in your hands before you return the order.

### The customer sends some items back later

A customer who kept the parcel can still return part of it — one shirt out of three, a wrong size.
Once the order is paid, open it and press **Return items**. Enter how many of each item came back.
The dialog shows what is left to return on each line and how much the customer gets back. The
delivery charge is not refunded.

If you keep accounts, choose where the money goes: out of an account, or as store credit for the
customer's next order. Without accounts, the sale is reduced and you pay the customer back yourself.
The order then reads partly returned, and **Return items** stays on it so more can follow later.

If the order is still unpaid — the courier has not paid you yet and part of the parcel was refused
at the door — use **Collected a different amount…** in the payment card instead.

### Find your returns

Press **Returns** above the order list to see every order something came back from, whole or in
part. Each order lists its own returns in a **Returns** card; open one to see what came back, the
sale reversed, what was refunded and the delivery charge you kept.

## Store customers

Shoppers with a store account live on the **Customers** page, under its **Online** tab — one place
for everyone who buys from you, however they buy. The tab lists the shoppers who have accounts on
your store, with their order history. It stays separate from your counter's customer list, so the
same person buying both ways may appear in both.

Use it to see who buys repeatedly and what they buy. Repeat online buyers are the cheapest sales you
will ever make.

**Subscribers** is the second tab: people who gave you an email address through the sign-up form in
your shop footer. Most of them have never ordered — that is the point of the list. The **Account**
column tells you which ones also have a store account, so you can tell a customer from a lead.

The list is read-only, and deliberately so: each row records that someone asked to hear from you and
when. You cannot add an address by hand, because an address you typed in yourself is not a record of
anyone agreeing to anything. To collect any, add an **Email sign-up** block to your footer (or pick
the **Stay in touch** layout) under Online Store → Customize → Footer.

## Next

[Run discounts and coupons](./storefront-promotions.md).
