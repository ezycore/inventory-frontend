# Barcode (Frontend) — SKILL

> **Status**: IMPLEMENTED (B1–B6). Feature-gated by `user.organization.features.barcodeSystem`.
> Backend mirror: `easystock-backend/.claude/skills/barcode/SKILL.md`.

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
- `barcode-label-sheet.tsx` — `<BarcodeLabelSheet open items />`. 3-column print grid using `barcodeApi.imageUrl()` (BE PNG, works for ALL symbologies inc. QR). Print stylesheet hides all chrome and shows only `#barcode-print-area`. Configurable copies-per-item.
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

### Purchases scan
- `components/purchases/use-purchase-page.ts` — `handleBarcodeScan` adds a row to active seller's cart with qty 1.
- `app/(protected)/purchases/page.tsx` — `<BarcodeInput>` between SupplierForm and ProductForm, gated.

### Inventory scan
- `app/(protected)/inventory/page.tsx` — `<BarcodeInput>` above DataTable; on scan looks up code and toasts product name + qty at location.

### Label printing
- `app/(protected)/products/page.tsx` — per-row "Print label" customAction (cell placement). Opens `<BarcodeLabelSheet>` with that row's barcode(s) (handles variable products by emitting one label per variant w/ barcode).

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
5. **Label printing**: always go through `barcodeApi.imageUrl()` — never bundle QR generation client-side (jsbarcode does not do QR).
6. **`@zxing/browser` is heavy** (~200 KB) — only import inside `<BarcodeScanner>`, NEVER at module top of a page.

## Pitfalls
- `apiClient.get<T>` returns `Promise<T>` (NOT `Promise<ApiResponse<T>>`). Always type as `Promise<ApiResponse<T>>` explicitly so hooks' `select` works.
- Empty barcode strings collide on the BE partial unique index — variant manager / form already normalize `"" → undefined`. **Do not change this.**
- Switching active location must invalidate `queryKeys.barcode.all()` — currently relies on the global "switch location → invalidate all location-scoped queries" handler. Confirm before adding any persisted barcode caches.
- Don't define BarcodeLabelSheet items array inline on each render — it makes the print preview re-mount and lose state.

## Maintenance discipline (MANDATORY)
Any PR touching the files above MUST in the same commit:
1. Update this skill.
2. Update `easystock-backend/.claude/skills/barcode/SKILL.md` if the wire contract changes.
3. Never let the skill drift from the code.
