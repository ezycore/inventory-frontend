import { describe, expect, it } from "vitest";
import { cleanFooterStyle, footerNav, trimFooterGroups } from "./footer-payloads";

const doc = (text: string) =>
  JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }] });

describe("footer payloads", () => {
  it("drops a link with no target — it used to publish as a dead #", () => {
    const groups = trimFooterGroups([
      { title: " Help ", links: [{ label: "FAQ", url: "" }, { label: "Contact", url: "/pages/contact" }] },
    ]);
    expect(groups).toEqual([
      { title: "Help", links: [{ label: "Contact", type: "url", value: "/pages/contact" }] },
    ]);
  });

  it("keeps newTab only on a URL link", () => {
    const [group] = trimFooterGroups([
      {
        title: "Links",
        links: [
          { label: "Site", type: "url", value: "https://acme.com", newTab: true },
          { label: "About", type: "page", value: "about", newTab: true },
        ],
      },
    ]);
    expect(group.links[0].newTab).toBe(true);
    expect(group.links[1]).not.toHaveProperty("newTab");
  });

  it("forgets a custom colour once the ground is not custom", () => {
    expect(cleanFooterStyle({ ground: "dark", color: "#123456" })).toEqual({ ground: "dark" });
    expect(cleanFooterStyle({ ground: "custom", color: "#123456" })).toEqual({ ground: "custom", color: "#123456" });
  });

  it("saves the fixed layout's groups when there are no blocks", () => {
    const nav = footerNav({
      footerGroups: [{ title: "Help", links: [{ label: "FAQ", url: "/faq" }] }],
      footerStyle: {},
      footerBlocks: null,
    });
    expect(nav.footerBlocks).toBeUndefined();
    expect(nav.footer).toEqual([{ title: "Help", links: [{ label: "FAQ", type: "url", value: "/faq" }] }]);
  });

  it("derives the legacy groups from link blocks, and empties a blank text block", () => {
    const nav = footerNav({
      footerGroups: [{ title: "Stale", links: [] }],
      footerStyle: {},
      footerBlocks: [
        { id: "a", type: "links", title: "Shop", links: [{ label: "All", type: "url", value: "/products" }] },
        { id: "b", type: "text", body: doc("") },
        { id: "c", type: "text", body: doc("Open 10–8") },
      ],
    });
    expect(nav.footer).toEqual([{ title: "Shop", links: [{ label: "All", type: "url", value: "/products" }] }]);
    expect(nav.footerBlocks?.[1].body).toBeUndefined();
    expect(nav.footerBlocks?.[2].body).toBe(doc("Open 10–8"));
  });
});
