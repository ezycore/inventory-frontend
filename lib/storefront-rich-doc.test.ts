// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  clampSpan,
  FAQ_ANSWER_NODE,
  FAQ_ITEM_NODE,
  FAQ_LIST_NODE,
  FAQ_QUESTION_NODE,
  isRichDocBody,
  parseRichDoc,
  safeAlign,
  safeCssColor,
  sfBlocksToTiptapDoc,
} from "@/lib/storefront-rich-doc";
import { parseStorefrontMarkdown } from "@/lib/storefront-markdown";

describe("isRichDocBody / parseRichDoc", () => {
  it("recognizes a valid rich doc string", () => {
    const body = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
    expect(isRichDocBody(body)).toBe(true);
    expect(parseRichDoc(body)).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });

  it("rejects legacy markdown text", () => {
    expect(isRichDocBody("## Shipping\nWe ship daily.")).toBe(false);
    expect(parseRichDoc("## Shipping\nWe ship daily.")).toBeNull();
  });

  it("rejects unrelated JSON", () => {
    expect(isRichDocBody('{"foo":1}')).toBe(false);
  });

  it("rejects empty/nullish bodies", () => {
    expect(isRichDocBody("")).toBe(false);
    expect(isRichDocBody(null)).toBe(false);
    expect(isRichDocBody(undefined)).toBe(false);
  });
});

describe("sfBlocksToTiptapDoc", () => {
  it("maps an empty block list to a single empty paragraph (doc requires block+)", () => {
    expect(sfBlocksToTiptapDoc([])).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });

  it("maps a heading with inline formatting", () => {
    const blocks = parseStorefrontMarkdown("## **Shipping** info");
    const doc = sfBlocksToTiptapDoc(blocks);
    expect(doc.content[0]).toEqual({
      type: "heading",
      attrs: { level: 2 },
      content: [
        { type: "text", text: "Shipping", marks: [{ type: "bold" }] },
        { type: "text", text: " info" },
      ],
    });
  });

  it("maps a multi-line paragraph to hardBreak-interleaved inline content", () => {
    const blocks = parseStorefrontMarkdown("line one\nline two");
    const doc = sfBlocksToTiptapDoc(blocks);
    expect(doc.content[0]).toEqual({
      type: "paragraph",
      content: [
        { type: "text", text: "line one" },
        { type: "hardBreak" },
        { type: "text", text: "line two" },
      ],
    });
  });

  it("maps bullet and ordered lists", () => {
    const blocks = parseStorefrontMarkdown("- a\n- b\n\n1. x\n2. y");
    const doc = sfBlocksToTiptapDoc(blocks);
    expect(doc.content[0]).toMatchObject({
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "b" }] }] },
      ],
    });
    expect(doc.content[1]).toMatchObject({ type: "orderedList" });
  });

  it("maps a quote and a divider", () => {
    const blocks = parseStorefrontMarkdown("> note\n\n---");
    const doc = sfBlocksToTiptapDoc(blocks);
    expect(doc.content[0]).toMatchObject({
      type: "blockquote",
      content: [{ type: "paragraph", content: [{ type: "text", text: "note" }] }],
    });
    expect(doc.content[1]).toEqual({ type: "horizontalRule" });
  });

  it("maps an FAQ block into nested faqList/faqItem/faqQuestion/faqAnswer nodes", () => {
    const blocks = parseStorefrontMarkdown(
      "Q: How long does delivery take?\nA: Typically 2–4 business days.\nSecond line.",
    );
    const doc = sfBlocksToTiptapDoc(blocks);
    expect(doc.content[0].type).toBe(FAQ_LIST_NODE);
    const faqList = doc.content[0] as { content: unknown[] };
    expect(faqList.content).toHaveLength(1);
    const item = faqList.content[0] as { type: string; content: [unknown, unknown] };
    expect(item.type).toBe(FAQ_ITEM_NODE);
    const [question, answer] = item.content as [
      { type: string; content: unknown[] },
      { type: string; content: unknown[] },
    ];
    expect(question.type).toBe(FAQ_QUESTION_NODE);
    expect(question.content).toEqual([{ type: "text", text: "How long does delivery take?" }]);
    expect(answer.type).toBe(FAQ_ANSWER_NODE);
    expect(answer.content).toEqual([
      { type: "paragraph", content: [{ type: "text", text: "Typically 2–4 business days." }] },
      { type: "paragraph", content: [{ type: "text", text: "Second line." }] },
    ]);
  });

  it("falls back to a single empty paragraph for a question with no answer lines", () => {
    // parseStorefrontMarkdown always attaches at least one (possibly empty) answer via flush(),
    // so exercise the answer-less branch directly through the FAQ item shape it would produce.
    const doc = sfBlocksToTiptapDoc([{ kind: "faq", items: [{ q: [{ kind: "text", text: "Q" }], a: [] }] }]);
    const faqList = doc.content[0] as { content: { content: [unknown, { content: unknown[] }] }[] };
    expect(faqList.content[0].content[1].content).toEqual([{ type: "paragraph" }]);
  });
});

describe("render-time attribute guards", () => {
  it("safeCssColor accepts hex, rgb/rgba, and named colours", () => {
    expect(safeCssColor("#abc")).toBe("#abc");
    expect(safeCssColor("#a1b2c3")).toBe("#a1b2c3");
    expect(safeCssColor("rgb(255, 0, 128)")).toBe("rgb(255, 0, 128)");
    expect(safeCssColor("rgba(0,0,0,0.5)")).toBe("rgba(0,0,0,0.5)");
    expect(safeCssColor("red")).toBe("red");
    expect(safeCssColor(" #FFF ")).toBe("#FFF"); // trimmed
  });

  it("safeCssColor drops anything that could smuggle CSS", () => {
    expect(safeCssColor("red; background: url(javascript:alert(1))")).toBeUndefined();
    expect(safeCssColor("expression(alert(1))")).toBeUndefined();
    expect(safeCssColor("url(https://evil.test)")).toBeUndefined();
    expect(safeCssColor("#12")).toBeUndefined(); // wrong length
    expect(safeCssColor("boguscolor")).toBeUndefined();
    expect(safeCssColor(123)).toBeUndefined();
    expect(safeCssColor(null)).toBeUndefined();
  });

  it("safeAlign accepts only the four alignments", () => {
    expect(safeAlign("center")).toBe("center");
    expect(safeAlign("justify")).toBe("justify");
    expect(safeAlign("middle")).toBeUndefined();
    expect(safeAlign(undefined)).toBeUndefined();
  });

  it("clampSpan coerces to an integer in [1, 100]", () => {
    expect(clampSpan(3)).toBe(3);
    expect(clampSpan(2.9)).toBe(2);
    expect(clampSpan(0)).toBe(1);
    expect(clampSpan(-5)).toBe(1);
    expect(clampSpan(9999)).toBe(1);
    expect(clampSpan("4")).toBe(1);
    expect(clampSpan(undefined)).toBe(1);
  });
});
