---
name: stats-card
description: 'Build, edit, debug, or audit stats/KPI rows in EzyCore frontend that use the `StatsCard` component (theme-aware grid of metric cards built on `Card` + `Skeleton` + lucide icons). USE WHEN: rendering a row of dashboard / list-page metrics (brands, categories, sales, inventory, dashboard summary), wiring a `useXxxStats()` TanStack hook to a stats row, choosing a `variant` (`default` | `primary` | `success` | `warning` | `destructive` | `danger` | `info`), adding `prefix` / `suffix` (currency/percent), `trend` (up / down / neutral with label), `chart` sparkline (`number[]` + tailwind color), `description` subtitle, lucide `icon`, configuring responsive `columns` (default/sm/md/lg/xl — must be 1-6, statically mapped — extend the maps to support more) or the `minCardWidth` flex-wrap mode, wiring a stats helper (`getXxxStats(data) => StatData[]`) in `components/<resource>/helpers.ts`, troubleshooting "skeletons not showing" / "icon not appearing" / "wrong column count" / "trend color wrong" / "value not formatted with commas" / "chart bars invisible" / "dynamic grid-cols class purged by Tailwind" / "cards congested or label text wraps beside a sidebar". Touches files under ui/components/StatsCard/ and components/<resource>/helpers.ts.'
---

# StatsCard Skill

A theme-aware grid of metric cards used at the top of list pages and dashboards. Self-contained: pass an array of `StatData` and an optional `isLoading`, and it renders an icon-decorated `Card` per stat with optional trend indicator and mini-chart sparkline. Built only on internal `Card`, `Skeleton`, `cn`, and `lucide-react` icons (no extra deps).

## When to Use
- Top-of-page KPI row on a resource list (brands / categories / products / customers / sales)
- Dashboard summary blocks
- Anywhere you have `useXxxStats()` returning aggregate counts/totals
- You want **light/dark theme** colors via shadcn CSS variables (no hex codes)
- You want **built-in skeleton loading** during the stats fetch

Do NOT use for: charts (use `recharts`), single inline metric (just render a `Card` directly), forms or tables.

## Files Map (read these before editing)

| File | Purpose |
|------|---------|
| [ui/components/StatsCard/index.tsx](ui/components/StatsCard/index.tsx) | `StatsCard` (default export), `StatCardItem`, `MiniChart`, `TrendIcon`, `variantStyles`, static `colsMap` / `smColsMap` / `mdColsMap` / `lgColsMap` / `xlColsMap`. Exported types: `StatData`, `StatsCardProps`, `StatVariant`, `TrendDirection`. |
| [ui/components/StatsCard/README.md](ui/components/StatsCard/README.md) | Long-form usage reference with examples. |
| `components/<resource>/helpers.ts` | Where each resource defines its `getXxxStats(stats) => StatData[]` factory (e.g. [components/brands/helpers.ts](components/brands/helpers.ts)). |
| `services/api/modules/<resource>/hooks.ts` | The `useXxxStats()` TanStack Query hook that feeds the helper. |

## Procedure: Add a stats row to a page

1. Confirm a stats endpoint exists (or add one in backend) — should return shape like `{ total, active, inactive, ...domain counts }`.
2. Add a `useXxxStats()` hook in the resource's `services/api/modules/<resource>/hooks.ts` (TanStack `useQuery`).
3. Create / extend `components/<resource>/helpers.ts` with a `getXxxStats(stats: Record<string, any> | undefined): StatData[]` factory:
   ```ts
   import type { StatData } from "@/ui/components/StatsCard";
   import { Tags, CheckCircle2, XCircle, ShoppingBag } from "lucide-react";

   export const getBrandStats = (stats: Record<string, any> | undefined): StatData[] => [
     { label: "Total Brands", value: stats?.total || 0, icon: Tags, variant: "primary", description: "All registered brands" },
     { label: "Active",       value: stats?.active || 0, icon: CheckCircle2, variant: "success" },
     { label: "Inactive",     value: stats?.inactive || 0, icon: XCircle, variant: "warning" },
     { label: "Total Products", value: stats?.totalProducts || 0, icon: ShoppingBag, variant: "info" },
   ];
   ```
4. Render in the page above the table/card view:
   ```tsx
   const { data, isLoading } = useBrandStats();
   <StatsCard data={getBrandStats(data)} isLoading={isLoading} />
   ```
   No `columns` prop → grid auto-uses `{ default: 1, sm: 2, lg: data.length }`.

## Procedure: Choose a variant

`StatVariant`: `"default" | "primary" | "success" | "warning" | "destructive" | "danger" | "info"`

| Variant | Token (bg / text / icon) | Typical use |
|---|---|---|
| `default` | `bg-muted/50` / `text-foreground` / `text-muted-foreground` | Neutral / "other" |
| `primary` | `bg-primary/10` / `text-primary` | Total / headline |
| `success` | `bg-success/10` / `text-success` | Active / positive |
| `warning` | `bg-warning/10` / `text-warning` | Inactive / pending |
| `destructive` / `danger` | `bg-destructive/10` / `text-destructive` | Errors / out-of-stock |
| `info` | `bg-chart-4/10` / `text-chart-4` | Secondary metric |

`destructive` and `danger` are aliases — same styling.

`success`/`warning` use the semantic `--success` (emerald) / `--warning` (amber) tokens in
`ui/styles/globals.css`, **not** `chart-2`/`chart-1`. The `--chart-*` ramp in this repo is a
monochrome cyan brand scale for chart series, so it cannot express good/bad — a `warning` card
painted `chart-1` renders light blue. Any new status colour goes on the semantic tokens.

## Procedure: Add a trend indicator

```ts
{ label: "Revenue", value: 54320, prefix: "$", icon: DollarSign, variant: "success",
  trend: { value: "+12.5%", direction: "up", label: "from last month" } }
```
- `direction: "up"` → green (`text-success`) + `TrendingUp` icon
- `direction: "down"` → red (`text-destructive`) + `TrendingDown` icon
- `direction: "neutral"` (or omitted) → muted + `Minus` icon
- **`higherIsBetter: false` swaps the two colours** — the arrow still points the way the number
  moved, but growth turns red. Required on every cost metric (expenses, cash out, returns,
  overdue): a 100% jump in expenses rendered green reads as a win.
- `value` is rendered verbatim (string like `"+12.5%"` or a number)
- `label` appears next to it in muted text

## Procedure: Add a mini chart (sparkline)

```ts
{ label: "User Growth", value: 1234, icon: Users, variant: "primary",
  chart: { data: [45, 52, 48, 63, 58, 72, 69], color: "bg-primary/60" } }
```
- Renders bar sparkline (`flex` of normalized-height divs, `h-10`)
- `color` defaults to `"bg-primary/60"` — pass any `bg-*` Tailwind class
- Empty/missing `data` → nothing renders (safe guard)

## Procedure: Configure responsive columns

```tsx
<StatsCard
  data={stats}
  columns={{ default: 1, sm: 2, md: 2, lg: 4, xl: 4 }}
/>
```
- Auto default if omitted: `{ default: 1, sm: 2, lg: data.length }`
- **All values must be 1-6** — those are the only entries in the static maps. To support 7+ extend `colsMap`/`smColsMap`/`mdColsMap`/`lgColsMap`/`xlColsMap` in [ui/components/StatsCard/index.tsx](ui/components/StatsCard/index.tsx). DO NOT inline `grid-cols-${n}` — Tailwind JIT cannot detect it from outside the static maps.
- `gap` is hardcoded `gap-4` — not configurable via prop.
- **`columns` breakpoints key off viewport width, not the grid's actual container width.** Every protected page sits beside a fixed 16rem sidebar (`ui/components/sidebar.tsx`), so the container is always narrower than the viewport by that much — a page can hit the `xl` viewport breakpoint while its `StatsCard` only has ~950px to lay out 6 columns in, squeezing each card to ~150px and wrapping label text (e.g. `app/(protected)/ecommerce/orders/page.tsx`'s "Delivered · uncollected"). If a `columns` config keeps producing congested cards no matter how the breakpoints are tuned, switch to `minCardWidth` instead of chasing more breakpoint combinations.

## Procedure: Responsive cards without breakpoint guessing (`minCardWidth`)

```tsx
<StatsCard data={getOrderStats(stats, currency)} isLoading={statsLoading} minCardWidth={280} />
```
- Ignored if `columns` is also passed — the two are mutually exclusive; `columns` wins.
- Renders a `flex flex-wrap` row where every card has `flex-basis: minCardWidth` and `flex-grow` — cards wrap to however many actually fit the **container's** width (immune to the sidebar-vs-viewport mismatch above), and the last row's cards stretch to fill instead of leaving trailing empty slots the way an unlucky `columns` split can (e.g. 6 items in `columns.lg: 4` leaves 2 empty cells in row 2).
- Pick `minCardWidth` from the **longest label** in the stat set: the label column gets roughly `minCardWidth - 80px` (card `p-5` = 40px, icon box = 40px) — a ~23-char label like "Delivered · uncollected" at `text-sm font-medium` needs ~170px of label column, so `minCardWidth` ≈ 250-280. Shortening the longest label lets you shrink `minCardWidth` too.
- Prefer `columns` when you want an exact, predictable column count per breakpoint (e.g. always 2-up on tablet); prefer `minCardWidth` when the priority is "never let a card get narrower than X" regardless of how much real estate the sidebar leaves.

## Procedure: Loading state

Pass `isLoading={isQueryLoading}`. Each `StatCardItem` renders skeletons sized to its filled fields:
- Always: label skeleton + value skeleton
- Conditionally: description skeleton (if `stat.description`), icon skeleton (if `stat.icon`), trend skeleton (if `stat.trend`), chart skeleton (if `stat.chart`)

So even during loading the **stat array structure must already match** what will be shown — use the same `getXxxStats(undefined)` (helper returns full array with zero values). DON'T pass `data={[]}` while loading or you get an empty grid.

## Critical Conventions (DO / DON'T)

- **DO** import `StatData` type from `@/ui/components/StatsCard` and type your helper's return.
- **DO** put the stats factory in `components/<resource>/helpers.ts` next to other resource utilities.
- **DO** keep `value` numeric when possible — the component calls `.toLocaleString()` automatically (commas/locale-formatted). For percentages prefer `suffix: "%"` over a string value to keep formatting.
- **DO** use lucide icons by passing the component itself (`icon: Users`), NOT a JSX node.
- **DON'T** use raw hex / inline color styles — use `variant` (theme-aware light/dark). The "old API" with `labelColor` / `bg` is gone (see README migration section).
- **DON'T** pass `columns` values outside 1-6 — they'll silently fall back to "no class" and the grid will break.
- **DON'T** pass JSX into `icon` (`icon: <Users />`) — it expects the `LucideIcon` component reference and renders `<Icon className="h-5 w-5" />` itself.
- **DON'T** wrap `StatsCard` in another container with conflicting `grid` classes — it already renders the grid.
- **DON'T** mirror server data through Zustand — feed it via the TanStack `useXxxStats()` hook directly.

## Value formatting cheatsheet

| Need | Pattern |
|---|---|
| Currency | `prefix: "$", value: 45678` → `$45,678` |
| Percent | `suffix: "%", value: 3.24` → `3.24%` |
| Compact (e.g. `1.2K`) | Pre-format the value to a string; component will skip `toLocaleString()` for non-numbers (it calls `.toLocaleString()` on strings too — but on a string it just returns itself) |
| Decimals | `value: Number(x.toFixed(2))` |

## Common Pitfalls

- **Grid is single-column even on desktop** — `columns` value > 6, or you only set `default` and the auto-default doesn't kick in (it only kicks in when `columns` is **completely omitted**). Either omit `columns` entirely or pass full breakpoints.
- **Tailwind purged my custom `grid-cols-N`** — by design. Use the static maps; if you need `7+`, extend the maps in [ui/components/StatsCard/index.tsx](ui/components/StatsCard/index.tsx).
- **Icon doesn't appear** — passed JSX (`<Users />`) instead of the component (`Users`). Or icon is undefined (typo in lucide import).
- **Skeleton shows but no values** — `data` empty during loading. Use `getXxxStats(undefined)` so the array shape is stable.
- **"Cannot read properties of undefined (reading 'toLocaleString')"** — `value: undefined`. Default to `0` or `"-"` in your helper (`stats?.total || 0`).
- **Trend is always grey** — `direction` not set or misspelled. Must be exactly `"up" | "down" | "neutral"`.
- **Mini chart bars have zero height** — all values in `chart.data` are equal → `range` becomes `1` and heights compute to `0%`. Add a non-zero variation or skip the chart for flat data.
- **Description not rendering** — only renders when `stat.description` is truthy. Empty string is falsy.
- **`StatsCard` returns `null`** — only when `data` is `null`/`undefined` (the `if (!data) return null` guard). `[]` renders an empty grid (not null).
- **Cards congested / label text wraps despite a wide `columns.lg` or `.xl`** — a fixed sidebar (16rem) eats real width that viewport-based breakpoints don't know about. Switch to `minCardWidth` (see the dedicated procedure above) instead of adding more breakpoint steps.

## Imports

```ts
import StatsCard from "@/ui/components/StatsCard";
import type { StatData, StatsCardProps, StatVariant, TrendDirection } from "@/ui/components/StatsCard";
```
`StatsCard` is the **default export**. Types are named exports.

## Quick Reference (props)

### `StatsCardProps`
| Prop | Type | Default | Notes |
|---|---|---|---|
| `data` | `StatData[]` | required | Returns `null` if `undefined`. |
| `isLoading` | `boolean` | `false` | Renders skeletons matching each stat's fields. |
| `columns` | `{ default?, sm?, md?, lg?, xl? }` (1-6) | `{ default: 1, sm: 2, lg: data.length }` (only when prop omitted) | Static Tailwind maps, keyed off viewport width. |
| `minCardWidth` | `number` (px) | — | Opt-in `flex flex-wrap` mode sized off actual container width; ignored if `columns` is set. See "Responsive cards without breakpoint guessing" above. |

### `StatData`
| Field | Type | Notes |
|---|---|---|
| `label` | `string` | Required title text. |
| `value` | `number \| string` | Rendered via `.toLocaleString()`. |
| `icon` | `LucideIcon` | Pass component, not JSX. |
| `variant` | `StatVariant` | Defaults `"default"`. |
| `description` | `string` | Sub-line under label. |
| `prefix` / `suffix` | `string` | `$`, `%`, etc. |
| `trend` | `{ value, direction?, label?, higherIsBetter? }` | direction: `"up" \| "down" \| "neutral"`. `higherIsBetter: false` inverts the colour for cost metrics. |
| `chart` | `{ data: number[]; color?: string }` | Sparkline; `color` is a `bg-*` class. |
