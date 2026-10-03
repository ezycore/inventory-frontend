// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { ExtractedProduct } from "@/components/sales/types";
import {
  buildPosCatalog,
  sortGroups,
  UNCATEGORIZED,
  variantLabel,
  type ProductMeta,
} from "../pos-catalog";

const row = (over: Partial<ExtractedProduct>): ExtractedProduct => ({
  value: "inv",
  label: "Item",
  price: 10,
  costPrice: 5,
  availableQuantity: 10,
  productId: "p",
  variantId: null,
  quantityAlert: 0,
  ...over,
});

const ROWS = [
  row({ value: "i1", productId: "glv", variantId: "v7", label: "Surgical Gloves - 7", price: 45, availableQuantity: 84 }),
  row({ value: "i2", productId: "glv", variantId: "v75", label: "Surgical Gloves - 7.5", price: 45, availableQuantity: 150 }),
  row({ value: "i3", productId: "bp", label: "Omron BP Monitor", price: 4200, availableQuantity: 12 }),
  row({ value: "i4", productId: "msk", label: "Face Mask", price: 5, availableQuantity: 2400 }),
  row({ value: "i5", productId: "loose", label: "Unfiled item", price: 30, availableQuantity: 3 }),
];

const META = new Map<string, ProductMeta>([
  ["glv", { name: "Surgical Gloves", photo: "g.jpg", categoryId: "gp", categoryName: "Gloves & Protection", subcategoryId: "sg", subcategoryName: "Surgical gloves" }],
  ["msk", { name: "Face Mask", categoryId: "gp", categoryName: "Gloves & Protection", subcategoryId: "mc", subcategoryName: "Masks & caps" }],
  ["bp", { name: "Omron BP Monitor", photo: "bp.jpg", categoryId: "dd", categoryName: "Diagnostic Devices" }],
]);

describe("buildPosCatalog", () => {
  const { groups, categories } = buildPosCatalog(ROWS, META, "Other");

  it("folds a product's variants into one tile", () => {
    const gloves = groups.find((g) => g.key === "glv")!;
    expect(gloves.rows).toHaveLength(2);
    expect(gloves.stock).toBe(234);
    expect(gloves.name).toBe("Surgical Gloves");
    expect(gloves.photo).toBe("g.jpg");
  });

  it("builds categories from the products, with counts and sub-categories", () => {
    const gp = categories.find((c) => c.id === "gp")!;
    expect(gp.count).toBe(2);
    expect(gp.subs.map((s) => s.name)).toEqual(["Masks & caps", "Surgical gloves"]);
    expect(gp.photo).toBe("g.jpg");
  });

  it("puts products with no category under the catch-all, listed last", () => {
    expect(categories.map((c) => c.id)).toEqual(["dd", "gp", UNCATEGORIZED]);
    expect(categories.at(-1)!.name).toBe("Other");
  });

  it("reports no stock figure for a shop that does not count stock", () => {
    const { groups: untracked } = buildPosCatalog(
      [row({ productId: "x", tracked: false, availableQuantity: Number.MAX_SAFE_INTEGER })],
      new Map(),
      "Other",
    );
    expect(untracked[0].stock).toBeNull();
  });
});

describe("sortGroups", () => {
  const { groups } = buildPosCatalog(ROWS, META, "Other");

  it("sorts by price, cheapest first", () => {
    expect(sortGroups(groups, "priceLow").map((g) => g.key)).toEqual(["msk", "loose", "glv", "bp"]);
  });

  it("sorts by stock, lowest first", () => {
    expect(sortGroups(groups, "stockLow")[0].key).toBe("loose");
  });
});

describe("variantLabel", () => {
  it("keeps only the variant part of the row's name", () => {
    expect(variantLabel(ROWS[1], "Surgical Gloves")).toBe("7.5");
    expect(variantLabel(ROWS[2], "Something else")).toBe("Omron BP Monitor");
  });
});
