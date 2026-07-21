---
name: help-docs
description: Write or update customer-facing help documentation in docs/help/. Use whenever a frontend change alters what a customer sees or does — a new screen, a renamed button, a changed flow — or when asked to write end-user help, a user guide, or onboarding docs. Not for developer docs (docs/*.md).
---

# Customer help docs

Help docs for the people who **use** EzyCore — shop owners, managers, counter staff in Bangladesh.
They live in `docs/help/en/`, and `pnpm help:verify` fails the build when they describe a UI that no
longer exists. Read `docs/help/README.md` for the format; this skill is about what to write.

## The reader

A shop owner, not a software person. Possibly reading on a phone, behind a counter, with a customer
waiting. English is often their second language.

They arrive with a task ("how do I put in the stock I just bought"), not a curiosity about features.
Answer the task.

## When this triggers

Any change to `app/`, `components/` or `messages/` that a customer would notice:

| Change | Do this |
|---|---|
| New screen in `constants/navItem.ts` | Write a page, or add it to `docs/help/BACKLOG.md` with a reason. The gate fails until you do one. |
| Renamed button/label in `messages/en/` | `pnpm help:verify` names the page; rewrite the sentence around it. |
| Changed flow (steps added/removed/reordered) | Rewrite the numbered steps. Do not patch around it. |
| New feature flag | Note which pages it gates, and add `features:` to their frontmatter. |
| Backend change with visible effect | Rare but real — a valuation-method or tax-rule change alters what a number *means* with no frontend diff, and no gate catches it. Check the reports pages by hand. |

Pure refactors, styling and backend-only work need nothing.

## Writing rules

**Organize by task, never by screen.** "Receive stock from a supplier", not "The Purchases Page".
One page may span several screens; that is correct. Nobody searches for a page name.

**Lead with the decision, not the tour.** If a screen has one choice that determines whether the
user gets the right outcome — Instant Purchase vs Create Order, adjust vs purchase — put it first
under its own heading. That single fork causes more support load than every other detail combined.

**Quote UI text exactly, and register the key.** Bold the label, add its message key to
`ui_labels:`. This is what makes the page break loudly when someone renames the button:

```markdown
Press **Finalize Sale**.
```
```yaml
ui_labels:
  - sales:sell.summary.finalizeSale
```

Only cite keys you have verified exist — check `messages/en/*.json`. Note some files hold several
namespaces (`products.json` contains `products`, `brands`, `categories`, `units`), so the key is
`products:products.page.title`, not `products:page.title`.

**Say what goes wrong.** The most valuable paragraph on any page is the one explaining why the
number looks wrong — wrong location, unreceived delivery, adjustment used instead of a purchase. Put
it under its own heading so it is findable when someone is already confused.

**Short sentences. Second person. Present tense.** "Press Finalize Sale." Not "The user should then
proceed to finalize the sale."

**No jargon, no internals.** Never mention endpoints, services, components, schemas, TanStack Query,
or anything about how it is built. If a sentence would only make sense to someone who has read the
code, cut it.

**Link forward.** End each onboarding page with the next step.

## Don't

- Don't document a screen field by field. Describe the job; mention fields only where the right
  answer is not obvious.
- Don't write "click the blue button on the right" — layout changes, wording is checked.
- Don't invent UI. If unsure whether a control exists, read `messages/en/` or the page component.
- Don't screenshot by hand. Screenshots go stale silently and are the most expensive thing to
  maintain; leave them out until they are generated in CI.
- Don't document feature-flagged screens without declaring the flag — a reader without that feature
  will look for a menu item that is not there.

## Bangla

`en/` is the source; `bn/` is translated from it. Terminology must match the Bangla **UI**, not a
dictionary — `docs/I18N-GLOSSARY.md` is binding. A page calling a button something the button does
not call itself is worse than no page.

English may ship ahead of Bangla; the gate warns but does not fail.

## Before finishing

```bash
pnpm help:verify
```

Fix everything it reports. A stale-label failure means the words in the app changed — reread the
sentence and rewrite it, rather than pasting the new label into the old sentence.
