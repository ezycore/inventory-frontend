# Help docs backlog

Screens that exist but have no help page yet. Everything here is a **conscious deferral**, not an
oversight — `pnpm help:verify` reads this file, so a route listed here passes the coverage gate and
a route listed nowhere fails it.

That is the whole point: a newly added screen matches nothing and breaks the build until someone
decides, at the moment it is cheapest to decide, whether it needs documenting.

Tick a box and delete the line when the page lands.

## Deferred

Every other route in `constants/navItem.ts` is covered by a page in `en/`. Adding a screen to the
sidebar will fail `pnpm help:verify` until it is either documented or listed here with a reason.

- [ ] `/ecommerce/pages` — Pages (Storefront Builder landing pages), added 2026-09-15 with the first
      step of the Phase 3 editor (`inventory-backend/docs/plan/storefront-builder.md`). The screen
      grows through the phase; its guide is written in the phase's last step, once the editor's
      controls have settled, rather than rewritten after every step.

## Known gaps that are not routes

These are real weaknesses in the docs that the coverage gate cannot see, recorded so they are not
mistaken for finished work.

- **The storefront pages have no `ui_labels`.** The `/ecommerce/*` screens are not internationalised —
  their labels are hardcoded English in the page components, not `messages/en/`. The stale-label gate
  can only check message keys, so those four pages (`storefront-setup`, `storefront-catalog`,
  `storefront-orders`, `storefront-promotions`) are protected by the coverage check alone. Renaming a
  storefront button will **not** fail the build. Fixing this means internationalising those screens;
  until then they need a human read whenever storefront UI changes.

- **Bangla is not written.** All pages are English-only. `bn/` translations must follow
  `docs/I18N-GLOSSARY.md` so wording matches the Bangla UI. The gate warns per page without failing.

- **Backend-only behaviour changes are invisible.** A valuation-method or tax-rule change alters what
  a number *means* on a screen with no frontend diff. Nothing fires. `read-your-reports.md` and
  `discounts-and-vat.md` are the pages most exposed.

- **`/ecommerce/navigation` is a retired route.** The directory still exists under `app/(protected)/`
  but is absent from the sidebar; its UI now lives as a section inside Customize (see
  `app/(protected)/ecommerce/customize/page.tsx`). Documented as part of `storefront-catalog.md`.
  Worth deleting the dead route directory.

- **Billing has no help page at all.** `/dashboard/billing` is reached from the user menu and the
  overdue banner, never the sidebar, so `constants/navItem.ts` does not list it and the coverage gate
  cannot see it — the build stays green with nothing written. It is now one of the more
  explanation-hungry screens: a Monthly/Yearly switch, a trial explainer shown before a trial starts,
  a "trial already used" state, and the difference between an upgrade (charged now, prorated) and a
  downgrade (applied at period end). Owner-facing, and the questions are all money questions.

- **Screenshots.** None of the pages have any. They rot fastest and cost most to maintain by hand, so
  they should be generated with Playwright against seeded demo data in CI, never captured manually.
