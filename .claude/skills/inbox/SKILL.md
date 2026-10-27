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
| Components | `components/inbox/` — `conversation-list`, `thread-view`, `message-bubble`, `reply-box`, `connection-form`, `connection-status`, `facebook-connect-card`, `facebook-page-picker`, `ai-settings-card`, `ai-credit-card`, `ownership-banner`, `inbox-nav-badge`, `inbox-utils` |
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
   Meta Business Suite" line; non-image types never try to render. The one exception is
   `type: "product"` — a card the AI sent (`ProductCards`): its `url` is the product page on the
   shop's own website, which does not expire, so it renders as a card with **View on website**
   (backend skill rule 43).
6. **The open chat is `?chat=<id>`** via `useUrlParam("chat", "any", "")`. The thread is keyed by it
   so a half-typed reply does not follow the merchant into another chat.
7. **The sidebar badge is the one special case in `app-sidebar.tsx`** (`item.url === "/inbox"`). A
   second live count should become a `NavItem` `badge` key, not another branch.
8. **"Connect with Facebook" is decided by the backend** (`connection.oauthAvailable`, an env switch
   there) — never by a `NEXT_PUBLIC_*`, which would need a rebuild to flip. On: the button leads and
   the own-app form folds under "advanced". Off: the old screen, unchanged.
9. **The return is in the URL fragment** (`#oauth=<grant>` / `#oauthError=<code>`), parsed by
   `readOAuthReturn` and stripped with `history.replaceState` on arrival. The grant is opaque and
   encrypted — pass it back as-is, never put it in a query string or a query key you log.
10. **A `platform` connection has no webhook card** — ezycore subscribed the Page; there is nothing
    to paste. `useStartInboxOAuth` is in `READ_ONLY_MUTATIONS` (it only fetches the login URL).
    A broken one (`token_invalid`) leads its connection card with **Connect with Facebook again**
    (`useStartInboxOAuth`) and a fixed sentence instead of `statusReason` (Meta's raw text, kept on
    the row for support); the bottom-of-page `FacebookConnectCard` is for a shop NOT on the platform
    path. Reconnecting the same Page updates the row in place — chats and AI settings carry on.
11. **AI replies (Phase 1):** the thread's `OwnershipBanner` shows who answers and offers
    Take over / Give back to AI; "Give back" appears only while `summary.aiActive` (readable with
    `inbox.view` — the connection is not). `AiSettingsCard` on settings shows a switch only when the
    backend reports `aiAvailable`. AI messages carry `role: "ai"` and the bubble labels them.
12. **AI credit (Phase 1b):** `AiCreditCard` (`components/inbox/ai-credit-card.tsx`) reads
    `useInboxAiCredit()` (`GET /api/inbox/ai-credit`, key `queryKeys.inbox.aiCredit()` under the
    inbox root, so any inbox change refreshes it). The balance is **whole paisa** — show it with
    `formatPaisa`, never divide inline. `aiCreditProblem()` names the ONE reason the AI is stopped
    (no price → used up → expired); "replies left" is never shown beside one. The terms text comes
    from Mission Control and renders through the shared `CreditTermsBlock`
    (`components/shared/credit-terms-block.tsx`, also the SMS card's) — never hardcode it.
13. **`aiChat` is the workspace's AI switch** (Customize workspace, on by default). Off →
    `AiSettingsCard` says where to turn it on instead of showing a switch the backend refuses.
14. **AI orders (Phase 2, backend feature doc §10):** the thread renders a `system` message carrying
    `orderId` as `OrderNote` (centred, "AI took an order · View order") — never the stored English
    text, which is a backend log line. The order page reads `statusHistory[0].by === "ai"` and
    `inboxConversationId` for "Taken by AI · Open chat" (`/inbox?chat=<id>`).
    `AiSettingsCard` carries `autoConfirmOrders` (off by default) in the same save.
15. **Merchant AI settings:** `aiInstructions` (textarea, 2,000-character counter mirroring the
    backend cap) and `aiOffHours` via `AiOffHoursField` (`components/inbox/ai-off-hours-field.tsx`:
    day chips from the org's `weekStartDay`, 15-minute `SimpleSelect`s, ≤ 5 windows mirroring
    `MAX_AI_OFF_WINDOWS`, never a window with no day). Times are "HH:mm" on the shop's zone — never
    convert them in the browser. `OwnershipBanner` says "AI off hours" while `summary.aiOffNow`.
16. **AI credit — a price range and a history.** `AiCreditCard` shows `replyPaisaRange` ("usually
    X–Y paisa"), never one number (owner 2026-10-25). `AiCreditHistory`
    (`components/inbox/ai-credit-history.tsx`) shows spend per day and the credit in/out; a day's
    chats load only when it is opened (`useInboxAiCreditDay(date | null)`). Day keys are the
    backend's shop-calendar `YYYY-MM-DD` — print them with `formatDateOnly`, never re-cut them in
    the browser. Both keys sit under `inbox.aiCredit()`'s root, so an inbox change refreshes them.
17. **Flag this reply:** `FlagReply` (`components/inbox/flag-reply.tsx`) renders under an AI reply
    for holders of `inbox.reply` (`MessageBubble` `canFlag`, passed from `ThreadView`); a read-only
    viewer still sees "Flagged: …". The reasons mirror the backend's (`INBOX_AI_FLAG_REASONS` in the
    inbox api module); "Other" needs a note. Mutations fire `inbox.replyFlagged` (the whole inbox
    root — thread and list). The owner's list is `AiFlagsCard` on Page settings, paged in the URL
    with prefix `flags`, ≤ 50 a page (the backend cap).
18. **The bell is not the inbox's.** `NotificationBell` (`components/layout/notification-bell.tsx`)
    shows AI handovers next to new orders; its sentence comes from `useAlertText`
    (`components/layout/use-alert-text.ts`), shared with the browser pop-up, and its sound/pop-up
    live in `useAlertChime` (`hooks/use-alert-chime.ts`, per browser, ring once across tabs). A new
    alert kind is a `case` there plus `layout.bell` strings. **"Text me when a customer waits"** is
    `UnansweredSmsField` in the AI settings card — its only switch; the Notifications matrix links
    here (`MANAGED_BY` in `notification-event-cell.tsx`).
