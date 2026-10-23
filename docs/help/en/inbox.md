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
  - settings:features.names.inbox
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

You connect your Page once, through your own Meta app — the same idea as connecting a courier with
your own account. It takes about fifteen minutes, and our support team can do it with you on a call.

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

## Who can do what

- Owners and admins can connect and disconnect the Page.
- Managers and staff can read chats and reply.
- Viewers can read chats.

You can change this per role under **Settings → Roles** (the **Inbox** permissions).
