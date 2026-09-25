import { describe, expect, it } from "vitest";
import type { CatalogCategory } from "@/lib/storefront-client";
import { blocksFromLayout, groupsFromBlocks } from "./blocks";
import { footerLinkTarget, isFooterLinkComplete } from "./links";
import { footerFrame, footerGroupStartsOpen } from "./style";

const categories = [
  { _id: "c1", name: "Phones", slug: "phones", slugPath: "phones", children: [] },
] as unknown as CatalogCategory[];

describe("footerLinkTarget", () => {
  const url = (value: string, newTab = false) =>
    footerLinkTarget("/shop/acme", { label: "x", url: value, newTab }, categories);

  it("reads a legacy { label, url } row as a URL link", () => {
    expect(url("/pages/about")).toEqual({ href: "/shop/acme/pages/about", external: false, newTab: false });
  });

  // The live bug: `facebook.com/shop` was a RELATIVE href and 404'd on the shop.
  it("makes a bare domain absolute instead of relative", () => {
    expect(url("facebook.com/acme")?.href).toBe("https://facebook.com/acme");
    expect(url("facebook.com/acme")?.external).toBe(true);
  });

  it("strips a pasted /shop prefix so it does not double up", () => {
    expect(url("/shop/products")?.href).toBe("/shop/acme/products");
  });

  it("keeps tel: and mailto: as typed and never opens them in a new tab", () => {
    expect(url("tel:01700000000", true)).toEqual({ href: "tel:01700000000", external: true, newTab: false });
    expect(url("mailto:hi@acme.com")?.href).toBe("mailto:hi@acme.com");
  });

  it("refuses a scheme the storefront does not link to", () => {
    expect(url("javascript:alert(1)")).toBeNull();
  });

  it("opens an absolute link in a new tab only when asked", () => {
    expect(url("https://acme.com")?.newTab).toBe(false);
    expect(url("https://acme.com", true)?.newTab).toBe(true);
  });

  it("resolves typed page and category links, falling back for a missing category", () => {
    const page = footerLinkTarget("", { label: "About", type: "page", value: "about" }, categories);
    expect(page?.href).toBe("/pages/about");
    const cat = footerLinkTarget("", { label: "Phones", type: "category", value: "phones" }, categories);
    expect(cat?.href).toBe("/phones");
    const gone = footerLinkTarget("", { label: "Old", type: "category", value: "gone" }, categories);
    expect(gone?.href).toBe("/products");
  });

  it("treats a row with no label or no target as incomplete", () => {
    expect(isFooterLinkComplete({ label: "Help", url: "" })).toBe(false);
    expect(isFooterLinkComplete({ label: " ", type: "url", value: "/x" })).toBe(false);
    expect(isFooterLinkComplete({ label: "Help", type: "url", value: "/x" })).toBe(true);
  });
});

describe("footerFrame", () => {
  const defaults = { top: 36, bottom: 28 };

  it("adds no switches for an unset style, only the layout's own padding", () => {
    const frame = footerFrame(undefined, defaults);
    expect(frame.attrs).toEqual({});
    expect(frame.style).toEqual({ "--ft-pt": "36px", "--ft-pb": "28px" });
  });

  it("gives a dark ground light ink", () => {
    const frame = footerFrame({ ground: "dark" }, defaults);
    expect(frame.attrs).toMatchObject({ "data-ground": "dark", "data-ink": "" });
    expect(frame.style).toMatchObject({ "--ft-ink": "#f4f4f5" });
  });

  it("picks readable ink for a custom colour and ignores an invalid one", () => {
    expect(footerFrame({ ground: "custom", color: "#fafafa" }, defaults).style).toMatchObject({ "--ft-ink": "#111827" });
    expect(footerFrame({ ground: "custom", color: "nope" }, defaults).attrs).toEqual({});
  });

  it("carries a phone spacing as its own variables", () => {
    const frame = footerFrame({ spacing: { base: "roomy", mobile: "compact" } }, defaults);
    expect(frame.style).toMatchObject({ "--ft-pt": "56px", "--ft-pt-m": "22px" });
  });

  it("shades a background photo under light ink", () => {
    const frame = footerFrame({ bgImage: { url: "https://cdn/x.webp" }, overlay: 40 }, defaults);
    expect(String(frame.style.backgroundImage)).toContain("rgba(0,0,0,0.4)");
  });

  it("drops the top border only when switched off", () => {
    expect(footerFrame({ topBorder: false }, defaults).attrs).toEqual({ "data-border": "none" });
  });
});

describe("phone link groups", () => {
  it.each([
    [undefined, 0, true],
    ["open", 3, true],
    ["first", 0, true],
    ["first", 1, false],
    ["closed", 0, false],
  ] as const)("mode %s, group %i starts open: %s", (mode, index, open) => {
    expect(footerGroupStartsOpen(mode, index)).toBe(open);
  });
});

describe("blocksFromLayout", () => {
  const groups = [{ title: "Help", links: [{ label: "FAQ", url: "/pages/faq" }] }];

  it("spells the default layout as brand, groups, then pages", () => {
    expect(blocksFromLayout({ layout: "columns", groups }).map((b) => b.type)).toEqual([
      "brand",
      "links",
      "pages",
    ]);
  });

  it("leads the trust-bar layout with the promises and leaves pages out when hidden", () => {
    const blocks = blocksFromLayout({ layout: "rich", groups, contentPages: { show: false } });
    expect(blocks.map((b) => b.type)).toEqual(["promises", "brand", "links"]);
  });

  it("puts the contact card beside the brand for contact-first", () => {
    const blocks = blocksFromLayout({ layout: "contact", groups: [] });
    expect(blocks.map((b) => b.type)).toEqual(["brand", "contact", "pages"]);
    expect(blocks[0].showPhone).toBe(false);
  });

  it("round-trips link groups", () => {
    expect(groupsFromBlocks(blocksFromLayout({ layout: "columns", groups }))).toEqual(groups);
  });
});
