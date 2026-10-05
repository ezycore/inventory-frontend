import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRODUCT_PARTS,
  buyingOrderHolds,
  productParts,
  type ProductPartSettings,
} from "../product-parts";
import { PRODUCT_PARTS, SECTION_SPECS } from "../section-specs";

const block = (id: string, settings: ProductPartSettings) => ({ id, settings });
const kinds = (parts: { part: string }[]) => parts.map(({ part }) => part);

describe("productParts", () => {
  it("draws the column as it always was when nothing is stored", () => {
    expect(kinds(productParts())).toEqual([...DEFAULT_PRODUCT_PARTS]);
    expect(kinds(productParts([]))).toEqual([...DEFAULT_PRODUCT_PARTS]);
  });

  it("keeps the stored order and leaves hidden parts out", () => {
    const parts = productParts([
      block("a", { part: "price" }),
      block("b", { part: "name" }),
      block("c", { part: "badges", hidden: true }),
      block("d", { part: "options" }),
      block("e", { part: "buy" }),
    ]);
    expect(kinds(parts)).toEqual(["price", "name", "options", "buy"]);
    expect(parts.map(({ key }) => key)).toEqual(["a", "b", "d", "e"]);
  });

  it("never hides the ways to order", () => {
    const parts = productParts([block("o", { part: "options", hidden: true }), block("b", { part: "buy", hidden: true })]);
    expect(kinds(parts)).toEqual(["options", "buy"]);
  });

  it("draws a single part once, at its first place, but lets text repeat", () => {
    const parts = productParts([
      block("1", { part: "buy" }),
      block("2", { part: "text", text: "one" }),
      block("3", { part: "buy" }),
      block("4", { part: "text", text: "two" }),
      block("5", { part: "options" }),
    ]);
    expect(kinds(parts)).toEqual(["buy", "text", "text", "options"]);
  });

  it("puts back buy buttons and options a stored list lost", () => {
    expect(kinds(productParts([block("n", { part: "name" })]))).toEqual(["name", "options", "buy"]);
    expect(kinds(productParts([block("n", { part: "name" }), block("b", { part: "buy" }), block("d", { part: "delivery" })])))
      .toEqual(["name", "options", "buy", "delivery"]);
  });

  it("carries a part's own settings through", () => {
    const [fold] = productParts([block("f", { part: "collapsible", title: "Size chart", text: "{}", open: true })]);
    expect(fold).toMatchObject({ part: "collapsible", title: "Size chart", text: "{}", open: true, key: "f" });
  });
});

describe("buyingOrderHolds", () => {
  it("accepts options and quantity above the buy buttons, anywhere", () => {
    expect(buyingOrderHolds([{ part: "options" }, { part: "price" }, { part: "quantity" }, { part: "buy" }])).toBe(true);
    expect(buyingOrderHolds([{ part: "name" }])).toBe(true);
  });

  it("refuses either below them", () => {
    expect(buyingOrderHolds([{ part: "buy" }, { part: "options" }])).toBe(false);
    expect(buyingOrderHolds([{ part: "options" }, { part: "buy" }, { part: "quantity" }])).toBe(false);
  });
});

describe("the stored vocabulary", () => {
  it("is the spec's", () => {
    expect(SECTION_SPECS["product-main"].blocks.settings.part.values).toBe(PRODUCT_PARTS);
  });

  it("starts with the default column, in its order", () => {
    expect(PRODUCT_PARTS.slice(0, DEFAULT_PRODUCT_PARTS.length)).toEqual([...DEFAULT_PRODUCT_PARTS]);
  });
});
