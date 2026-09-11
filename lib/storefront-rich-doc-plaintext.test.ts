// coding-standard: maintained
/**
 * The plain-text boundary for rich-doc values, mirrored from the backend's
 * `src/utils/__tests__/rich-doc.test.ts`. The two flatteners must agree: the
 * CSV column comes from the backend one and the meta description from this one,
 * and a merchant comparing them should not see two different texts.
 *
 * The assertion under every case: a LEGACY plain-text description must come back
 * as itself, not "". Product descriptions stay a mix of both shapes
 * indefinitely — CSV import creates plain ones.
 */
import { describe, expect, it } from "vitest";
import { plainTextToRichDoc, richDocToPlainText } from "./storefront-rich-doc";

const doc = (...content: any[]) => JSON.stringify({ type: "doc", content });
const para = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

describe("richDocToPlainText", () => {
  it("passes legacy plain text through untouched", () => {
    expect(richDocToPlainText("Cotton, full sleeve")).toBe("Cotton, full sleeve");
  });

  it("returns empty for nullish input", () => {
    expect(richDocToPlainText(null)).toBe("");
    expect(richDocToPlainText(undefined)).toBe("");
    expect(richDocToPlainText("")).toBe("");
  });

  // `{"a":1}` is valid JSON and not a document — treating it as one would blank
  // a description that merely starts with a brace.
  it("treats non-doc JSON as plain text", () => {
    expect(richDocToPlainText('{"a":1}')).toBe('{"a":1}');
  });

  it("separates top-level blocks with a blank line", () => {
    expect(richDocToPlainText(doc(para("One"), para("Two")))).toBe("One\n\nTwo");
  });

  it("joins lines inside one block with a single newline", () => {
    const body = doc({
      type: "bulletList",
      content: [
        { type: "listItem", content: [para("Cotton")] },
        { type: "listItem", content: [para("Full sleeve")] },
      ],
    });
    expect(richDocToPlainText(body)).toBe("Cotton\nFull sleeve");
  });

  it("keeps marked text (the mark goes, the words stay)", () => {
    const body = doc({
      type: "paragraph",
      content: [
        { type: "text", text: "Made of " },
        { type: "text", text: "cotton", marks: [{ type: "bold" }] },
      ],
    });
    expect(richDocToPlainText(body)).toBe("Made of cotton");
  });

  // A size chart is why product descriptions became rich at all.
  it("separates table cells and rows", () => {
    const cell = (text: string) => ({ type: "tableCell", content: [para(text)] });
    const body = doc({
      type: "table",
      content: [
        { type: "tableRow", content: [cell("S"), cell("38")] },
        { type: "tableRow", content: [cell("M"), cell("40")] },
      ],
    });
    const text = richDocToPlainText(body);
    expect(text).toBe("S 38\nM 40");
  });

  it("emits nothing for an empty document", () => {
    expect(richDocToPlainText(doc({ type: "paragraph" }))).toBe("");
  });
});

describe("plainTextToRichDoc", () => {
  it("splits paragraphs on blank lines", () => {
    expect(plainTextToRichDoc("One\n\nTwo").content).toHaveLength(2);
  });

  it("turns single newlines into hard breaks, not paragraphs", () => {
    const result = plainTextToRichDoc("One\nTwo");
    expect(result.content).toHaveLength(1);
    expect(
      (result.content[0] as any).content.some((n: any) => n.type === "hardBreak"),
    ).toBe(true);
  });

  // The bridge markdown would get wrong: "Size - M" in a POS textarea is
  // literal text, not a bullet.
  it("does not read markdown structure", () => {
    const result = plainTextToRichDoc("# Care\n- Hand wash");
    expect(result.content).toHaveLength(1);
    expect(richDocToPlainText(JSON.stringify(result))).toBe("# Care\n- Hand wash");
  });

  it("round-trips through the flattener", () => {
    const source = "Cotton, full sleeve\n\nHand wash only";
    expect(richDocToPlainText(JSON.stringify(plainTextToRichDoc(source)))).toBe(source);
  });

  it("produces a valid empty document for empty input", () => {
    const result = plainTextToRichDoc("");
    expect(result.content).toHaveLength(1);
    expect(richDocToPlainText(JSON.stringify(result))).toBe("");
  });
});
