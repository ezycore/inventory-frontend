# Barcode (Frontend) — SKILL

> **Status**: PLANNED — not yet implemented. Master plan: `easystock-backend/docs/ai/BARCODE_AND_EXPIRY_PLAN.md`.
> Backend mirror: `easystock-backend/.github/skills/barcode/SKILL.md`.

## Scope
Frontend barcode UX:
- Reusable scanner primitives (camera via `@zxing/browser` + USB-keyboard scanner detection).
- Barcode field on product / variant forms.
- Scan-to-add on sell page.
- Scan-to-add-row on purchase create.
- Label printing (per row + bulk from selection).
- All UI surfaces gated by `useOrganizationFeatures().barcodeSystem`.

## Touched files (planned)
```
components/shared/barcode/
  barcode-scanner.tsx       # camera + scanner detection, props: onDetected, continuous, formats
  barcode-input.tsx         # input that distinguishes scanner (fast keys + Enter) vs human typing
  barcode-image.tsx         # jsbarcode preview OR <img> from BE endpoint
  barcode-label-sheet.tsx   # printable A4 / sticker sheet layout
  use-barcode-lookup.ts     # standalone TanStack useQuery → /products/lookup
services/api/modules/barcode/{api.ts,hooks.ts,index.ts}
services/api/query-keys.ts                              # + queryKeys.barcode
components/products/form-config.tsx                     # + barcode + altBarcodes (gated)
components/products/variant-manager/*                   # per-variant barcode
components/products/columns.tsx                         # + Barcode column + Print action
components/sales/sell/*                                 # toolbar BarcodeInput + scan handler
components/purchases/create-purchase-order.tsx          # toolbar BarcodeInput
app/(protected)/inventory/page.tsx                      # scan button
package.json                                            # + @zxing/browser @zxing/library jsbarcode
```

## Cleanup in same PR
Drop dead `.sku` references:
- `components/inventory/stock-movement/columns.tsx`
- `components/inventory/stats.ts` (rebrand label "SKUs" → "Variants")
- `components/reports/valuation-report.tsx`

## Key rules (refine as code lands)
1. Every barcode UI surface wrapped in `useOrganizationFeatures().barcodeSystem`. Do NOT lazy-import the scanner at top level — heavy.
2. `BarcodeInput` detects scanner mode when keystrokes are < 30ms apart AND end with `Enter`. Otherwise it's normal typed input — do NOT auto-submit on every keystroke.
3. Lookup uses TanStack `useQuery` with `enabled: !!code` and `staleTime: 0` (each scan is fresh). Cache key: `queryKeys.barcode.lookup(code)`.
4. Continuous scan (mobile camera) debounces the SAME code for 1000ms so one barcode doesn't add 10 items.
5. On lookup 404: toast + visual fail signal (red border flash + optional `Audio` ping if user allowed sound). Do NOT silently no-op.
6. Camera access requires user gesture (button click). Handle `NotAllowedError` with a clear message.
7. Print uses `window.print()` on a portal-rendered `BarcodeLabelSheet`. Page CSS uses `@media print { ... }` — keep app chrome hidden.

## TanStack Query
```ts
// services/api/modules/barcode/hooks.ts
export const useBarcodeLookup = (code: string) =>
  useQuery({
    queryKey: queryKeys.barcode.lookup(code),
    queryFn: () => barcodeApi.lookup(code),
    enabled: !!code,
    staleTime: 0,
    retry: false,
    select: (d) => d.data,
  });
```

## Pitfalls
- Don't put `BarcodeScanner` inside a `DialogContent` that mounts the video element conditionally — zxing needs a stable ref; mount/unmount cycles leak camera streams. Always call the cleanup on unmount.
- Mobile Safari requires `<video playsinline muted>` — set both.
- `@zxing/browser` adds ~250KB gz. Lazy-import inside `BarcodeScanner` only.
- The sell page already manages its own cart store (Zustand). Scan handler MUST go through the same `addItem` action — don't bypass.

## Maintenance discipline (MANDATORY once code lands)
Any PR touching the files listed above MUST in the same commit:
1. Update this skill.
2. Update `easystock-backend/.github/skills/barcode/SKILL.md` if the wire contract changes.
3. Update `BARCODE_AND_EXPIRY_PLAN.md` if scope/phasing changes.

Never let the skill drift from the code. Either both move or neither moves.
