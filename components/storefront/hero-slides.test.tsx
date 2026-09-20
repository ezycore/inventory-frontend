// coding-standard: maintained
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSlidesView } from "@/components/storefront/hero-slides";

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
