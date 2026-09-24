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
  - settings:notifications.log.resend
  - settings:notifications.sms.quietHours.title
  - settings:notifications.sms.quietHours.hint
  - settings:notifications.sms.usage.title
  - settings:notifications.smsEditor.editButton
  - settings:notifications.smsEditor.bodyHint
  - settings:notifications.smsEditor.casesTitle
  - settings:notifications.smsEditor.reset
  - settings:notifications.smsEditor.storeName.title
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

### Seeing what each SMS says, and what it costs

You do not have to guess. In the table below, **hover an unticked SMS box** and the exact message
appears. Tick it and the message moves under the event name, so at a glance you can read everything
your shop is currently texting.

The wording is shown with your real **SMS store name** filled in (see below), so what you read is
what gets sent. Every message we ship fits in one SMS.

### Your SMS store name

The SMS number your customers see is ours, not yours — so the name at the end of each message is the
only thing that tells them who texted. That is the **SMS store name**, on the SMS credit card.

SMS can only carry English letters without costing double, so this name is always in English letters
and at most 20 characters. If your store name already fits, it is used as it is. If it doesn't — it is
in Bangla, or longer than 20 characters — the name is taken from your shop address instead, and the
card asks you to check it reads right. Type your own and press **Save** to change it; this changes SMS
only, never your emails or your storefront.

### Writing your own SMS

Rows that send an SMS to your customers have an **Edit SMS** link under the event name. It opens an
editor where you write the message in your own words — the COD amount to keep ready, your phone
number, a thank-you in your own voice.

- **English letters only.** The editor says so: *English letters only. You can write Bangla in English
  letters (Banglish).* "Apnar order confirm hoyeche" works; Bangla script is refused, because one
  Bangla letter turns the whole message into two SMS.
- **Insert, don't type, the details.** The buttons under the message add the customer's name, the order
  number, the COD amount and so on, exactly where your cursor is.
- **Your store name must be in it**, so the customer knows who wrote.
- **It is always one SMS.** The editor checks your text against long names and big amounts as you type,
  and won't save it until it fits.

Under **How it will look** you see the message for a typical order, a very long name, a name written in
Bangla, no name at all, and a prepaid order. A customer name in Bangla is replaced by the word you
choose (for example *Customer* or *Sir*) — it is never spelled out in English letters on the customer's
behalf. A very long name is shortened to the first name.

**Reset to default** puts our wording back.

### Testing that SMS works

Once SMS is switched on, a **Send test to** box appears, already filled in with your alert number.
Press **Send test SMS** and one message goes to whatever number is in that box, so you can confirm
it arrives before a real customer order depends on it.

You can type a different number in there — useful when you are fixing a wrong alert number and want
to prove the new one works first. It only applies to that one test: *Sends one real message to this
number and charges 1 SMS. Editing it here does not change your alert number.* To change the number
permanently, edit **Alert phone** in the card above.

There is no free test — a test that did not go through the live gateway would not prove anything.

If it fails, the reason shown comes straight from the SMS company, not from us. That wording is
what to quote if you contact support. You can send a handful of tests an hour; past that it stops
you, because repeating a failing test is not diagnosis.

### Quiet hours

Once SMS is on, **Quiet hours** appears under the switch. Set a window — 22:00 until 08:00 by
default — and no SMS leaves the workspace inside it.

Read the hint carefully, because it is the whole point: *SMS is held until morning, never dropped.
Email is unaffected.* An order that ships at eleven at night still texts the customer; it texts
them at eight the next morning instead of waking them. Nothing is lost and nothing is skipped, so
there is no "quiet hours" row to look for in the message log.

The hours are your workspace's local time, not the customer's and not ours.

Email is left alone deliberately — it costs nothing, wakes nobody, and sits in an inbox until
somebody opens it.

### Where your SMS went

**Where your SMS went**, at the bottom of the SMS card, breaks the last six months down by event
and by month: how many messages each event sent and how many SMS they cost.

It answers the question the balance cannot. If two hundred SMS vanish in a week, this is what tells
you *which* event spent them — and the fix is almost always unticking one row in the table above.

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
- *This address or number failed permanently before, so we stopped sending to it* — the address is
  dead, or the SMS company told us the number is not a real one. Continuing to try would damage
  delivery for every other message you send, and on SMS it would cost you credit each time. Ask the
  customer for a new address or number.

**Queued** means it is waiting for the next send cycle, which runs every thirty seconds. If a row
stays queued much longer than that, the problem is the mail service rather than your settings — or,
for SMS, quiet hours are holding it until morning, which is working as intended.

### Sending a failed message again

Rows marked **Failed** carry a **Resend** button. Use it once you have fixed whatever caused the
failure — the message itself is kept exactly as it was written, so the customer gets what they were
always meant to get, not a version rebuilt from today's data.

Two rows that say *Not sent* can also be resent: the two about SMS credit. Top up and press Resend
and they go.

Everything else marked *Not sent* has no Resend button, and that is deliberate rather than a
limitation: those messages were stopped before a recipient was even worked out, so there is nowhere
to send them. Fix the cause — tick the channel back on, ask for a working address — and the next
one sends normally.

Resending an SMS **charges your balance again**, exactly like the first attempt. The page says so
above the rows whenever a resendable SMS is on screen.

Password resets, email verification and team invites cannot be resent from here at all. They carry
a one-time link that is deleted from the log the moment the message finishes, so there is nothing
left to send — and a resurrected sign-in link would be worse than a missing one. Ask the person to
request a new one instead.

The log keeps six months of history. The message body itself is never stored for you to read back —
some of these emails carry one-time sign-in links, and a readable log would be a way to steal one.
