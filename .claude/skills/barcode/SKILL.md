# Barcode (Frontend) — SKILL

> **Status**: IMPLEMENTED (B1–B6). Feature-gated by `user.organization.features.barcodeSystem`.
> Backend mirror: `inventory-backend/.claude/skills/barcode/SKILL.md`.

## Scope
- Capturing barcodes on Product form + per variant in Variant Manager (B2).
- Reactive + imperative TanStack Query lookup hook against `GET /products/lookup` (B1).
- Reusable primitives: keyboard-wedge `<BarcodeInput>`, camera `<BarcodeScanner>` (`@zxing/browser`), client-render `<BarcodeImage>` (`jsbarcode`), print-ready `<BarcodeLabelSheet>` (BE PNG via `<img>`).
- Scan-to-add-row on Sales (B3) + Purchases (B4) create pages.
- Print labels (single + bulk) from Products list (B5).
- Scan-to-inspect-stock on Inventory page (B6).

## File map

### Primitives — `components/shared/barcode/`
- `barcode-input.tsx` — `<BarcodeInput onScan>`. USB scanner detection: rapid keystrokes (< 30 ms apart) ending with Enter trigger `onScan(value)` and auto-clear. Also fires on manual Enter.
- `barcode-scanner.tsx` — `<BarcodeScanner onDetect>`. Lazy-loads `@zxing/browser`, prefers rear camera, debounces duplicate codes (1000 ms). Always cleans up via `controls.stop()` on unmount.
- `barcode-image.tsx` — `<BarcodeImage code symbology />`. Client-side render via `jsbarcode` on `<svg>`. **QR returns null** (caller should fall back to BE `imageUrl()`).
- `barcode-label-sheet.tsx` — `<BarcodeLabelSheet open items />`. The dialog: copies-per-item, label-size picker, variant checkboxes, live preview. Prints through `printHtml` (`utils/print.ts`) by copying the preview grid's `innerHTML` into a fresh document.
- `barcode-label-card.tsx` — one label (`<LabelCard>` + the internal `BarcodeCell`), rendered client-side with `jsbarcode`; **QR falls back to the code as monospace text** (jsbarcode has no QR). Exports `LabelItem`.
- `label-presets.ts` — the label-stock table (`LABEL_PRESETS`) + the style builders. See "Label stock presets" below.
- `index.ts` — barrel.

### API + hooks — `services/api/modules/barcode/`
- `api.ts` — `barcodeApi.lookup(code): Promise<ApiResponse<BarcodeLookupResult>>` and `barcodeApi.imageUrl(code, opts)` (absolute URL builder using `NEXT_PUBLIC_API_URL`).
- `hooks.ts`:
  - `useBarcodeLookup(code)` — reactive query, `staleTime: 0`, `retry: false`, unwraps via `select`.
  - `useBarcodeLookupAction()` — returns imperative `(code) => Promise<BarcodeLookupResult>` using `qc.fetchQuery` with `staleTime: 30_000` (so repeated scans of the same code are instant).
- `index.ts` — barrel.
- `services/api/query-keys.ts` — `queryKeys.barcode.lookup(code)`.

### Product form
- `components/products/form-config.tsx` — `barcode` (input, max 64, `dependsOn` productType=single) + `barcodeSymbology` (select, 5 options, default `CODE128`).
- `components/products/variant-manager.tsx` — VariantRow + EditModalData carry `barcode` + `barcodeSymbology`; Edit modal shows Barcode `<Input>` + conditional Symbology `<Select>` (5 options).
- `components/products/columns.tsx` — Barcode column shows the code, or "per-variant" for variable products, or "—".
- `hooks/use-filters.ts` — `useFilteredFormConfig` strips `barcode` + `barcodeSymbology` when `barcodeSystem` feature is off.

### Sales scan
- `components/sales/types.ts` + `components/sales/helpers.ts` — `ProductApiItem`/`ExtractedProduct` carry `barcode`.
- `components/sales/sell/use-sell-page.ts` — `handleBarcodeScan` callback (uses `useBarcodeLookupAction`); refuses when `!hasInventoryAtLocation`.
- `app/(protected)/sales/page.tsx` — `<BarcodeInput onScan={handleBarcodeScan} />` above ProductSearch, gated by feature flag.
- `components/sales/pos/pos-screen.tsx` (POS counter) — no separate scan field: `<ProductSearch onScan={handleBarcodeScan}>` is one box for both. `hooks/use-keyboard-wedge-scan.ts` holds the same < 30 ms timing rule as `<BarcodeInput>` for a box that also searches; Bangla digits (Avro/Bijoy on) go through `toWestern` (`lib/parse-bd-address.ts`). The counter is also the first user of `<BarcodeScanner>`, via `pos-camera-scan.tsx` (dialog stays open for a basket).

### Purchases scan
- `components/purchases/use-purchase-page.ts` — `handleBarcodeScan` adds a row to active seller's cart with qty 1.
- `app/(protected)/purchases/page.tsx` — `<BarcodeInput>` between SupplierForm and ProductForm, gated.

### Inventory scan
- `app/(protected)/inventory/page.tsx` — `<BarcodeInput>` above DataTable; on scan looks up code and toasts product name + qty at location.

### Label printing
- `app/(protected)/products/page.tsx` — per-row "Print label" customAction (cell placement). Opens `<BarcodeLabelSheet>` with that row's barcode(s) (handles variable products by emitting one label per variant w/ barcode).

## Label stock presets (`components/shared/barcode/label-presets.ts`)

A barcode label prints on physical stock, so a preset is **one label's size in mm** plus how it
tiles a page. The picker in the dialog writes the choice to `localStorage["barcode-label-preset"]`
— there is **no** backend setting; `receiptSettings.defaultPaperSize` is receipts (A4/80mm/58mm)
and has nothing to do with labels. Don't wire the two together.

| id | Label | `@page size` | Stock | Bar height |
|---|---|---|---|---|
| `a4-6` (default) | A4 sheet · 6 per row | `A4` | grid, 1.5 mm gap, cut guides | 8 mm |
| `a4-4` | A4 sheet · 4 per row | `A4` | grid, 2 mm gap, cut guides | 11 mm |
| `receipt80` | Receipt roll 80 mm · 2 per row | `80mm auto` | continuous, cut guides | 8 mm |
| `receipt58` | Receipt roll 58 mm · 1 per row | `58mm auto` | continuous, cut guides | 9 mm |
| `roll-50x25` | Label roll 50 × 25 mm | `50mm 25mm` | die-cut, 1/page, no guides | 9 mm |
| `roll-38x25` | Label roll 38 × 25 mm | `38mm 25mm` | die-cut, 1/page, no guides | 8 mm |
| `roll-40x30` | Label roll 40 × 30 mm | `40mm 30mm` | die-cut, 1/page, no guides | 10 mm |

**`continuous` ≠ `roll`, at any width.** A receipt printer feeds continuous paper — `auto` height,
labels run down the roll, merchant cuts them. A label printer is loaded with die-cut stock — the
page IS one label, a fixed rectangle. Sending `50mm 25mm` to an 80 mm receipt printer does not
print a 50 mm label; the paper never matches the page and the output scales or clips. The
`receipt80`/`receipt58` presets exist because the receipt printer is the one most merchants already
own, and their `@page` matches `thermal80`/`thermal58` in `utils/print-documents.ts` by design.

Three rules, each load-bearing:

1. **Preview and print read the same preset.** `labelGridStyle` (preview container) and
   `labelPrintStyles` (`#print-grid`) are built from one row, so the preview cannot promise a
   layout the printer doesn't produce. Adding a preset means adding a row, not a branch.
2. **Anything that must PRINT is inline on the card.** `printHtml` copies the preview grid's
   `innerHTML` into a fresh document that has no Tailwind — a `className` therefore lands there as
   a dead attribute. That is *used*: roll labels get their preview-only edge from a Tailwind
   `outline` class, so no border is printed onto die-cut stock, while the A4 cut guides are an
   inline `border` and do print.
3. **A4 and receipt cells size from the grid track** (`minHeight` only); a **die-cut label is
   pinned** to the exact stock size with an explicit `break-after: page` on every card **but the
   last** — a trailing `always` ejects a blank label. A continuous roll takes no breaks at all.

Mobile: `printHtml` strips a *named* `@page size` (A4) so the dialog's paper wins, but keeps a
*physical* one (`80mm auto`, `50mm 25mm`). Both roll kinds survive that path intact — see the
comment on `dialogPaperWins` in `utils/print.ts`.

## Wire contract (always reconcile with BE skill)

```ts
type BarcodeLookupResult = {
  _id: string | null;         // inventoryId — null when no inventory at active location
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  productId: string;
  variantId: string | null;
  unitName: string | null;
  saleUnitName: string | null;
  barcode?: string;
  hasInventoryAtLocation: boolean;
};
```

## UX rules
1. **Gate every entry point by `user.organization.features.barcodeSystem`.** Use `useAuthStore((s) => s.user?.organization?.features?.barcodeSystem)`.
2. **Toast on failure.** Lookup throws `ApiError` (404) for unknown codes — show the code in the message.
3. **Sales scan**: if `!hasInventoryAtLocation || !_id`, do NOT add to cart — show a friendly toast.
4. **Purchases scan**: same guard PLUS require an active seller (supplier) first.
5. **Label printing** renders client-side with `jsbarcode` (no auth header, no network round-trip per label — a 200-label sheet would otherwise be 200 requests). `barcodeApi.imageUrl()` remains the BE fallback for a **QR** label, which jsbarcode cannot draw; the sheet currently prints the code as text there instead.
6. **`@zxing/browser` is heavy** (~200 KB) — only import inside `<BarcodeScanner>`, NEVER at module top of a page.

## Pitfalls
- `apiClient.get<T>` returns `Promise<T>` (NOT `Promise<ApiResponse<T>>`). Always type as `Promise<ApiResponse<T>>` explicitly so hooks' `select` works.
- Empty barcode strings collide on the BE partial unique index — variant manager / form already normalize `"" → undefined`. **Do not change this.**
- Switching active location must invalidate `queryKeys.barcode.all()` — currently relies on the global "switch location → invalidate all location-scoped queries" handler. Confirm before adding any persisted barcode caches.
- Don't define BarcodeLabelSheet items array inline on each render — it makes the print preview re-mount and lose state.

## Maintenance discipline (MANDATORY)
Any PR touching the files above MUST in the same commit:
1. Update this skill.
2. Update `inventory-backend/.claude/skills/barcode/SKILL.md` if the wire contract changes.
3. Never let the skill drift from the code.
