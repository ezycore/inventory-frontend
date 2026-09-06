# Storefront design requests — the register

**Status:** live from 2026-09-06. Phase 3 of the storefront customization plan.

Every design request Customize could not satisfy, in one place, with a count against it. The rule
that follows: **a request seen three times stops being a support answer and becomes a candidate
setting.**

This is a loop, not a build. It exists because the alternative is that "common across merchants"
means *whoever asked most recently* — and the person who remembers the third merchant is rarely the
person who answered the first.

> **It is empty on purpose right now.** There are no production customers yet (see the pre-launch
> section of the backend `CLAUDE.md`), so there is nothing to count. An empty register at pre-launch
> is the correct state; an empty one six months after launch means the loop is not running.

---

## Why this file and not a memory

The one request we already had is the argument for it. The category promo cards arrived as **a
screenshot from one merchant** — and by the time the section was built, the merchant, their trade and
the date were all gone. It was built anyway, on the strength of a second argument (most catalogues
with few departments want it), which worked once and does not scale: the next request will arrive
while somebody is answering a support message, and it will be lost the same way.

A register that captures three fields at the moment of the answer is worth more than a careful one
that gets filled in later, because later does not happen.

## What goes in it

**One trigger, and it already happens:** someone tells a merchant *"Customize can't do that."* That
sentence is the entry. Write the row in the same message.

**Check it is actually true first.** A row logged for something that already ships is worse than no
row: it inflates a count that decides what gets built, and the merchant got the wrong answer as well.
The enumeration to check against is §V.4 of
[`EZYCORE_MASTER_REFERENCE.md`](../../../mission-control/docs/EZYCORE_MASTER_REFERENCE.md) — every
section type, palette, typeface and theme, by name. "A green shop" is `sage`, not a gap. The failure
is easy to make in this direction, because the panels holding this were never opened: **12% of shops
ever touched a design control**, so most of the surface is unfamiliar even to us.

**In:** anything about how the storefront *looks or is laid out* that the merchant could not reach
without code — a colour, a spacing, a section, an arrangement, a control that exists but not where
they need it.

**Out, deliberately:**

- **Bugs.** "The cards overlap on my phone" is not a request for a setting.
- **Catalogue and commerce features** — payment methods, courier options, a report. Those have their
  own backlog; mixing them in makes the count meaningless because it is counting two things.
- **Owner and internal direction.** The product owner's calls during construction (stamping
  `checkout` into theme bundles, "a homepage that opens on a grid of category tiles reads as a
  directory") are recorded in `docs/features/ecommerce.md`, not here. They are decisions, not demand,
  and folding them in would inflate a count whose only job is to measure merchants.

## How to count

**Three distinct merchants, not three conversations.** One merchant asking three times is one. The
`Seen` column is a count of workspaces.

**Group by the setting that would close it, never by the merchant's words.** "Can my department
pictures be bigger" and "I want photo cards with a Shop Now button" are one row if one setting
satisfies both. If you cannot name the setting, the row is not ready to be counted — put it under
*Unshaped* below and shape it before it earns a number. This is the discipline that keeps the
register from filling up with a row called "make it look nicer" sitting at nine.

**The trade column decides what kind of answer it is**, which is the part the count alone does not
tell you:

| Pattern | What it usually means |
|---|---|
| Three merchants, **same trade** | a **theme** (or a starting preset) — a trade-shaped need is what a theme is for |
| Three merchants, **different trades** | a **setting** — it is not about what they sell |

**Three does not mean "build it".** It means the request has earned a design decision, and that
decision goes through the same bar everything else does: *the setting that replaces it is a question
a merchant can answer.* "Framed or unframed?" passes. "Set `--border-strong`" does not.

**A declined candidate must record why, on the row.** Otherwise the count keeps climbing, nobody
remembers the reasoning, and at six somebody caves and ships the control that was correctly refused
at three. A `declined` row with a sentence is the cheapest protection against re-litigating the same
question every quarter.

## States

| State | Meaning |
|---|---|
| `open` | logged, under three merchants |
| `candidate` | three or more — owes a design decision |
| `building` | decision made, work in flight |
| `shipped` | closed, with the setting and the date |
| `declined` | refused, **with the reason on the row** |

---

## The register

| Request | Trade | Merchants | First seen | The setting that would close it | Seen | State |
|---|---|---|---|---|---|---|
| A few departments shown as large promo cards — photo, name, a line of copy, a Shop Now button | *not recorded* | *not recorded* | *not recorded* | `category-banners` section + `sectionConfig.categoryIds` | 1 | `shipped` 2026-09-06 |

**The one row is the worked example of the whole loop, including its failure.** It shipped on one
sighting rather than three — correctly, because a second argument carried it (a catalogue with few
departments has nothing else to merchandise with, and the shape is standard across ecommerce) — but
the three fields this register exists to capture were already lost when it was built. That is what
the empty cells are for: they are not tidy, and they are the point.

## Unshaped

Requests that have arrived but cannot yet be stated as a setting. They carry **no count** — shape
them first, then move them up. Anything that sits here for a long time is usually two different
requests wearing one sentence.

*(none yet)*

---

## 3.2 — Let the fire exit report what it is used for

**Blocked by Phase 4 (custom CSS), which does not exist yet.** Specified here so Phase 4 ships
instrumented rather than being retrofitted.

Once merchants can write CSS, what they write is the highest-quality signal available: it says
precisely what they wanted and could not get, in the exact vocabulary of the thing they wanted to
change. **Five shops overriding the same property is a setting waiting to be built.**

This inverts the usual relationship. A custom-CSS feature normally *relieves* the pressure to build
settings — merchants stop asking because they can do it themselves, and the product stops learning. It
is instrumented so it creates that pressure instead: a rule that shows up repeatedly is read as a
Phase 2 gap.

### Why five here and three above

They are not the same evidence. A support request costs the merchant the effort of asking and arrives
with an explanation of what they were trying to achieve. A CSS declaration costs a paste: it may be
copied from a forum, it may be working around a bug rather than a missing setting, and one merchant's
stylesheet can touch twenty properties in one go while wanting one of them. More instances buy the
same confidence.

### How to read it

**No new collection, and no derived index.** Phase 4.2 already stores the parsed, safe form of each
shop's CSS on its settings document — so the data is on disk the moment the feature ships. The audit
is a read: `pnpm audit:custom-css` walks `storefrontsettings`, re-parses the stored CSS, and prints
`property → shop count`, descending, plus the selectors each property was applied through.

Re-parsing on demand rather than maintaining a stored index is deliberate at both ends: a few dozen
to a few thousand small stylesheets is nothing to parse, and a second derived copy of the same facts
is a thing that drifts from the stylesheet it claims to summarise. The safe CSS stays the single
source.

### The obligation that comes with it

**When a setting ships to replace a rule, the shops using that rule get migrated onto it.** Skipping
that step is how the fire exit becomes load-bearing: the merchants who most needed the setting stay on
their CSS, the new control launches with no users, and the next reading of the audit still shows the
property at five — now permanently, because nobody is going to remove working CSS on their own.

Their CSS is also the migration's own test: the setting is right when applying it and deleting the
rule leaves the shop looking identical.

---

## Related

- The plan this phase belongs to, and the bar every candidate setting has to clear:
  [`.claude/skills/storefront/SKILL.md`](../../.claude/skills/storefront/SKILL.md)
- What shipped in Phases 1 and 2, and why:
  [`ecommerce.md`](../../../inventory-backend/docs/features/ecommerce.md)
