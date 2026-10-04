import { describe, expect, it } from "vitest";
import { showsOnProduct } from "../product-targets";

const CUSHIONS = "64b7f0c2a1b2c3d4e5f60720";
const COVERS = "64b7f0c2a1b2c3d4e5f60721";
const MATS = "64b7f0c2a1b2c3d4e5f60722";
const EID = "64b7f0c2a1b2c3d4e5f60730";

const cover = { categoryId: CUSHIONS, subcategoryId: COVERS, tags: [{ _id: EID, name: "Eid" }] };
const mat = { categoryId: MATS, subcategoryId: null, tags: [] };

describe("showsOnProduct", () => {
  it("shows a section with no limit on every product, and anywhere without one", () => {
    expect(showsOnProduct(undefined, mat)).toBe(true);
    expect(showsOnProduct({}, mat)).toBe(true);
    expect(showsOnProduct({ categories: [MATS] }, undefined)).toBe(true);
  });

  it("reaches every product under a top-level category, and only its own under a sub-category", () => {
    expect(showsOnProduct({ categories: [CUSHIONS] }, cover)).toBe(true);
    expect(showsOnProduct({ categories: [COVERS] }, cover)).toBe(true);
    expect(showsOnProduct({ categories: [CUSHIONS] }, mat)).toBe(false);
  });

  it("matches a product carrying any of the tags", () => {
    expect(showsOnProduct({ tags: [EID] }, cover)).toBe(true);
    expect(showsOnProduct({ tags: [EID] }, mat)).toBe(false);
  });
});
