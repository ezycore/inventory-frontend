// coding-standard: maintained
/**
 * What the EDITOR saves must be what the STOREFRONT draws.
 *
 * `rich-doc-parity.test.tsx` proves every node type has a renderer *case*. It
 * cannot prove the case draws the thing correctly, and that is where this batch
 * of bugs lived: lists rendered as `<li>` with no marker, and alignment set
 * inside a list item or a blockquote was dropped on the floor. Every one of them
 * looked right in the editor and wrong on the shop, with nothing logged.
 *
 * So this drives a REAL editor, takes the JSON it would persist, and asserts
 * against the HTML the storefront actually produces from it.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import { richTextExtensions } from "@/components/shared/rich-text-editor/extensions";
import { RichDocView } from "@/components/storefront/rich-doc-view";

/** Editor HTML in → the storefront's rendered container out. */
const storefrontHtml = (html: string): string => {
  const editor = new Editor({ extensions: richTextExtensions, content: html });
  try {
    const { container } = render(<RichDocView doc={editor.getJSON() as never} />);
    return container.innerHTML;
  } finally {
    editor.destroy();
  }
};

describe("lists keep their markers", () => {
  it("a bullet list renders discs, not bare text", () => {
    const html = storefrontHtml("<ul><li><p>one</p></li></ul>");
    expect(html).toContain("list-style-type: disc");
  });

  it("an ordered list renders numbers", () => {
    const html = storefrontHtml("<ol><li><p>alpha</p></li></ol>");
    expect(html).toContain("list-style-type: decimal");
  });

  // The actual bug: `display: flex` on the <ul> makes every <li> a flex item,
  // and a flex item generates NO marker at all. It looked like a styling choice
  // for the item gap.
  it("never lays a list out as flex — that suppresses every marker", () => {
    const html = storefrontHtml(
      "<ul><li><p>one</p></li></ul><ol><li><p>alpha</p></li></ol>",
    );
    expect(html).not.toContain("display: flex");
  });

  it("states the list type rather than relying on the browser default", () => {
    // A `list-style: none` reset — Tailwind's preflight is one — wins over the
    // default, so the storefront cannot assume it.
    const html = storefrontHtml("<ul><li><p>one</p></li></ul>");
    expect(html).toMatch(/list-style-type:\s*disc/);
  });
});

describe("alignment survives nesting", () => {
  it("on a top-level paragraph", () => {
    expect(storefrontHtml('<p style="text-align: center">x</p>')).toContain(
      "text-align: center",
    );
  });

  it("inside a blockquote", () => {
    const html = storefrontHtml(
      '<blockquote><p style="text-align: center">x</p></blockquote>',
    );
    expect(html).toContain("text-align: center");
  });

  it("inside a list item", () => {
    const html = storefrontHtml(
      '<ul><li><p style="text-align: right">x</p></li></ul>',
    );
    expect(html).toContain("text-align: right");
  });
});

describe("blockquote", () => {
  it("renders its text", () => {
    expect(storefrontHtml("<blockquote><p>QUOTED</p></blockquote>")).toContain(
      "QUOTED",
    );
  });

  // Reported as "the quote text is invisible": muted grey on a tinted storefront
  // theme is not a caption, it is unreadable body copy.
  it("uses the body text colour, not the muted one", () => {
    const html = storefrontHtml("<blockquote><p>QUOTED</p></blockquote>");
    const quote = html.slice(html.indexOf("<blockquote"));
    expect(quote).toContain("color: var(--text)");
    expect(quote.slice(0, quote.indexOf(">"))).not.toContain("var(--muted)");
  });

  it("keeps the paragraphs inside it distinct", () => {
    const html = storefrontHtml(
      "<blockquote><p>one</p><p>two</p></blockquote>",
    );
    expect(html).toContain("one");
    expect(html).toContain("two");
  });
});

describe("a table is never the last thing in the document", () => {
  // Without a trailing paragraph there is nowhere to click to write below a
  // table, and the merchant's care instructions have no home.
  it("leaves a paragraph after a trailing table", () => {
    // Inserted through the command a merchant actually uses, not as initial
    // content: TrailingNode works through `appendTransaction`, so it needs a
    // real transaction — which is exactly what inserting a table produces.
    const element = document.createElement("div");
    document.body.appendChild(element);
    const editor = new Editor({ element, extensions: richTextExtensions });
    try {
      editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true });
      const blocks = editor.getJSON().content ?? [];
      expect(blocks.some((b) => b.type === "table")).toBe(true);
      expect(blocks[blocks.length - 1]?.type).toBe("paragraph");
    } finally {
      editor.destroy();
    }
  });
});
