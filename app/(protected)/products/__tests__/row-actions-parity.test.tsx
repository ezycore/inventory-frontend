// coding-standard: maintained

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Both view branches of `/products` get the same per-row actions.
 *
 * The shared component was fixed first — `CardItem` binds `placement: "cell"`
 * actions and forwards them, `ProductCard` renders them — and Print Label was
 * *still* missing from card view, because the page declared the action inline
 * on `<DataTable>` and passed nothing to `<DataCard>`. `actions.customActions`
 * arrived empty every time, so the unit tests passed and the running app did
 * not (QA-T1-E).
 *
 * That is the sibling-divergence pattern one level down: not two files, but the
 * table and card branches of one page. The fix is a single hoisted `rowActions`
 * const both branches spread, and this test defends the shape rather than the
 * behaviour — the failure was never "the card renders it wrong", it was "the
 * page never handed it over", which no amount of component testing can see.
 *
 * A source-shape assertion is the honest tool here. Rendering the page would
 * need the whole DataTable/DataCard/query stack stood up to prove one prop is
 * passed, and would still not catch the next page that forgets.
 */
const source = readFileSync(
  join(process.cwd(), "app/(protected)/products/page.tsx"),
  "utf8",
);

describe("products page — row actions reach both views", () => {
  it("declares the row actions exactly once", () => {
    // Two literals kept in sync is the bug coming back on the next edit.
    expect(source.match(/placement: "cell"/g)).toHaveLength(1);
    expect(source).toContain("const rowActions =");
  });

  it("hands them to both branches", () => {
    // Folded once, with the bulk header tools, into `pageActions`; both views
    // must take that one list rather than a literal of their own.
    expect(source).toContain("const pageActions = [...(rowActions ?? []), ...bulk.headerActions]");
    expect(source.match(/customActions=\{pageActions\}/g)).toHaveLength(2);
  });

  it("hands the bound actions on to the card that renders them", () => {
    // `CardItem` binds them per row; `ProductCard` puts them in its kebab.
    expect(source).toContain("customActions={actions.customActions}");
  });

  it("still gates them on the barcode capability", () => {
    expect(source).toContain("const rowActions = barcodeEnabled");
  });
});
