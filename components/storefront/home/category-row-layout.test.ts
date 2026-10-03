// coding-standard: maintained

import { describe, expect, it } from "vitest";
import { categoryLabelsVisible } from "@/lib/storefront-templates";
import {
  categoryTileRowLayout,
  type CategoryRowLayout,
  stripEdges,
  stripStep,
} from "@/components/storefront/home/category-row-layout";

/** A row as the builder's `category-tiles` section builds it, defaults and all. */
const tileRow = (over: Partial<CategoryRowLayout> = {}): CategoryRowLayout => ({
  style: "card",
  layout: "grid",
  columns: 4,
  mobileColumns: 2,
  align: "left",
  showLabels: true,
  columnsExplicit: false,
  ...over,
});

describe("categoryTileRowLayout", () => {
  it("turns the shared grid setting into bounded tile-grid variables", () => {
    const result = categoryTileRowLayout(
      {
        style: "card",
        layout: "grid",
        columns: 5,
        mobileColumns: 3,
        align: "right",
        showLabels: true,
        columnsExplicit: true,
      },
      100,
      150,
    );

    expect(result).toEqual({
      className: "sf-cat-tiles sf-cat-tiles--controlled",
      style: {
        "--tile-min": "100px",
        "--tile-max": "150px",
        "--sf-ct-cols": 5,
        // The phone count rides out whether or not a desktop one was set: the
        // two are separate settings, and the phone rule reads only this.
        "--sf-ct-mcols": 3,
        "--sf-ct-justify": "end",
      },
      strip: false,
    });
  });

  it("hands a strip nothing but its tile variables", () => {
    const result = categoryTileRowLayout(
      {
        style: "card",
        layout: "strip",
        columns: 4,
        mobileColumns: 2,
        align: "center",
        showLabels: true,
        columnsExplicit: true,
      },
      150,
      210,
    );

    expect(result.className).toBeUndefined();
    expect(result.strip).toBe(true);
    // The flex track, its alignment and its scrolling belong to CategoryStrip;
    // leaving a stale copy here would give the arrows a container they do not
    // measure.
    expect(result.style).toEqual({
      "--tile-min": "150px",
      "--tile-max": "210px",
      "--sf-ct-mcols": 2,
    });
  });

  /* The phone count is its own setting, so an untouched shop still gets the two
     columns every phone drew before the control existed — and setting a desktop
     count must not move it. */
  it("keeps the phone column count independent of the desktop one", () => {
    const row = tileRow({ columns: 6, columnsExplicit: true });
    expect(categoryTileRowLayout(row, 96, 148).style).toMatchObject({
      "--sf-ct-mcols": 2,
    });
  });

  it("keeps a theme's unmodified tile grid adaptive", () => {
    const row = tileRow({ align: "center" });
    const result = categoryTileRowLayout(row, 100, 150);

    expect(result.className).toBe("sf-cat-tiles");
    expect(result.style).toMatchObject({
      "--tile-min": "100px",
      "--tile-max": "150px",
      "--sf-ct-justify": "center",
    });
    expect(result.style).not.toHaveProperty("--sf-ct-cols");
  });
});

describe("categoryLabelsVisible", () => {
  it("drops the names only when the merchant asked and every tile has a photo", () => {
    expect(categoryLabelsVisible(false, true)).toBe(false);
  });

  it("keeps the names when the merchant never asked", () => {
    expect(categoryLabelsVisible(true, true)).toBe(true);
  });

  it("overrides the setting for a part-photographed row", () => {
    // The tiles with no picture render as a letter, and a letter with no name
    // under it is a mystery box where a department should be. One shape for the
    // whole row beats a ragged one, even when it is not the shape asked for.
    expect(categoryLabelsVisible(false, false)).toBe(true);
  });
});

describe("stripEdges", () => {
  it("offers no arrow to a row that already fits", () => {
    expect(stripEdges(0, 600, 600)).toEqual({ start: false, end: false });
  });

  it("offers only the direction that has somewhere to go", () => {
    expect(stripEdges(0, 1200, 600)).toEqual({ start: false, end: true });
    expect(stripEdges(600, 1200, 600)).toEqual({ start: true, end: false });
    expect(stripEdges(300, 1200, 600)).toEqual({ start: true, end: true });
  });

  it("treats a sub-pixel rest position as an edge", () => {
    // Browser zoom parks scrollLeft just off the stop; without the tolerance one
    // arrow stays lit forever at a row the shopper cannot scroll any further.
    expect(stripEdges(0.5, 1200, 600)).toMatchObject({ start: false });
    expect(stripEdges(599.6, 1200, 600)).toMatchObject({ end: false });
  });
});

describe("stripStep", () => {
  it("moves a screenful rather than a tile", () => {
    expect(stripStep(1000)).toBe(800);
  });

  it("still clears a whole tile on the narrowest track", () => {
    expect(stripStep(80)).toBe(120);
  });
});
