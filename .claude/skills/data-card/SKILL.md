---
name: data-card
description: 'Build, edit, debug, or audit list pages in EzyCore frontend that use the self-contained DataCard component (card-grid alternative to DataTable, sharing CRUD/Filter/Pagination/DynamicForm wiring). USE WHEN: rendering a resource as cards instead of (or alongside) a table (brands/products grid view), choosing a built-in `variant` (`default` | `compact` | `detailed`), configuring `fields` (`isTitle` / `isSubtitle` / `isBadge` / `inFooter` / `span`), wiring `imageConfig` (src field or fn, aspect-ratio, avatar mode, fallback), customizing layout (`grid` | `list`, responsive `columns`, `gap`), passing a fully custom `renderCard`, providing a custom `loadingRenderCard` skeleton, sorting via toolbar dropdown (`sortingConfig`), bulk select + bulk delete, header / menu / footer customActions (NOTE: card customActions use `placement: "header" | "menu" | "footer"`, NOT `"cell"`), pagination/page-size selector, ViewToggle integration with DataTable using a shared `operations` object, troubleshooting "actions not appearing in card", "image broken", "sort dropdown missing", "footer fields not shown", "card not rerendering after layout change", custom card styling props ignored when using `renderCard`. Touches files under ui/components/dataCard/, types/DataCard.ts, hooks/use-crud-handlers.ts.'
---

# DataCard Skill

Self-contained card-grid built on the same primitives as `DataTable` (TanStack Query + DynamicForm + `useCrudModal`). Pass `operations` and the component handles fetching, paging, filtering, sorting, CRUD modals, bulk delete, error UI, URL filters, and 3 built-in card variants — or accept a fully custom `renderCard`.

## When to Use
- Need a card grid instead of a table for a resource (gallery / catalog / dashboard)
- Want both views: render `<DataTable>` and `<DataCard>` from the **same `operations` object** behind a `<ViewToggle>`
- Cards must show an image / avatar / status badge prominently
- Layout must switch between `grid` and `list` (toolbar layout switcher is built-in)
- You need full custom card markup (`renderCard` + `loadingRenderCard`)
- Server-side sort, bulk select, modals, filters — all via `operations` (same shape as DataTable)

## Files Map (read these before editing)

| File | Purpose |
|------|---------|
| [ui/components/dataCard/index.tsx](ui/components/dataCard/index.tsx) | `DataCard` — query, filter state, pagination state, CRUD modal, sort state |
| [ui/components/dataCard/base-data-card.tsx](ui/components/dataCard/base-data-card.tsx) | `BaseDataCard` — toolbar/grid/pagination glue, client-side search filter, selection, delete dialog |
| [ui/components/dataCard/card-variants.tsx](ui/components/dataCard/card-variants.tsx) | `CardItem` (variant switch), `DefaultCard`, `CompactCard`, `DetailedCard`, `CardImage`, `FieldRenderer`, `ActionButtons` (icons / dropdown / buttons), `CardEmptyState`, `CardSkeleton` |
| [ui/components/dataCard/toolbar.tsx](ui/components/dataCard/toolbar.tsx) | Search, sort dropdown, layout switcher, bulk delete, GlobalFilter, header customActions, Add button |
| [ui/components/dataCard/pagination.tsx](ui/components/dataCard/pagination.tsx) | Page size + numbered pager (mirror of DataTable's) |
| [types/DataCard.ts](types/DataCard.ts) | `DataCardProps`, `BaseDataCardProps`, `CardFieldConfig`, `CardImageConfig`, `CardCustomAction`, `DataCardAction`, `CardLayoutConfig`, `CardVariant`, `CardSize`, `CardSortingConfig` |
| [hooks/use-crud-handlers.ts](hooks/use-crud-handlers.ts) | `useCrudModal` (shared with DataTable) |
| [hooks/use-url-filters.ts](hooks/use-url-filters.ts) | URL → initial filters |
| [ui/components/dataCard/datacard-doc.md](ui/components/dataCard/datacard-doc.md) | Long-form reference |
| [ui/components/dataCard/DATACARD_PROPS_REFERENCE.md](ui/components/dataCard/DATACARD_PROPS_REFERENCE.md) | Exhaustive prop walk-through with examples |

## Procedure: Add a card view to a resource

1. Reuse the resource's `formConfig`, `defaultValues`, mutations and `getAllData` — **build a single `operations` object** so DataCard and DataTable can share it.
2. Pick a `variant`:
   - `default` — image on top, header (title/subtitle), 2-col body grid, footer
   - `compact` — horizontal row: avatar + title + badge + actions (great for `layout: "list"`)
   - `detailed` — hero image / gradient + title + bordered field rows + footer
3. Configure `fields: CardFieldConfig[]`. Each field is routed by flags:
   - `isTitle` → variant's title
   - `isSubtitle` → subtitle/description
   - `isBadge` → renders `<Badge variant={badgeVariant(value)}>`
   - `inFooter` → footer slot
   - `span: 2` → full-width body cell (default variant only)
   - none of the above → body field
4. Configure `imageConfig`: `src` (field key OR `(row) => string`), `aspectRatio`, `asAvatar`, `fallback`, `position`. For arrays, `CardImage` auto-extracts `value[0].thumbnail.url || value[0].url`.
5. Optional: `layoutConfig` (grid/list, responsive columns, gap).
6. Render with shared `operations`. Examples below.

## Procedure: Built-in vs custom card

**Built-in variant (use `fields` + `imageConfig`):**
```tsx
<DataCard
  variant="default"
  fields={[
    { key: "name", isTitle: true },
    { key: "category.name", isSubtitle: true },
    { key: "status", isBadge: true, badgeVariant: (v) => v === "active" ? "default" : "secondary" },
    { key: "price", label: "Price", render: (v) => `$${v}` },
    { key: "stock", label: "Stock" },
    { key: "createdAt", label: "Created", inFooter: true, render: (v) => new Date(v).toLocaleDateString() },
  ]}
  imageConfig={{ src: "images", aspectRatio: "video", alt: "name" }}
/>
```

**Fully custom card (`renderCard`):** complete control. **Styling props (`shadow`, `rounded`, `enableCardHover`, `cardClassName`) are NOT applied** — you handle them.
```tsx
renderCard={(row, { onView, onEdit, onDelete }) => (
  <div className="p-4 border rounded-lg bg-card">
    <h3>{row.name}</h3>
    <button onClick={onView}>View</button>
    <button onClick={onEdit}>Edit</button>
    <button onClick={onDelete}>Delete</button>
  </div>
)}
loadingRenderCard={() => <div className="h-40 animate-pulse bg-muted rounded-lg" />}
```

## Procedure: Share a single `operations` between DataTable and DataCard

```tsx
const operations = useMemo<Operations<Brand>>(() => ({
  getAllData: brandService.getAll,
  queryKey: queryKeys.brands.all(),
  formConfig: brandFormConfig,
  defaultValues: brandDefaultValues,
  createMutation: useCreateBrand(),
  updateMutation: useUpdateBrand(),
  deleteMutation: useDeleteBrand(),
  bulkDeleteMutation: useBulkDeleteBrands(),
  entityName: "Brand",
  isViewAvailable: true,
}), []);

return (
  <>
    <ViewToggle storageKey="brands" defaultView={view} onChange={setView} />
    {view === "table" && <DataTable columns={cols} operations={operations} ... />}
    {view === "card"  && <DataCard variant="default" fields={fields} imageConfig={img} operations={operations} ... />}
  </>
);
```

## Procedure: Sorting

Pass `sortingConfig` (uses `SortingConfig` from `types/DataTable.ts` shape — same as DataTable):
```ts
sortingConfig={{ sortOptions: [{ field: "name", label: "Name" }, ...], defaultSortBy: "createdAt", defaultSortOrder: "desc" }}
```
Toolbar shows a sort dropdown that sends `sort_by` + `sort_order` to `getAllData` and resets to page 1. There's no header to click — sorting is dropdown-only.

## Procedure: Custom Actions (placements differ from DataTable!)

`CardCustomAction.placement` is `"header" | "menu" | "footer"` — **NOT `"cell"`**.

| Placement | Where it appears |
|-----------|------------------|
| `header` | Toolbar (right side). `type: "create"` overrides the auto Add button. |
| `menu` | Inside each card's "..." dropdown (in `default`/`detailed` variants) or as an icon button (`compact` variant). Receives `row` in `onClick`. |
| `footer` | Currently a typed-but-not-rendered slot (UI does not render footer customActions today). |

```ts
customActions={[
  { type: "create", placement: "header", label: "Add Brand", icon: <Plus className="h-4 w-4 mr-2" />, href: "/brands/new" },
  { type: "duplicate", placement: "menu", label: "Duplicate", icon: <Copy className="h-4 w-4" />, onClick: (row) => duplicate(row._id), disabled: (row) => row.is_locked },
]}
```

## Procedure: Selection + bulk delete

`selectable` adds a checkbox per card (positioned by variant). When >0 selected and `actions.deletable` is true, the toolbar shows "Delete N" with a confirm dialog. If `bulkDeleteMutation` is on `operations`, it's called with the array of `_id`s; otherwise the component does nothing on click (DataCard does NOT fall back to one-by-one — supply `bulkDeleteMutation`).

## Procedure: Pagination — server vs client

- **Server-side**: provide `operations.getAllData` + `operations.queryKey`. Backend response shape required: `{ items, total, page, limit, totalPages, hasNext, hasPrev }`. `manualPagination: true`.
- **Client-side**: pass `data={...}` only (no `getAllData`). DataCard slices `filteredData` itself (`pageIndex * pageSize`, etc.). `pageSizes` defaults to `[6,12,24,48,96]`.

Default `defaultPageSize` is `12` (vs `10` for DataTable).

## Critical Conventions (DO / DON'T)

- **DO** type rows as `{ _id: string }` — selection and delete dialog rely on `_id`.
- **DO** memoize `operations`, `fields`, `imageConfig`, `layoutConfig` — `BaseDataCard` recomputes layout/filter/pagination on every render of new refs.
- **DO** when using `renderCard`, also pass `loadingRenderCard` — otherwise users see the default skeleton (which won't match your custom card).
- **DO** use `getNestedValue`-friendly keys for fields/image (`"category.name"`, `"images"` then array auto-extract).
- **DON'T** expect `customActions` `placement: "cell"` — that's DataTable's vocabulary. Use `"menu"` for per-card actions.
- **DON'T** rely on `placement: "footer"` for customActions — it's typed but unused in the rendered variants today.
- **DON'T** expect `customActions` to reach a custom `renderCard` AT ALL — `CardItem` forwards only `{ onEdit, onView, onDelete }`, at any `placement`. Inject the handler into the card's own props instead (`onToggleStatus` on the users card, `onApplyVat` on the categories card) and render it where the card's layout wants it.
- **DON'T** expect `cardClassName` / `shadow` / `rounded` / `enableCardHover` to apply when using `renderCard` — they only affect built-in variants.
- **DON'T** rely on `module` doing anything — typed but **deprecated / not implemented**.
- **DON'T** click a non-existent "view" action from `compact` if you didn't pass `isViewAvailable`. Compact variant uses the icons row, not a dropdown — actions only appear when their corresponding flag/mutation is provided.

## Field & Image Cheatsheet

`CardFieldConfig`: `key | label? | render? | isTitle? | isSubtitle? | isBadge? | badgeVariant? | inFooter? | hidden? | span?: 1|2`
`CardImageConfig`: `src (key | (row)=>string) | alt? | aspectRatio: "square"|"video"|"wide"|"portrait" | fallback (node | (row)=>node) | asAvatar? | position?: "top"|"left"|"right"|"background"` (note: only `top`/avatar fully wired; `background` skips the rendered image; `left`/`right` not specially handled)

`CardSize`: `"sm" | "md" | "lg"` — adjusts padding/spacing (compact variant uses different padding map than default/detailed).
`CardLayout`: `"grid" | "list"`.

## Variant Action Style

| Variant | Default actions UI |
|---------|--------------------|
| `default` | Dropdown ("...") in card header |
| `compact` | Inline icon row (Eye / Pencil / menu icons / Trash) |
| `detailed` | Dropdown overlaid on hero image |

(Override behavior by passing your own `renderCard`.)

## Common Pitfalls

- **No actions appear** — `actions` only render when `operations` provides the matching mutation (`updateMutation` → edit, `deleteMutation` → delete) or `isViewAvailable: true`.
- **`customActions` per row not appearing** — on a built-in variant: used `placement: "cell"`, switch to `"menu"`. **With a custom `renderCard`, no placement works** — they are never forwarded; inject the handler into the card instead. (This one shipped: the users card carried an Active/Inactive badge and no way to change it, because its Enable/Disable action was remapped to `"menu"` and reached nothing.)
- **Image broken / placeholder shown** — `src` field returned an array; `CardImage` extracts `value[0]?.thumbnail?.url || value[0]?.url`. If your shape differs, pass `src: (row) => extractUrl(row)`.
- **Footer row empty** — no fields with `inFooter: true`, OR you're on `compact` variant (compact has no footer).
- **`renderCard` cards have no shadow / hover** — by design. Apply your own classes.
- **Layout switcher missing** — `showLayoutSwitcher` defaults true, but only renders on `sm+` (hidden on mobile).
- **"List view" looks identical to grid** — `layout: "list"` only changes the wrapper to `flex flex-col gap-3`. Use `variant: "compact"` to actually get a list-style row.
- **Sort dropdown missing** — no `sortingConfig` (or no `getAllData` to back it).
- **Card grid not reflowing** — `layoutConfig.columns` Tailwind classes are dynamic strings (`grid-cols-${n}`). Tailwind's JIT must see them at build — these classes happen to be common (1-5) so they're picked up; if you use unusual numbers, safelist them.
- **`bulk delete` does nothing** — supply `operations.bulkDeleteMutation`. Unlike DataTable, DataCard does not fall back to one-by-one.
- **Card stuck on initial layout** — `layout` is local state seeded from `layoutConfig.layout`; DataCard syncs on `layoutConfig.layout` change via `useEffect`. Ensure you pass a stable object or just the changed property.

## References

- [./references/quick-start.md](./references/quick-start.md) — minimal new-card-page example
- [./references/recipes.md](./references/recipes.md) — variants, custom render, image patterns, shared operations with DataTable, sorting, bulk delete, list mode
- [./references/props-reference.md](./references/props-reference.md) — full `DataCardProps`, `Operations`, `CardFieldConfig`, `CardImageConfig`, `CardCustomAction`, `CardLayoutConfig`
- [ui/components/dataCard/datacard-doc.md](ui/components/dataCard/datacard-doc.md) and [ui/components/dataCard/DATACARD_PROPS_REFERENCE.md](ui/components/dataCard/DATACARD_PROPS_REFERENCE.md) — long-form reference
- [.claude/skills/data-table/SKILL.md](.claude/skills/data-table/SKILL.md) — sister skill (CRUD `Operations` shape and pitfalls are largely shared)
