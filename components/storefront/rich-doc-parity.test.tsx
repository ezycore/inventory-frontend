// coding-standard: maintained
/**
 * Every node the EDITOR can produce must be something the RENDERER can draw.
 *
 * `extensions.ts` states this rule in a comment and nothing enforced it. The
 * failure it guards against is silent and one-directional: a merchant inserts a
 * block the storefront has no case for, the editor saves it happily, and the
 * shop simply renders nothing where their content was. No error, no blank slot —
 * the content is in the database and invisible on the page.
 *
 * So this walks the real extension list rather than a hand-kept array: a node
 * added to the schema without a renderer case fails here on the day it is added,
 * which is the only moment the fix is cheap.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { richTextExtensions } from "@/components/shared/rich-text-editor/extensions";
import { RichDocView } from "@/components/storefront/rich-doc-view";
import type { RichDocRoot } from "@/lib/storefront-rich-doc";

/** Node names that carry no text of their own, so "did it render?" is not a text assertion. */
const VOID_NODES = new Set(["doc", "text", "hardBreak", "horizontalRule", "image"]);

/** Structural wrappers — exercised through the parent that owns them. */
const CONTAINER_ONLY = new Set([
  "listItem",
  "tableRow",
  "tableCell",
  "tableHeader",
  "faqItem",
  "faqQuestion",
  "faqAnswer",
]);

const MARKER = "PARITY_MARKER";
const textNode = { type: "text", text: MARKER };
const para = { type: "paragraph", content: [textNode] };

/** A minimal, VALID instance of each node the renderer is expected to draw. */
const SAMPLES: Record<string, unknown> = {
  paragraph: para,
  heading: { type: "heading", attrs: { level: 2 }, content: [textNode] },
  blockquote: { type: "blockquote", content: [para] },
  bulletList: { type: "bulletList", content: [{ type: "listItem", content: [para] }] },
  orderedList: { type: "orderedList", content: [{ type: "listItem", content: [para] }] },
  table: {
    type: "table",
    content: [
      { type: "tableRow", content: [{ type: "tableCell", content: [para] }] },
    ],
  },
  callout: { type: "callout", attrs: { variant: "info" }, content: [para] },
  faqList: {
    type: "faqList",
    content: [
      {
        type: "faqItem",
        content: [
          { type: "faqQuestion", content: [textNode] },
          { type: "faqAnswer", content: [para] },
        ],
      },
    ],
  },
};

const drawableNodes = richTextExtensions
  .filter((e) => e.type === "node")
  .map((e) => e.name)
  .filter((n) => !VOID_NODES.has(n) && !CONTAINER_ONLY.has(n));

describe("editor ↔ renderer parity", () => {
  it("has a sample for every drawable node in the schema", () => {
    // Guards the guard: a new node with no sample here would otherwise be
    // skipped silently and the parity test would pass while proving nothing.
    const missing = drawableNodes.filter((n) => !(n in SAMPLES));
    expect(missing, `add a SAMPLES entry for: ${missing.join(", ")}`).toEqual([]);
  });

  it.each(drawableNodes)("renders %s", (name) => {
    const doc = { type: "doc", content: [SAMPLES[name]] } as RichDocRoot;
    render(<RichDocView doc={doc} />);
    expect(screen.getAllByText(MARKER).length).toBeGreaterThan(0);
  });

  it("honours a chosen width and alignment", () => {
    const { container } = render(
      <RichDocView
        doc={{
          type: "doc",
          content: [
            {
              type: "image",
              attrs: { src: "https://cdn.test/a.webp", width: 25, align: "left" },
            },
          ],
        } as RichDocRoot}
      />,
    );
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.style.width).toBe("25%");
    // Left-aligned = flush left, auto on the right.
    expect(img.style.marginLeft).toBe("0px");
    expect(img.style.marginRight).toBe("auto");
  });

  it("centres and fills by default", () => {
    const { container } = render(
      <RichDocView
        doc={{
          type: "doc",
          content: [{ type: "image", attrs: { src: "https://cdn.test/a.webp" } }],
        } as RichDocRoot}
      />,
    );
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.style.width).toBe("100%");
    expect(img.style.marginLeft).toBe("auto");
    expect(img.style.marginRight).toBe("auto");
  });

  /**
   * The stored tree is writable through the raw API, so an out-of-range width or
   * a junk alignment must fall back rather than reach the style attribute.
   */
  it.each([
    [{ width: 4000 }, "oversized width"],
    [{ width: 37 }, "off-list width"],
    [{ align: "justify; background:url(x)" }, "injected alignment"],
    [{ width: null, align: null }, "nulls"],
  ])("clamps unsafe geometry (%s)", (attrs: Record<string, unknown>, _label: string) => {
    const { container } = render(
      <RichDocView
        doc={{
          type: "doc",
          content: [{ type: "image", attrs: { src: "https://cdn.test/a.webp", ...attrs } }],
        } as RichDocRoot}
      />,
    );
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.style.width).toBe("100%");
    expect(["auto", "0px"]).toContain(img.style.marginLeft);
  });

  it("never lets an image exceed its column", () => {
    const { container } = render(
      <RichDocView
        doc={{
          type: "doc",
          content: [
            { type: "image", attrs: { src: "https://cdn.test/a.webp", width: 100 } },
          ],
        } as RichDocRoot}
      />,
    );
    // The guard that stops a 2000px camera upload scrolling the page sideways.
    expect((container.querySelector("img") as HTMLImageElement).style.maxWidth).toBe("100%");
  });

  /**
   * Text-beside-image. The float itself lives in `storefront.css` behind a 680px
   * media query, so what the renderer must get right is the ATTRIBUTE — jsdom
   * applies no stylesheet, and asserting a computed `float` here would test
   * nothing.
   */
  it("marks a wrapped image for the stylesheet", () => {
    const { container } = render(
      <RichDocView
        doc={{
          type: "doc",
          content: [
            {
              type: "image",
              attrs: { src: "https://cdn.test/a.webp", width: 50, align: "left", wrap: true },
            },
          ],
        } as RichDocRoot}
      />,
    );
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("data-wrap")).toBe("1");
    expect(img.getAttribute("data-align")).toBe("left");
  });

  it("omits the wrap attribute when text should not flow beside", () => {
    const { container } = render(
      <RichDocView
        doc={{
          type: "doc",
          content: [{ type: "image", attrs: { src: "https://cdn.test/a.webp" } }],
        } as RichDocRoot}
      />,
    );
    // Absent, not "0" — the CSS selector keys on presence.
    expect(container.querySelector("img")?.hasAttribute("data-wrap")).toBe(false);
  });

  // Only a literal `true` wraps. A truthy string arriving through the raw API
  // must not turn into a float.
  it.each([["1"], ["true"], [1], [{}]])(
    "does not treat %s as a wrap flag",
    (wrap: unknown) => {
      const { container } = render(
        <RichDocView
          doc={{
            type: "doc",
            content: [{ type: "image", attrs: { src: "https://cdn.test/a.webp", wrap } }],
          } as RichDocRoot}
        />,
      );
      expect(container.querySelector("img")?.hasAttribute("data-wrap")).toBe(false);
    },
  );

  it("keeps the float contained so it cannot collide with the next section", () => {
    const { container } = render(
      <RichDocView
        doc={{
          type: "doc",
          content: [{ type: "image", attrs: { src: "https://cdn.test/a.webp" } }],
        } as RichDocRoot}
      />,
    );
    // `.sf-rich-doc::after` is the clearfix; the class is what carries it.
    expect(container.querySelector(".sf-rich-doc")).not.toBeNull();
  });

  it("draws an image, and keeps an empty alt rather than dropping it", () => {
    const { container } = render(
      <RichDocView
        doc={{
          type: "doc",
          content: [{ type: "image", attrs: { src: "https://cdn.test/a.webp" } }],
        } as RichDocRoot}
      />,
    );
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://cdn.test/a.webp");
    // Present-and-empty, not absent — an undescribed image is decorative, and a
    // missing attribute makes a screen reader announce the filename.
    expect(img?.getAttribute("alt")).toBe("");
  });

  /**
   * The renderer is the real boundary, not the editor's `allowBase64: false` —
   * this tree is writable through the raw API. A `data:` src would let arbitrary
   * bytes ride inside a size-capped document.
   */
  it.each([
    ["data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", "data URI"],
    ["javascript:alert(1)", "script scheme"],
    ["mailto:x@y.z", "non-image scheme"],
  ])("drops an unsafe src (%s)", (src) => {
    const { container } = render(
      <RichDocView
        doc={{ type: "doc", content: [{ type: "image", attrs: { src } }] } as RichDocRoot}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("draws a horizontal rule", () => {
    const { container } = render(
      <RichDocView doc={{ type: "doc", content: [{ type: "horizontalRule" }] } as RichDocRoot} />,
    );
    expect(container.querySelector("hr")).not.toBeNull();
  });
});
