import { describe, expect, it } from "vitest";
import { categoryProductsHref } from "@/components/categories/helper";
import type { Category } from "@/types";

/**
 * The "N Products" link on a category row. The pair is denormalized — a product
 * stores its top-level category in `categoryId` and its child in
 * `subcategoryId` — so the level decides which param carries the id. Linking a
 * sub-category on `categoryId` matched nothing while the row reported a
 * non-zero count, which is the regression these cover.
 */
const category = (over: Partial<Category>): Category =>
  ({ _id: "child", name: "Serums", productCount: 3, ...over }) as Category;

describe("categoryProductsHref", () => {
  it("filters a top-level category on categoryId", () => {
    expect(categoryProductsHref(category({ _id: "top", parentId: null }))).toBe(
      "/products?categoryId=top",
    );
  });

  it("filters a sub-category on subcategoryId, with its parent alongside", () => {
    const href = categoryProductsHref(
      category({ parentId: "skin", parent: { _id: "skin", name: "Skin Care" } }),
    );
    expect(href).toBe("/products?categoryId=skin&subcategoryId=child");
  });

  it("reads the parent id from a populated parentId ref", () => {
    const href = categoryProductsHref(
      category({ parentId: { _id: "skin", name: "Skin Care" } }),
    );
    expect(href).toBe("/products?categoryId=skin&subcategoryId=child");
  });

  it("still narrows to the child when the parent lookup missed", () => {
    // A parent deleted out from under a child: `parentId` survives on the row,
    // `parent` does not. Falling back to the raw id keeps both params; losing
    // the child filter would silently widen the link to the whole branch.
    const href = categoryProductsHref(
      category({ parentId: "gone", parent: null }),
    );
    expect(href).toBe("/products?categoryId=gone&subcategoryId=child");
  });
});
