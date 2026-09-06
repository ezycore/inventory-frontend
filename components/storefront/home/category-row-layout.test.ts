// coding-standard: maintained

import { describe, expect, it } from "vitest";
import {
  categoryLabelsVisible,
  categoryTileRowLayout,
  resolveCategoryRowLayout,
  stripEdges,
  stripStep,
} from "@/components/storefront/home/category-row-layout";

describe("categoryTileRowLayout", () => {
  it("preserves each section's historical default until layout is explicit", () => {
    expect(resolveCategoryRowLayout({}, "strip")).toMatchObject({
      layout: "strip",
      columnsExplicit: false,
    });
    expect(resolveCategoryRowLayout({}, "grid")).toMatchObject({
      layout: "grid",
      columnsExplicit: false,
    });
    expect(resolveCategoryRowLayout({ layout: "strip" }, "grid").layout).toBe(
      "strip",
    );
  });

  it("turns the shared grid setting into bounded tile-grid variables", () => {
    const result = categoryTileRowLayout(
      {
        style: "card",
        layout: "grid",
        columns: 5,
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
    });
  });

  it("keeps a theme's unmodified tile grid adaptive", () => {
    const row = resolveCategoryRowLayout(
      { layout: "grid", align: "center" },
      "grid",
    );
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

describe("resolveCategoryRowLayout", () => {
  it("shows the names until a shop explicitly turns them off", () => {
    expect(resolveCategoryRowLayout({}, "strip").showLabels).toBe(true);
    expect(resolveCategoryRowLayout(undefined, "strip").showLabels).toBe(true);
    expect(
      resolveCategoryRowLayout({ showLabels: false }, "strip").showLabels,
    ).toBe(false);
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
