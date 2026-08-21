// coding-standard: maintained

import { describe, expect, it } from "vitest";
import {
  categoryTileRowLayout,
  resolveCategoryRowLayout,
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
        layout: "grid",
        columns: 5,
        align: "right",
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

  it("uses the same safe scrolling-strip behavior as category chips", () => {
    const result = categoryTileRowLayout(
      {
        layout: "strip",
        columns: 4,
        align: "center",
        columnsExplicit: true,
      },
      150,
      210,
    );

    expect(result.className).toBeUndefined();
    expect(result.strip).toBe(true);
    expect(result.style).toMatchObject({
      "--tile-max": "210px",
      display: "flex",
      overflowX: "auto",
      justifyContent: "safe center",
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
