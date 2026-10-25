---
title: Answer Facebook messages in the Inbox
slug: inbox
summary: Connect your Facebook Page and read and reply to its Messenger chats inside ezycore, next to your orders.
order: 113
covers_routes:
  - /inbox
features:
  - inbox
ui_labels:
  - inbox:page.title
  - inbox:page.settings
  - inbox:list.unreadOnly
  - inbox:settings.connect
  - inbox:settings.callbackUrl
  - inbox:settings.verifyToken
  - inbox:settings.test
  - inbox:settings.disconnect
  - inbox:settings.oauth.button
  - inbox:settings.oauth.ownAppToggle
  - inbox:settings.ai.title
  - inbox:settings.ai.enable
  - inbox:settings.ai.idle
  - inbox:settings.ai.autoConfirm
  - inbox:settings.ai.instructions
  - inbox:settings.ai.offHours.title
  - inbox:settings.ai.offHours.add
  - inbox:thread.owner.aiOff
  - inbox:thread.orderPlaced
  - inbox:thread.viewOrder
  - ecommerce:orderDetail.placedByAi
  - ecommerce:orderDetail.openChat
  - inbox:settings.credit.title
  - inbox:settings.history.title
  - inbox:settings.history.creditsTitle
  - inbox:settings.flags.title
  - inbox:thread.flag.save
  - inbox:thread.owner.takeOver
  - inbox:thread.owner.giveBack
  - settings:features.names.inbox
  - settings:features.names.aiChat
---

# Answer Facebook messages in the Inbox

Most of your customers ask on Messenger first: "price koto?", "L size ache?". The **Inbox** brings
your Facebook Page's Messenger chats into ezycore, so you can answer them next to your products and
orders instead of switching between apps.

A reply you send from ezycore goes to the customer through your Page, exactly as if you had typed it
in Facebook. A reply you type in Facebook or Meta Business Suite still works too — it shows up in the
same chat here.

## Turn it on

The Inbox is its own switch: turn on **Inbox** under **Customize workspace** at the bottom of the
sidebar. It needs your online store to be on. Once it is on, **Inbox** appears in the sidebar under
Sell.

## Connect your Facebook Page

### With Connect with Facebook

If **Inbox → Page settings** shows a **Connect with Facebook** button, that is the quick way:

1. Click **Connect with Facebook** and log in with the Facebook account that manages your Page.
2. In the Facebook window, allow access to your Page.
3. Back in ezycore, pick the Page and click **Connect**. That is all — there is nothing to copy, and
   ezycore sets up Facebook for you.

If a Page is listed but cannot be connected, your role on that Page cannot answer messages — ask the
Page's admin to connect it.

### With your own Meta app

You can also connect your Page through your own Meta app — the same idea as connecting a courier with
your own account. When the button above is shown, this option is under **Use your own Meta app
instead (advanced)**. It takes about fifteen minutes, and our support team can do it with you on a
call.

1. On **developers.facebook.com**, create an app with the "Engage with customers on Messenger" use
   case, inside the same business portfolio as your Page.
2. In the app's **App settings → Basic**, add an icon, a privacy policy link and a data deletion
   link, and copy the **App Secret**.
3. In **Messenger → API settings → Generate access tokens**, connect your Page, copy its **Page ID**
   and generate the **Page access token**.
4. In ezycore, open **Inbox → Page settings**, paste the three values and click **Connect Page**.
   ezycore checks both with Facebook before saving, and tells you exactly which one is wrong if it
   is not right.
5. ezycore then shows a **Callback URL** and a **Verify token**. In your Meta app, open
   **Messenger → API settings → Configure webhooks**, paste both and click *Verify and save*.
6. Click *Add subscriptions* next to your Page and tick **messages** and **message_echoes**.
7. **Publish** your Meta app. Until it is published, only you and the people you added to the app
   can reach the Inbox — your customers cannot.

**Check connection** re-tests the saved details with Facebook at any time. **Disconnect** stops new
messages arriving; the chats you already have stay, and reconnecting the same Page carries on in the
same chats.

## Read and reply

The left side lists every chat, newest first, with a count of unread messages. Use **Unread only**
to see just the chats waiting for you. Open a chat to read it and reply; opening it marks it read.

- A customer's name appears a moment after their first message. Facebook does not share profile
  photos, so each chat shows the customer's initials.
- Photos a customer sends show in the chat while Facebook keeps the link working. Older ones — and
  videos, voice messages and files — say "open it in Meta Business Suite".
- Enter sends a reply; Shift + Enter starts a new line.

## The 24-hour rule

Facebook only lets a Page reply within **24 hours of the customer's last message**. After that the
reply box is replaced by a note saying so — the moment the customer writes again, you can reply
again. Order updates after that window are best sent by SMS.

## AI replies

When your workspace has AI replies, **Inbox → Page settings** shows an **AI replies** card. Turn on
**Let AI answer new chats** and the AI answers customers' questions about your products, prices,
stock and delivery charges — always from your own catalogue, the same prices your online store
shows. It waits a few seconds after the customer stops typing, so three quick messages get one
answer.

The AI hands the chat to your team when a customer complains, bargains, wants to pay in advance,
sends a photo or voice message, or asks something it cannot answer. The customer then gets your
holding message (if you set one), and the chat shows **With staff** with the reason.

In a chat:
- **Take over** stops the AI so you can answer yourself. Replying from ezycore or from Facebook
  does the same.
- **Give back to AI** hands the chat back. Typing `#ai` in Meta Business Suite does it too.

After you reply, the AI stays out of that chat until you give it back — or, if you chose a time in
**Give the chat back to AI when your team is quiet for**, until the customer writes again after
that long without a reply from your team.

Turning AI on starts it on **new** chats. Chats already with your team stay with them until you
click **Give back to AI**.

If the card says AI replies are switched off for your workspace, turn on **AI replies** under
**Settings → Customize workspace** first.

### Tell the AI about your shop

**Instructions for the AI** is a box in the AI replies card where you write, in your own words,
what the AI should know and how it should talk: your return policy, delivery times, greeting, what
not to promise. Up to 2,000 characters. The AI follows them in your shop's chats only.

Prices, stock, delivery charges and orders always come from your catalogue and checkout, so writing
"give everyone 10% off" does not change what an order costs — ask for discounts to go to your team
instead. Longer instructions make each reply cost a little more.

### AI off hours

Under **AI off hours**, choose the times when you want your team to answer instead of the AI —
for example 10:00 AM to 2:00 PM on Saturday to Thursday. Click **Add off hours** for each window
(up to five), choose its days, and the start and end time. A window may run past midnight, and the
same start and end time means the whole day. Times follow your shop's time zone in Settings →
Organization.

During off hours the AI sends nothing and the chat shows **AI off hours — your team answers now. The AI replies afterwards if nobody has.**
If someone on your team replies, the chat stays with them. Messages nobody answered get an AI reply
a few minutes after the off hours end.

### Flag a wrong AI reply

If the AI says something wrong, click **Flag** under its reply in the chat, choose what was wrong
(wrong information, wrong language, rude or unprofessional, should have passed to staff, or other)
and add a note — for **Other**, say what was wrong. Click **Save flag**. The reply then shows its
flag; click it again to change it or **Remove flag**. Only replies the AI wrote can be flagged, and
anyone who can reply to chats can flag one.

Owners see every flag under **Flagged AI replies** in Inbox → Page settings: what the customer said,
what the AI answered, why it was flagged and by whom, with a link to the chat. We use these to make
the AI better.

### Orders the AI takes

The AI can take **cash-on-delivery** orders. It asks for what is missing — the product and size,
how many, the customer's name, mobile number and address — then shows the customer a summary with
the delivery charge and total from your own checkout, and places the order only after the customer
says yes.

- The order appears in **Orders** as Pending, with the channel Messenger, like an order you typed in
  yourself. You get the usual new-order email. Confirm, pack and send it as you always do.
- In the chat you see **AI took an order** with a **View order** link. On the order, **Taken by AI in
  a Messenger chat** with **Open chat** takes you back to the conversation.
- The customer gets the order number and a tracking link, and can ask the AI later how the order is
  doing.
- The AI never takes a different price than the one it showed: if a price changed in between, it
  shows the new total first.
- It hands the chat to your team when the customer wants to pay in advance (bKash, Nagad, bank),
  change or cancel an order, or when your store has orders paused, no cash on delivery, or asks
  customers to accept terms at checkout.

**Confirm AI orders automatically** (in the AI replies card) skips the Pending step: the order is
confirmed straight away and the stock is held. It is off until you turn it on; if stock is short, the
order stays Pending for you.

### AI credit

Each AI reply is paid for from your **AI credit** — a balance separate from your SMS credit. The
**AI credit** card under the AI replies card shows how much you have in Taka, how long it is valid,
and about how many replies it covers at what your recent replies cost. The card also shows what a
reply usually costs, as a range: a quick answer costs less, and a reply where the AI looks up
several products or takes an order costs more. You are only charged for replies that reach the
customer.

- Your workspace gets a small free amount the first time you turn AI replies on.
- To buy more, contact ezycore support. Every top-up extends the validity of your whole balance.
- When the credit runs out (or expires), the AI stops replying and new chats go to your team with
  the reason — customer messages still arrive, and you can answer them as usual.

### Credit history

Under the AI credit card, **Credit history** shows what the AI spent each day over the last 7, 30
or 90 days — the number of replies and the amount — using your shop's own time zone, so a reply at
12:30 AM counts on that day. Click a day to see its chats, the most expensive first; click a chat
to open it. **Credit added and removed** lists every top-up and free credit, and any credit taken
off when it expired or was corrected, with your balance after each one.

## Who can do what

- Owners and admins can connect and disconnect the Page.
- Managers and staff can read chats and reply.
- Viewers can read chats.

You can change this per role under **Settings → Roles** (the **Inbox** permissions).
