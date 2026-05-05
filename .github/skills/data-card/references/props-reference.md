# DataCard Props Reference

## `<DataCard />` props (`DataCardProps<TData>`)

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `cardTitle` | `string \| (count) => string` | — | Heading. Function receives backend `total`. |
| `data` | `TData[]` | — | External data. Omit to use `operations.getAllData`. |
| `loading` | `boolean` | `false` | Force skeleton state. |
| `defaultPageSize` | `number` | `12` | Initial page size. |
| `pageSizes` | `number[]` | `[12,24,48,96]` (server) / `[6,12,24,48,96]` (client) | Page-size selector options. |
| `variant` | `"default" \| "compact" \| "detailed"` | `"default"` | Built-in card style. |
| `cardSize` | `"sm" \| "md" \| "lg"` | `"md"` | Padding/spacing scale. |
| `cardClassName` | `string \| (row) => string` | — | Extra classes (built-in variants only). |
| `enableCardHover` | `boolean` | `true` | Hover lift / scale (built-in only). |
| `rounded` | `"none" \| "sm" \| "md" \| "lg" \| "xl" \| "full"` | `"lg"` (default) / `"md"` (compact) / `"xl"` (detailed) | Border radius. |
| `shadow` | `"none" \| "sm" \| "md" \| "lg"` | `"sm"` / `"md"` (detailed) | Drop shadow. |
| `fields` | `CardFieldConfig<T>[]` | — | Field config (built-in variants). |
| `imageConfig` | `CardImageConfig<T>` | — | Image / avatar config. |
| `renderCard` | `(row, actions) => ReactNode` | — | Full custom card. Skips styling props. |
| `loadingRenderCard` | `() => ReactNode` | — | Per-card skeleton when using `renderCard`. |
| `layoutConfig` | `CardLayoutConfig` | grid / `{1,sm:2,lg:3,xl:4}` / `gap:md` | Layout. |
| `searchConfig` | `DataCardSearchConfig` | — | Client-side search (`globalSearch` or `searchableKey`). |
| `filterConfig` | `FilterConfig` | — | Filter drawer/popover (same as DataTable). |
| `sortingConfig` | `SortingConfig` (from `types/DataTable.ts`) | — | Toolbar sort dropdown. |
| `selectable` | `boolean` | `false` | Per-card checkbox + bulk actions. |
| `onSelectionChange` | `(rows) => void` | — | Selection callback. |
| `toolbarAction` | `{ label, icon?, onClick, variant? }` | — | Single primary toolbar button (overridden by `customActions[type=create,placement=header]`). |
| `customActions` | `CardCustomAction[]` | — | Header / menu / footer actions. |
| `operations` | `Operations<TData>` | — | CRUD config (same shape as DataTable). |
| `emptyState` / `emptyMessage` / `emptyIcon` | `ReactNode` / `string` / `ReactNode` | — | Empty state. |
| `module` | `string` | — | **Deprecated / not implemented.** |

## `Operations<TData>` (same as DataTable)

| Field | Effect |
|-------|--------|
| `getAllData(params)` | Server fetcher. Receives `{ page (1-based), limit, ...filters, sort_by?, sort_order? }`. |
| `queryKey` | Base TanStack key. Final = `[...queryKey, { page, limit, ...filters, sort_by, sort_order }]`. |
| `createMutation` | Enables auto Add button. |
| `updateMutation` | Enables Edit action + opens form on edit. |
| `deleteMutation` | Enables Delete action + bulk delete confirm. |
| `bulkDeleteMutation` | Enables real bulk delete (no fallback in DataCard). |
| `formConfig` + `defaultValues` | Drives internal `<DynamicForm>`. |
| `entityName` | Auto labels: `Add {n}`, `Edit {n}`, `{n} Details`, default tooltips. |
| `isViewAvailable` | Show View action (eye), opens form in `viewMode={true}`. |
| `editTooltip` / `deleteTooltip` / `viewTooltip` | Override tooltips. |
| `transformEditData(item)` | API → form values. |
| `prepareSubmitData(data, isEdit, item)` | Form → backend payload. `id` auto-injected for edit (object or FormData). |
| `openInside` | `"modal"` (default) or `"drawer"`. |
| `disabledFieldsInEdit` | Lock fields in edit. |

## `CardFieldConfig<T>`

| Field | Type | Notes |
|-------|------|-------|
| `key` | `keyof T \| string` | Supports dot-paths (`"category.name"`). |
| `label` | `string` | Display label (omitted = no label). |
| `render` | `(value, row) => ReactNode` | Overrides default rendering. |
| `isTitle` | `boolean` | Routes to title slot. |
| `isSubtitle` | `boolean` | Routes to subtitle slot. |
| `isBadge` | `boolean` | Renders `<Badge variant={badgeVariant(value) ?? "secondary"}>`. |
| `badgeVariant` | `(value) => "default"\|"secondary"\|"destructive"\|"outline"` | Dynamic badge variant. |
| `inFooter` | `boolean` | Routes to footer slot (default + detailed). |
| `hidden` | `boolean` | Skip from rendering (still searchable). |
| `span` | `1 \| 2` | Body grid column span (default variant only). |

Field routing per variant:
| Variant | title | subtitle | body fields | footer | badge slot |
|---|---|---|---|---|---|
| default  | ✓ | ✓ | grid (2-col) | ✓ | (badge fields render inline) |
| compact  | ✓ | ✓ | — | — | first `isBadge` field next to title |
| detailed | ✓ | ✓ | bordered rows | ✓ | (badge fields render inline) |

## `CardImageConfig<T>`

| Field | Type | Notes |
|-------|------|-------|
| `src` | `keyof T \| (row) => string` | If field value is array → auto extracts `[0].thumbnail.url \|\| [0].url`. |
| `alt` | `keyof T \| string` | If string contains `.`, treated as a path; else literal. |
| `aspectRatio` | `"square" \| "video" \| "wide" \| "portrait"` | Default `"video"`. |
| `fallback` | `ReactNode \| (row) => ReactNode` | Shown when `src` empty. |
| `asAvatar` | `boolean` | Circular 12×12 avatar. |
| `position` | `"top" \| "left" \| "right" \| "background"` | `"background"` skips render. `"left"`/`"right"` not specially placed (treated as `top` in default). Compact variant always renders avatar regardless. |

## `CardLayoutConfig`

```ts
{
  layout?: "grid" | "list";
  columns?: { default: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: "sm" | "md" | "lg";   // gap-2 / gap-4 / gap-6
}
```
`list` → `flex flex-col gap-3` (column count ignored).
`grid` → `grid grid-cols-${default} sm:grid-cols-${sm} ...` (Tailwind JIT must see these classes).

## `CardCustomAction`

```ts
{
  type: "edit" | "view" | "delete" | "create" | string;
  placement: "header" | "footer" | "menu";   // ⚠ NOT "cell"
  href?: string | (row?) => string;
  onClick?: (row?) => void;
  icon?: ReactNode;
  label?: string;
  tooltip?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  render?: (row?) => ReactNode;
  disabled?: boolean | (row) => boolean;
}
```
Routing:
- `placement: "header"` → toolbar (right side). `type: "create"` replaces auto Add button.
- `placement: "menu"` → per-card dropdown (default/detailed) or icon row (compact). Receives `row` in `onClick` and `disabled`.
- `placement: "footer"` → typed but **not rendered** in any current variant.

## `DataCardSearchConfig`

```ts
{
  globalSearch?: boolean;        // search across all configured fields, falls back to all string values
  searchableKey?: keyof T;       // search a specific field
  placeholder?: string;
}
```
**Client-side filter** applied on top of fetched page. For server-side search use a text `FilterField`.

## `DataCardAction` (internal — produced from `operations`)

```ts
{
  editable?: boolean | { tooltip?: string };
  deletable?: boolean | { tooltip?: string };
  viewable?: boolean | { tooltip?: string };
  custom?: Array<{ label, icon?, tooltip?, onClick, variant? }>;  // (legacy, prefer customActions)
}
```

## Backend response (required for self-contained mode)

```ts
{
  success: true,
  data: {
    items: T[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean,
  }
}
```

## Subcomponent exports (for advanced usage)

```ts
import { DataCard, BaseDataCard, CardItem, CardEmptyState, CardSkeleton } from "@/ui/components/dataCard";
```
- `BaseDataCard` — render your own header/CRUD wiring around the grid + toolbar + pagination.
- `CardItem` — single card (variant switch + `renderCard` override).
- `CardSkeleton({ variant, count })` — built-in loading skeletons.
- `CardEmptyState({ message, icon, children })` — built-in empty UI.
