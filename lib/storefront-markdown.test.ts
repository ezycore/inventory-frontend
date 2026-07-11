// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { parseInline, parseStorefrontMarkdown } from "@/lib/storefront-markdown";

describe("parseInline", () => {
  it("parses bold, italic and links around plain text", () => {
    expect(parseInline("a **b** c *d* [e](https://x.test)")).toEqual([
      { kind: "text", text: "a " },
      { kind: "bold", text: "b" },
      { kind: "text", text: " c " },
      { kind: "italic", text: "d" },
      { kind: "text", text: " " },
      { kind: "link", text: "e", href: "https://x.test" },
    ]);
  });

  it("never produces a link node for unsafe schemes", () => {
    const nodes = parseInline("[x](javascript:alert(1))");
    expect(nodes.some((n) => n.kind === "link")).toBe(false);
    expect(nodes[0]).toEqual({ kind: "text", text: "x" });
  });
});

describe("parseStorefrontMarkdown", () => {
  it("splits plain text into paragraphs with soft line breaks", () => {
    const blocks = parseStorefrontMarkdown("line one\nline two\n\nnext para");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ kind: "paragraph" });
    expect((blocks[0] as { lines: unknown[] }).lines).toHaveLength(2);
  });

  it("parses headings (also when a paragraph follows in the same group)", () => {
    const blocks = parseStorefrontMarkdown("## Shipping\nWe ship daily.");
    expect(blocks[0]).toMatchObject({ kind: "heading", level: 2 });
    expect(blocks[1]).toMatchObject({ kind: "paragraph" });
  });

  it("parses bullet and ordered lists, quotes and dividers", () => {
    const blocks = parseStorefrontMarkdown(
      "- a\n- b\n\n1. x\n2. y\n\n> note\n\n---",
    );
    expect(blocks.map((b) => b.kind)).toEqual(["list", "list", "quote", "divider"]);
    expect(blocks[0]).toMatchObject({ ordered: false });
    expect(blocks[1]).toMatchObject({ ordered: true });
  });

  it("groups consecutive Q/A pairs (across blank lines) into ONE faq block", () => {
    const blocks = parseStorefrontMarkdown(
      "Q: How long does delivery take?\nA: Typically 2–4 business days.\n\nQ: Do you offer cash on delivery?\nA: Yes, COD is available nationwide.",
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("faq");
    const faq = blocks[0] as { items: { q: unknown[]; a: unknown[][] }[] };
    expect(faq.items).toHaveLength(2);
    expect(faq.items[1].a).toHaveLength(1);
  });

  it("attaches an answer separated from its question by a blank line", () => {
    const blocks = parseStorefrontMarkdown("Q: Why?\n\nA: Because.");
    expect(blocks).toHaveLength(1);
    const faq = blocks[0] as { items: { a: unknown[][] }[] };
    expect(faq.items[0].a).toHaveLength(1);
  });

  it("supports multi-line answers without repeating the A marker", () => {
    const blocks = parseStorefrontMarkdown("Q: One?\nA: First line.\nSecond line.");
    const faq = blocks[0] as { items: { a: unknown[][] }[] };
    expect(faq.items[0].a).toHaveLength(2);
  });
});
