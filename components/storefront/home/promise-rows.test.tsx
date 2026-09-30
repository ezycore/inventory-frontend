// coding-standard: maintained
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PromiseRows, promiseIcon } from "@/components/storefront/home/promise-rows";
import { FooterPromises } from "@/components/storefront/footer/footer-pieces";

describe("promise icons", () => {
  const icons = (html: string) => (html.match(/<svg/g) ?? []).length;
  const promises = [
    { text: "Genuine medicine", icon: "shield" },
    { text: "Cash on delivery", icon: "none" },
    { text: "Easy returns" },
  ];

  it("draws a disc by default, and honours a row's own No icon", () => {
    const html = renderToString(<PromiseRows promises={promises} />);
    expect(icons(html)).toBe(2);
    expect(html).toContain("sf-trust-row--bare");
    expect(html).not.toContain("sf-trust-row--plain");
  });

  it("draws plain glyphs on a narrower track, or no icons at all", () => {
    const plain = renderToString(<PromiseRows promises={promises} iconStyle="plain" />);
    expect(icons(plain)).toBe(2);
    expect(plain).toContain("sf-trust-row--plain");
    const none = renderToString(<PromiseRows promises={promises} iconStyle="none" />);
    expect(icons(none)).toBe(0);
    expect(none.match(/sf-trust-row--bare/g)?.length).toBe(3);
  });

  it("gives an unset promise the same fallback in the band and the footer", () => {
    // Position 2 cycles to `tag` everywhere — the footer used to cycle its own list.
    expect(promiseIcon(undefined, 2, "disc")).toBe("tag");
    expect(promiseIcon(undefined, 2, "plain")).toBe("tag");
    expect(promiseIcon("none", 0, "disc")).toBeNull();
    expect(promiseIcon("shield", 0, "none")).toBeNull();
  });

  it("styles the footer's promises the same way, plain when unset", () => {
    const footer = (style?: "disc" | "plain" | "none") =>
      renderToString(
        <FooterPromises
          promises={promises.map((p) => ({ icon: p.icon, label: p.text }))}
          iconStyle={style}
        />,
      );
    expect(icons(footer())).toBe(2);
    expect(footer()).not.toContain("border-radius:999px");
    expect(footer("disc")).toContain("border-radius:999px");
    expect(icons(footer("none"))).toBe(0);
  });
});
