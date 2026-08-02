---
title: Notifications
slug: notifications
summary: Decide which events send a message, who receives it, and on which channel.
order: 30
covers_routes:
  - /settings/notifications
ui_labels:
  - settings:notifications.title
  - settings:notifications.subtitle
  - settings:notifications.recipientsTitle
  - settings:notifications.alsoNotifyOwner
  - settings:notifications.sms.title
  - settings:notifications.sms.empty
  - settings:notifications.sms.test
  - settings:notifications.sms.testHint
  - settings:notifications.sms.expired
  - settings:notifications.log.title
  - settings:notifications.log.status.skipped
---

# Notifications

**Settings → Notifications** is one page that controls every message your shop sends —
order updates to customers, alerts to you, payment reminders, daily summaries. The page puts
it plainly: *Choose which events send a message, to whom, and on which channel.*

Each row is an event, such as *Order placed* or *Payment due reminder*. Each column is a
combination of **who** gets told and **how**:

- **Customer / Email** — the person who bought something
- **You / Email** — the alert that lands in your own inbox

Tick a box and that message starts sending. Untick it and it stops. Nothing else needs saving.

## Who "you" means

By default, alerts meant for you go to the workspace owner's email address.

Under **Merchant alerts** you can send them somewhere else instead — a shop email, or a
manager's address. Fill in **Alert email** and alerts go there. Leave *Also send to the
workspace owner* ticked and both addresses get a copy, which is the safer setting if
someone other than you handles orders day to day.

## Messages that can't be turned off

A few rows are marked **Always on** with a padlock: password resets, email verification, and
the invite email for a new team member. These are how a person gets back into an account,
so switching them off would lock somebody out. Everything else is yours to decide.

## Order updates are your decision, not the customer's

Customers can't opt out of order updates from their account page — those are part of the
service they bought. What a customer *can* control is marketing: promotional emails,
price-drop alerts and the newsletter, which they manage themselves under their storefront
account.

So if a customer says they are not getting order emails, check this page — not their
account settings.

## SMS

**SMS credit** at the top of the page shows how many messages you have left. Every SMS costs money
to send, so it runs on a prepaid balance — email does not, and never stops because SMS ran out.

New workspaces start with a few free SMS so you can see it working before deciding whether to buy
more. To add credit, contact us and we'll top it up. Credit is **non-refundable** once added.

**Credit is valid for six months**, and the card shows the date under the balance. Any top-up
extends the whole balance — including SMS you already had — so if you buy credit regularly, nothing
ever runs out of time. If the date does pass, the messages are not deleted; the card says exactly
that: *Your SMS credit has expired. The messages are still here — top up and they become usable
again. Email is unaffected.*

Three separate things have to be true before an SMS goes out, and the card tells you which one is
missing:

- **SMS is available on your workspace.** If it says otherwise, contact us — nothing on this page
  will fix it.
- **The switch is on.** It is off by default, so nothing costs you money by accident. Turning SMS on
  never turns email off; they are independent ticks in the table below.
- **You have credit.** At zero the card says so plainly — *You're out of SMS. Order emails keep
  sending as normal — only SMS stops.*

A long message counts as more than one. Roughly 160 English characters fit in one; Bangla is about
70, because the alphabet needs more space per character. So a Bangla message that looks short can
still cost two.

### Testing that SMS works

Once SMS is switched on, **Send test SMS** sends one message to your alert number so you can
confirm it arrives before a real customer order depends on it.

It is a real message: *Sends one real message to your alert number and charges 1 SMS.* There is no
free test — a test that did not go through the live gateway would not prove anything.

If it fails, the reason shown comes straight from the SMS company, not from us. That wording is
what to quote if you contact support. You can send a handful of tests an hour; past that it stops
you, because repeating a failing test is not diagnosis.

## Scheduled messages and the time they arrive

Three rows go out on a clock rather than in reaction to something happening. Each has a clock icon
and a time picker under its name: **Daily sales summary**, **Expiry alert** and **Payment due
reminder**.

The time is *your* local time, not ours. Set the sales summary to whenever you close, and it arrives
with the day's takings already totalled. The expiry alert defaults to the morning, which is when
there is still time to pull stock off the shelf.

Untick the row to stop it entirely — the picker is only about *when*, never *whether*.

### Payment due reminders

This one emails customers who owe you money, so it is deliberately cautious:

- Nothing is sent until an invoice is **a week past its due date**. Someone paying on agreed terms
  is not late.
- A customer hears from you at most **once a fortnight**, however long the debt stands.
- One email per customer, not per invoice. Four unpaid invoices are one conversation, and the
  statement lists all of them.

It only appears if the Accounts module is on, since that is where dues come from. Sending a
statement to one customer right now is a different thing — use **Email statement** on their ledger.

## Checking what was sent

At the bottom of the page, **Message log** records every message the system produced — including
the ones it deliberately did *not* send. That is the first place to look when someone says they
never received something.

Each row shows when it happened, which event caused it, who it went to (the address is partly
hidden — the log is not the place to browse customer contact details), the channel, and the
outcome. Filter by event, status or channel to narrow it down.

The rows marked **Not sent** are the useful ones, because each carries its reason:

- *No address on file for this person* — the commonest cause. The customer never gave you an email.
- *This address bounced before, so we stopped mailing it* — the address is dead, and continuing to
  mail it would damage delivery for every other message you send. Ask the customer for a new one.
- *This channel is switched off for this event* — the matrix above is doing exactly what you set it
  to. Tick the box if that was not what you wanted.
- *SMS credit had expired when this was due to send* — the balance was there but past its date. Top
  up and it works again; this is not the same as running out.

**Queued** means it is waiting for the next send cycle, which runs every thirty seconds. If a row
stays queued much longer than that, the problem is the mail service rather than your settings.

The log keeps six months of history. The message body itself is never stored for you to read back —
some of these emails carry one-time sign-in links, and a readable log would be a way to steal one.
