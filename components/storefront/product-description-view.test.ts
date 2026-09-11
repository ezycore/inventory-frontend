// coding-standard: maintained
/**
 * Where a product description renders is a conversion decision, not a styling
 * one: a body with headings and a size-chart table above the buy panel pushes
 * Add to Cart off a phone screen. These pin the rule that decides it.
 */
import { describe, expect, it } from "vitest";
import { isLongDescription } from "./product-description-view";

const doc = (...content: any[]) => JSON.stringify({ type: "doc", content });
const para = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

describe("isLongDescription", () => {
  it("is false for nothing", () => {
    expect(isLongDescription(undefined)).toBe(false);
    expect(isLongDescription(null)).toBe(false);
    expect(isLongDescription("")).toBe(false);
  });

  it("keeps a short plain description inline", () => {
    expect(isLongDescription("Cotton, full sleeve")).toBe(false);
    expect(isLongDescription(doc(para("Cotton, full sleeve")))).toBe(false);
  });

  it("moves long prose below", () => {
    expect(isLongDescription("x".repeat(281))).toBe(true);
  });

  /**
   * Structure, not length, is the real trigger — 40 characters arranged as a
   * heading plus a table is what breaks the layout, and length alone would miss
   * it entirely.
   */
  it.each([
    ["heading", { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Care" }] }],
    ["table", { type: "table", content: [] }],
    ["bulletList", { type: "bulletList", content: [] }],
    ["callout", { type: "callout", content: [] }],
    ["horizontalRule", { type: "horizontalRule" }],
  ])("moves a short body containing a %s below", (_label, block) => {
    expect(isLongDescription(doc(para("Short."), block))).toBe(true);
  });

  it("treats several short paragraphs as still inline", () => {
    expect(isLongDescription(doc(para("One."), para("Two.")))).toBe(false);
  });
});
