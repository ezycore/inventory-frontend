# DataCard Recipes

## Variants — pick one

```tsx
<DataCard variant="default"  ... />  // image top, title/subtitle, 2-col body, footer
<DataCard variant="compact"  ... />  // horizontal: avatar + title + badge + actions
<DataCard variant="detailed" ... />  // hero image + bordered field rows + footer
```

## Custom render (full control)

```tsx
<DataCard
  data={members}
  renderCard={(row, { onView, onEdit, onDelete }) => (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl text-white">
      <img src={row.avatar} className="w-16 h-16 rounded-full" />
      <h3 className="font-bold">{row.name}</h3>
      <p className="text-white/80">{row.role}</p>
      <button onClick={onView}>Profile</button>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Remove</button>
    </div>
  )}
  loadingRenderCard={() => (
    <div className="bg-gradient-to-br from-purple-200 to-pink-200 p-6 rounded-2xl h-48 animate-pulse" />
  )}
  operations={memberOperations}
/>
```
**Reminder**: `cardClassName`, `shadow`, `rounded`, `enableCardHover` are ignored when `renderCard` is provided.

## Image patterns

```ts
// Simple key
imageConfig={{ src: "imageUrl", aspectRatio: "square" }}

// Pick from array of {thumbnail|url}
imageConfig={{ src: "images" /* auto extracts images[0].thumbnail.url || images[0].url */ }}

// Custom resolver
imageConfig={{ src: (row) => row.variants?.[0]?.image?.thumbnail?.url ?? "/placeholder.png", alt: "name" }}

// Avatar (circular, 12x12) — used automatically by `compact` variant when image present
imageConfig={{ src: "avatar", asAvatar: true, fallback: (r) => r.name.charAt(0) }}

// Background-only (no image rendered)
imageConfig={{ src: "image", position: "background" }}
```

## Field rendering tricks

```ts
fields={[
  { key: "name", isTitle: true },

  // Dot path
  { key: "category.name", isSubtitle: true },

  // Badge with dynamic variant
  { key: "stock_status", isBadge: true, badgeVariant: (v) => v === "in_stock" ? "default" : "destructive" },

  // Custom render
  { key: "price", label: "Price", render: (v, row) => <strong>{row.currency} {v.toFixed(2)}</strong> },

  // Full-width body cell (default variant only)
  { key: "description", label: "Description", span: 2 },

  // Footer
  { key: "createdAt", label: "Created", inFooter: true, render: (v) => format(new Date(v), "PP") },

  // Hidden (for global search only)
  { key: "internal_code", hidden: true },
]}
```

Defaults when no `render`:
- Array → `"{n} items"`
- Object → `JSON.stringify(value)`
- Boolean → `<Badge>Yes/No</Badge>`
- Else → `String(value ?? "-")`

## Sorting (toolbar dropdown)

```tsx
sortingConfig={{
  sortOptions: [
    { field: "name",      label: "Name" },
    { field: "createdAt", label: "Created" },
    { field: "price",     label: "Price" },
  ],
  defaultSortBy: "createdAt",
  defaultSortOrder: "desc",
}}
```
Backend gets `?sort_by=...&sort_order=...`. The toolbar shows an `ArrowUpDown` button → menu of options → toggling the same option flips direction → "Clear sort" entry resets.

## Custom actions

Card placements: `header` · `menu` · `footer` (typed but unused at runtime).

```ts
customActions={[
  // Header buttons (toolbar)
  { type: "create", placement: "header", label: "Add Brand", icon: <Plus className="h-4 w-4 mr-2" />, href: "/brands/new" },
  { type: "export", placement: "header", label: "Export",    icon: <Download className="h-4 w-4 mr-2" />, variant: "outline", onClick: exportCsv },

  // Per-card menu (dropdown in default/detailed; inline icon row in compact)
  { type: "duplicate", placement: "menu", label: "Duplicate", icon: <Copy className="h-4 w-4" />, onClick: (row) => duplicate(row._id) },
  { type: "archive",   placement: "menu", label: "Archive",   icon: <Archive className="h-4 w-4" />, onClick: (row) => archive(row._id), disabled: (row) => row.status === "archived" },
]}
```

## Layout — list mode + compact variant

```tsx
<DataCard
  variant="compact"
  layoutConfig={{ layout: "list" }}   // forces flex-col, gap-3
  // hides toolbar layout switcher row on mobile only by design
/>
```
The toolbar's grid/list toggle remains usable on `sm+`.

## Both views (DataTable + DataCard) toggled by user

```tsx
const operations = useMemo(() => ({...}), []);
const [view, setView] = useState<"table"|"card">("table");

return (
  <>
    <ViewToggle storageKey="brands" defaultView={view} onChange={setView} />
    {view === "table" && <DataTable columns={cols} operations={operations} ... />}
    {view === "card"  && (
      <DataCard
        variant="default"
        layoutConfig={{ layout: "grid", columns: { default: 1, sm: 2, lg: 3 }, gap: "md" }}
        fields={brandCardFields}
        imageConfig={brandCardImage}
        operations={operations}
      />
    )}
  </>
);
```

## File upload (same as DataTable)

`prepareSubmitData` and `transformEditData` live on `operations` and are passed through to the internal `DynamicForm`. See [.claude/skills/data-table/references/recipes.md](../../data-table/references/recipes.md#file-upload-via-preparesubmitdata).

## Empty state

```tsx
// Quick
<DataCard emptyMessage="No brands found" emptyIcon={<Tag className="h-12 w-12" />} />

// Full custom
<DataCard emptyState={
  <div className="py-12 text-center">
    <Package className="h-20 w-20 mx-auto text-gray-300" />
    <h3 className="mt-4 font-semibold">No products yet</h3>
    <Button className="mt-4" onClick={openAdd}>Add Product</Button>
  </div>
} />
```

## Bulk delete

```tsx
<DataCard
  selectable
  operations={{ ..., bulkDeleteMutation: useBulkDeleteBrands() }}
/>
```
Delete button appears in toolbar when ≥1 card selected. Without `bulkDeleteMutation`, the bulk button does nothing (DataCard does not loop one-by-one).

## Selection callback

```tsx
<DataCard
  selectable
  onSelectionChange={(rows) => console.log("selected:", rows)}
/>
```

## Disable hover & shadow

```tsx
<DataCard enableCardHover={false} shadow="none" rounded="md" />
```
