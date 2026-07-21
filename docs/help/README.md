# Customer help docs

End-user documentation for the people who **use** EzyCore — shop owners, managers and staff.
Not developer docs. Nothing in here describes services, endpoints, schemas or deployment.

Developer docs live in `docs/*.md` (one level up). This folder is the only place customer-facing
help content lives, and it is the source of truth for the in-app `/help` route.

## Why the docs live in this repo

Help content rots when it lives away from the code it describes. Kept here, a screen and the page
documenting it move in the **same commit**, and `pnpm help:verify` fails the build when they don't.
That is the whole design: freshness is enforced by CI, not by anyone remembering.

This mirrors what `scripts/verify-docs.mjs` already does for developer docs — same idea, different
target.

## Page format

Every page is a Markdown file under `en/` with YAML frontmatter:

```yaml
---
title: Receive stock from a supplier
slug: receive-stock
summary: Record what you bought so it lands in your stock count.
order: 50
covers_routes:
  - /purchases
  - /purchases/orders
features:
  - returns
ui_labels:
  - purchases:create.title
  - purchases:form.instantOption
---
```

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | Page heading, shown in the help index and search. |
| `slug` | yes | URL segment under `/help/`. Must match the filename. |
| `summary` | yes | One line, shown in the index and in search results. |
| `order` | yes | Sort position in the index. Onboarding path uses 10, 20, 30… |
| `covers_routes` | yes | App routes this page documents. Drives the contextual "?" link and the coverage gate. |
| `features` | no | Feature flags required for this page's subject to be visible. Must match the nav's gating. |
| `ui_labels` | no | Message keys for UI text quoted in the body. **This is the staleness detector** — see below. |

## The `ui_labels` contract

When the body quotes a button, tab or field name, quote it in **bold** and list its message key:

```markdown
Choose **Instant Purchase (Receive Now)** if the goods are already in your hands.
```

```yaml
ui_labels:
  - purchases:form.instantOption
```

`pnpm help:verify` then checks the label's current value in `messages/en/purchases.json` still
appears verbatim in the page body. Rename that button and the gate fails on every page quoting it —
which is exactly the moment someone should be rewriting the sentence around it.

This catches the failure mode that matters most: docs describing buttons that no longer exist.

## What the gate checks

`pnpm help:verify` (part of `pnpm verify`) fails on:

1. **Stale label** — a `ui_labels` key whose current English value is missing from the body.
2. **Dead label key** — a `ui_labels` key that no longer exists in `messages/en/`.
3. **Phantom route** — a `covers_routes` entry that is not a real route in `constants/navItem.ts`.
4. **Feature drift** — frontmatter `features` disagreeing with how the nav gates those routes.
5. **Undocumented new route** — a nav route covered by no page and not listed in `BACKLOG.md`.

Check 5 is the ratchet. Today most routes sit in `BACKLOG.md` because only the onboarding path is
written. Adding a *new* route fails CI until it is either documented or consciously deferred, so
coverage only ever moves forward.

## Adding or changing a page

Use the `help-docs` skill (`.claude/skills/help-docs/`) — it carries the voice rules, the page
template and the Bangla translation rules. Then:

```bash
pnpm help:verify
```

## Translations

`en/` is the source. `bn/` is translated from it and must use the same wording as the Bangla UI —
`docs/I18N-GLOSSARY.md` is binding. A doc that calls a button something the button does not call
itself is worse than no doc, and this is the most common way translated help goes wrong.

Pages are allowed to exist in `en/` before `bn/` catches up; the gate reports the gap without
failing.
