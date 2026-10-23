---
name: inbox
description: 'The EzyCore INBOX screens (FE side): /inbox (Facebook Messenger chat list + thread + reply box + sidebar unread badge) and /inbox/settings (connect the merchant''s own Facebook Page). USE WHEN: touching app/(protected)/inbox/**, components/inbox/**, services/api/modules/inbox/**, the `inbox` feature switch or `inbox.*` permissions; symptoms "reply box missing", "can''t reply after 24 hours", "unread badge stuck", "photo not showing", "chat list not updating". MUST be updated whenever those files change.'
---

# Inbox (Frontend) — SKILL

> Verified 2026-10-23. **The backend half is the source of truth** — read
> [`inventory-backend/.claude/skills/inbox/SKILL.md`](../../../../inventory-backend/.claude/skills/inbox/SKILL.md)
> for the webhook, Meta rules, dedupe and the 24-hour window. This file only covers the screens.

## Files

| Concern | Where |
|---|---|
| Pages | `app/(protected)/inbox/page.tsx`, `app/(protected)/inbox/settings/page.tsx`, guard `app/(protected)/inbox/layout.tsx` |
| Components | `components/inbox/` — `conversation-list`, `thread-view`, `message-bubble`, `reply-box`, `connection-form`, `connection-status`, `inbox-nav-badge`, `inbox-utils` |
| API | `services/api/modules/inbox/{api,hooks}.ts`; keys `queryKeys.inbox`; events `inbox.connectionChanged`, `inbox.threadRead`, `inbox.replied` |
| Copy | `messages/{en,bn}/inbox.json` (fully translated); glossary section "Inbox" in `docs/I18N-GLOSSARY.md` |

## Rules

1. **Never re-derive the 24-hour rule.** `canReply` / `replyWindowClosesAt` come from the server;
   `ReplyBox` only reads them. Past the window it shows the reason instead of a box.
2. **Polling, not push.** List 10 s, thread 5 s, badge 30 s (`hooks.ts`); TanStack pauses them in a
   hidden tab. `inbox.threadRead` dirties the list and the badge **only on a thread's first load** —
   firing it on every 5 s poll refetches the list forever, and it must never include the thread
   itself.
3. **`inbox.manage` is the only permission that may load the connection** (it carries the webhook
   tokens). The Inbox page asks for it only when the user holds it; the settings page guards itself
   with `useRequireAccess`, because the nav row only requires `inbox.view`.
4. **No profile photos.** Facebook does not give them without App Review — the avatar is
   `initialsOf(name)`.
5. **Attachment URLs expire.** `MessageBubble` shows an image until it errors, then a "open it in
   Meta Business Suite" line; non-image types never try to render.
6. **The open chat is `?chat=<id>`** via `useUrlParam("chat", "any", "")`. The thread is keyed by it
   so a half-typed reply does not follow the merchant into another chat.
7. **The sidebar badge is the one special case in `app-sidebar.tsx`** (`item.url === "/inbox"`). A
   second live count should become a `NavItem` `badge` key, not another branch.
