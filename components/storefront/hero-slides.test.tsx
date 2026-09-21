// coding-standard: maintained
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSlidesView } from "@/components/storefront/hero-slides";
import { HeroOpenView } from "@/components/storefront/home/hero-static";

const slides = [
  { title: "First", image: { url: "/first.jpg" }, buttonLabel: "Browse", link: "/products" },
  { title: "Second", image: { url: "/second.jpg" } },
  { title: "Third" },
];

const draw = (props: Partial<Parameters<typeof HeroSlidesView>[0]> = {}) =>
  render(
    <HeroSlidesView
      base="/shop"
      slides={slides}
      storeName="Rafi's Mart"
      layout="card"
      {...props}
    />,
  );

describe("HeroSlidesView", () => {
  it("gives every slide the same shape, so the box does not resize mid-rotation", () => {
    const { container } = draw({
      frame: { vars: { "--sfb-hero-frame": "21 / 9" } as React.CSSProperties, base: true, mobile: false },
    });
    const cards = [...container.querySelectorAll(".sf-herocard")] as HTMLElement[];
    expect(cards).toHaveLength(3);
    // The slides share one grid cell, so a shape on the wrapper would never
    // reach the `Media` calls that read it — and an identical copy on each is
    // what stops the stack changing height as they cross-fade.
    for (const card of cards) {
      expect(card.getAttribute("data-frame")).toBe("");
      expect(card.getAttribute("data-frame-m")).toBeNull();
      expect(card.style.getPropertyValue("--sfb-hero-frame")).toBe("21 / 9");
    }
  });

  it("places every slide the same way, on both layouts", () => {
    const placement = { side: "left", mobileFirst: "text" } as const;
    for (const layout of ["card", "open"] as const) {
      const { container } = draw({ layout, placement });
      const roots = [...container.querySelectorAll(layout === "card" ? ".sf-herocard" : ".sf-heroopen")];
      expect(roots).toHaveLength(3);
      for (const root of roots) {
        expect(root.getAttribute("data-media-side")).toBe("left");
        expect(root.getAttribute("data-mobile-first")).toBe("text");
      }
    }
  });

  /**
   * The open hero is inline-styled, and two of its inline values are written by
   * the STYLESHEET through a custom property. That is a coupling across two
   * files with nothing in either one pointing at the other: delete the `var()`
   * here and the CSS rules still parse, still compute, and simply stop
   * reaching anything — no error, no failing type, just a control that quietly
   * does nothing. These assertions are the only thing holding the two halves
   * together.
   *
   * Asserted on the style ATTRIBUTE rather than `el.style.*`, because jsdom's
   * CSS parser drops `var()` values from the property accessors.
   */
  describe("the stylesheet's reach into an inline-styled hero", () => {
    const open = (photo?: { src: string; fit: "cover" | "canvas" }) =>
      render(
        <HeroOpenView title="Eid edit" photo={photo} />,
      ).container.querySelector(".sf-heroopen") as HTMLElement;

    it("reads --heroopen-cols for its columns, so the left-picture rule can swap them", () => {
      const root = open({ src: "/a.jpg", fit: "cover" });
      const style = root.getAttribute("style") ?? "";
      /* Paired with `.sf-heroopen[data-media-side="left"] { --heroopen-cols: 1fr 1.1fr }`
         in storefront.css. That rule is the only way the picture moving left
         also moves the WIDER column, which is the answer the card gives too. */
      expect(style).toContain("--heroopen-cols");
      /* And the fallback, which is what every untouched hero renders: unset,
         it is `--herocols` — `1fr` on a phone, `1.1fr 1fr` above. */
      expect(style.replace(/\s+/g, "")).toContain("var(--heroopen-cols,var(--herocols))");
    });

    it("drops to one column with no photo, reaching for no variable at all", () => {
      // The collapse case: a lone copy panel must not inherit a two-track grid.
      const style = (open().getAttribute("style") ?? "").replace(/\s+/g, "");
      expect(style).toContain("grid-template-columns:1fr");
      expect(style).not.toContain("--heroopen-cols");
    });

    it("reads --heroopen-ratio for its picture, so the shape rules can set it", () => {
      // Paired with the `--heroopen-ratio` rules in storefront.css, which resolve
      // the merchant's shape per breakpoint; `4 / 3` is what this hero always drew.
      const html = render(<HeroOpenView title="Eid edit" photo={{ src: "/a.jpg", fit: "cover" }} />)
        .container.innerHTML.replace(/\s+/g, "");
      expect(html).toContain("var(--heroopen-ratio,4/3)");
    });
  });

  it("gives the open hero's photo column the class its placement rules order", () => {
    // `HeroOpenView` is inline-styled throughout; `order` has to come from the
    // stylesheet because it changes at a breakpoint, so the column needs a hook.
    const { container } = draw({ layout: "open" });
    expect(container.querySelectorAll(".sf-heroopen-media")).toHaveLength(2);
  });

  it("leaves the slides unshaped when the merchant chose no shape", () => {
    const { container } = draw();
    for (const card of container.querySelectorAll(".sf-herocard")) {
      expect(card.getAttribute("data-frame")).toBeNull();
      expect(card.getAttribute("data-frame-m")).toBeNull();
    }
  });

  it("keeps the card's shape: every slide a card, stacked, with dots and no arrows", () => {
    const { container } = draw();
    expect(container.querySelectorAll(".sf-heroslides-slide")).toHaveLength(3);
    expect(container.querySelectorAll(".sf-herocard")).toHaveLength(3);
    // The dark carousel's chrome is exactly what this hero must not grow.
    expect(container.querySelector(".sf-hero-media")).toBeNull();
    expect(container.querySelector(".sf-hero-nav")).toBeNull();
    expect(container.querySelectorAll(".sf-heroslides-dots button")).toHaveLength(3);
  });

  it("draws the open hero open", () => {
    const { container } = draw({ layout: "open" });
    expect(container.querySelectorAll(".sf-heroopen")).toHaveLength(3);
    expect(container.querySelector(".sf-herocard")).toBeNull();
  });

  it("shows one slide and takes the rest out of reach", () => {
    const { container } = draw();
    const [first, second] = [...container.querySelectorAll<HTMLElement>(".sf-heroslides-slide")];
    expect(first.dataset.active).toBe("true");
    expect(first.getAttribute("aria-hidden")).toBe("false");
    expect(second.dataset.active).toBeUndefined();
    // Out of the pointer AND the tab order, not merely invisible: a stack keeps
    // every slide in the DOM.
    expect(second.getAttribute("aria-hidden")).toBe("true");
    expect(second.hasAttribute("inert")).toBe(true);
  });

  it("marks only the first slide's photo as the page's likely LCP image", () => {
    const { container } = draw();
    const [first, ...rest] = [...container.querySelectorAll(".sf-heroslides-slide")];
    // Per slide, not per `<img>`: a whole-picture photo paints a blurred copy of
    // itself behind the foreground, and both carry the flag together.
    const priorityOf = (el: Element) =>
      [...el.querySelectorAll("img")].map((img) => img.getAttribute("fetchpriority"));
    expect(priorityOf(first)).toContain("high");
    expect(rest.flatMap(priorityOf)).not.toContain("high");
  });

  it("moves on a dot, and on a horizontal drag", () => {
    const { container } = draw();
    const dots = container.querySelectorAll<HTMLElement>(".sf-heroslides-dots button");
    fireEvent.click(dots[2]);
    expect(
      container.querySelectorAll<HTMLElement>(".sf-heroslides-slide")[2].dataset.active,
    ).toBe("true");

    const hero = container.querySelector<HTMLElement>(".sf-heroslides")!;
    fireEvent.pointerDown(hero, { pointerId: 4, pointerType: "touch", isPrimary: true, clientX: 280, clientY: 120 });
    fireEvent.pointerUp(hero, { pointerId: 4, pointerType: "touch", isPrimary: true, clientX: 130, clientY: 126 });
    // Past the last slide wraps to the first, as every rotating hero here does.
    expect(
      container.querySelectorAll<HTMLElement>(".sf-heroslides-slide")[0].dataset.active,
    ).toBe("true");
  });

  it("gives a slide with a destination and no button the whole card as its link", () => {
    const { container } = draw({ slides: [{ title: "Sale", link: "/sale" }, { title: "Second" }] });
    const link = container.querySelector(".sf-hero-slide-link") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/shop/sale");
    // The first slide carries a button, so it never grows one of these.
    expect(container.querySelectorAll(".sf-hero-slide-link")).toHaveLength(1);
  });

  it("draws a button from its label alone, as every other hero does", () => {
    const { container } = render(
      <HeroSlidesView
        base="/shop"
        storeName="Rafi's Mart"
        layout="card"
        slides={[{ title: "One", buttonLabel: "Go" }, { title: "Two" }]}
      />,
    );
    const first = container.querySelector(".sf-heroslides-slide") as HTMLElement;
    const link = first.querySelector("a") as HTMLElement;
    expect(link.textContent).toBe("Go");
    // An empty link is the catalogue, not an absent button.
    expect(link.getAttribute("href")).toBe("/shop/products");
  });

  it("gives each slide its own second button", () => {
    const { container } = draw({
      slides: [
        {
          title: "First",
          buttonLabel: "Buy",
          link: "/pages/eid",
          secondaryLabel: "Call",
          secondaryLink: "tel:+8801711000000",
        },
      ],
    });
    expect([...container.querySelectorAll("a")].map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Buy", "/shop/pages/eid"],
      ["Call", "tel:+8801711000000"],
    ]);
  });

  it("puts the running offer on a slide with no badge of its own, and the promises on every card", () => {
    const { container } = draw({ campaignLabel: "Eid sale · 10%", promises: ["Cash on delivery"] });
    expect(container.querySelector(".sf-herocard-badge")?.textContent).toBe("Eid sale · 10% off");
    /* On every card, not once beneath the stack: the strip belongs inside the
       card's border, and identical copies never appear to change (decision D6). */
    expect(container.querySelectorAll(".sf-herocard-trust")).toHaveLength(3);
  });

  it("centres every slide it draws, in both layouts", () => {
    const card = draw({ align: "center" });
    expect([...card.container.querySelectorAll(".sf-herocard")].every((el) => el.getAttribute("data-align") === "center")).toBe(true);
    const open = draw({ align: "center", layout: "open" });
    expect(open.container.querySelector<HTMLElement>(".sf-heroopen-copy")?.style.textAlign).toBe("center");
  });

  it("words both buttons for a hero that kept the store's wording", () => {
    const { container } = draw({ storeWords: true, slides: [{ image: { url: "/a.jpg" } }] });
    expect([...container.querySelectorAll("a")].map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Shop now", "/shop/products"],
      ["Browse categories", "/shop/products"],
    ]);
  });
});
