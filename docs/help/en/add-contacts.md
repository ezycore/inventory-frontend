---
title: Add suppliers and customers
slug: add-contacts
summary: Record who you buy from and who you sell to, and track what they owe.
order: 40
covers_routes:
  - /customers
  - /suppliers
# Union of the gates on the routes above, which is what the freshness gate
# checks — `/suppliers` needs `purchases`, `/customers` needs nothing. The page
# is NOT hidden on this: nothing renders off `features`, it only keeps the
# frontmatter honest about the nav. If that ever changes, split this page first
# — a merchant with no purchasing still needs the customers half.
features:
  - purchases
ui_labels:
  - customers:page.title
  - customers:page.subtitle
  - customers:filters.owesMoney
  - customers:columns.receive
  - dashboard:summary.receivable
---

# Add suppliers and customers

## Suppliers

Suppliers are the businesses you buy stock from. You need at least one before you can record a
purchase — the purchase screen will tell you to add a supplier first if you have none.

A supplier needs a name. Phone, address and email are optional but worth adding, because they appear
on purchase orders you send out.

Each supplier keeps a running balance of what you owe them, built up from purchases you have not yet
paid for in full.

## Customers

Customers are *People and businesses you sell to.* You do **not** need to add a customer for every
sale — counter sales can go to a walk-in customer instead.

Add a proper customer record when you want to:

- Sell on credit and track what they owe you
- See one person's full buying history
- Send them statements or invoices by email

### Customer ledger

Every customer has a ledger — a running record of what they bought, what they paid, and what is
outstanding. It is the answer to "how much does this person owe me", and it updates itself as you
record sales and payments.

### Collect what customers owe

There is no separate dues screen — the customer list is it. Press the **Receivable** card on the
dashboard, or the total at the top of Customers, and the list opens filtered to **Owes money
(largest first)**: everyone with an unpaid balance, the biggest first.

Each of those customers has a **Receive** button next to the amount they owe. It opens their ledger
straight on the payment form, already filled in with the full amount: change it to what they paid
and it settles their oldest invoices first. You need Cash & Bank
turned on, and a role that can edit sales.

If you only sell online — no counter, no Cash & Bank — there is no ledger button. Press a customer's
phone number instead: it opens Online Orders searched by that number, so you see every order they
placed and which ones came back.

### Store credit

When you refund a customer as credit rather than cash, that credit sits on their account and can be
applied to a future sale. It shows up automatically at the point of sale.

## Importing contacts

Both lists accept CSV import, which is worth using if you are moving from a spreadsheet or another
system.

## Next

[Receive stock](./receive-stock.md) — get your opening stock in.
