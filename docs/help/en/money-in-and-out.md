---
title: Track your cash and bank
slug: money-in-and-out
summary: Set up your cash, bank and mobile wallets, and see every taka moving through them.
order: 75
covers_routes:
  - /accounts
  - /accounts/transactions
features:
  - accounts
ui_labels:
  - accounts:accounts.page.title
  - accounts:accounts.page.subtitle
  - accounts:accounts.types.mfs
  - accounts:accounts.form.balanceHint
  - accounts:accounts.form.isDefault
  - accounts:accounts.card.addInvestment
  - accounts:transactions.page.subtitle
  - accounts:transactions.columns.balanceAfter
  - accounts:transactions.stats.netChange
---

# Track your cash and bank

**Accounts** lets you *Manage your cash, bank, and mobile wallet accounts.* Turn this on and every
sale, purchase, payment and refund lands in a real account, so at any moment you know what you
actually hold.

Several parts of EzyCore depend on it. Refunds in particular have nowhere to go without it — see
[Take back a sold item](./sales-returns.md).

## Set up your accounts

Create one account per place you really keep money:

| Type | Use it for |
|---|---|
| Cash | The drawer at your counter, or your safe. |
| Bank Account | Each bank account, kept separate. |
| **Mobile Banking** | bKash, Nagad, Rocket — one per wallet. |
| Custom | Anything that fits none of the above. |

Two settings to get right when you create one:

**The opening balance is permanent.** The form says it plainly: *Set initial balance for new accounts
(cannot be changed later).* Count the drawer, check the bank app, and enter the real figure before
you save. Getting it wrong means every balance from that account is wrong forever, and the only fix
is a correcting transaction.

**Set as Default Account** decides which account is pre-selected when you take payment. Make it the
one your counter actually uses, so staff are not choosing from a list during a queue.

## Recording money that is not a sale

**Add Investment** records a capital injection — you putting your own money into the business. It
increases the balance and is logged separately, so your own money never gets mistaken for profit.

## Transactions

The Transactions screen *Track all income, expenses, and transfers* — every movement, newest first.

Entries appear automatically from sales, purchases, payments and refunds. You add the rest yourself:
Salary, Rent, Utilities, and anything else under Other. Recording those is what turns "money in the
drawer" into a real profit figure.

Each row carries a category and a **Balance After** column, so you can follow the running balance and
find exactly where it went wrong when it stops matching the drawer.

The tiles across the top show total income, total expense and **Net Change** for the period. Net
Change is the number to watch — a strong sales month with a worse net change means costs moved, and
this is where you find which one.

## When the balance does not match reality

Count the drawer, then work backwards through Transactions from the last balance you know was right.
Almost always one of:

- A cash expense nobody recorded — the most common cause by far.
- A sale taken on one account but recorded against another.
- A refund paid out in cash without a return being recorded, so the money left and nothing explains
  it. See [Take back a sold item](./sales-returns.md).
- The opening balance was wrong from the start.

Fix it with a transaction that explains itself, not by quietly editing history — next month you will
want to know what happened.
