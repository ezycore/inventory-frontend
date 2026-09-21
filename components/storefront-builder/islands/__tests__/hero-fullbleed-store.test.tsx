// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StoreHeroSlide } from "@/lib/storefront-client";
import { HeroFullBleedStoreIsland } from "@/components/storefront-builder/islands/hero-fullbleed-store";

const banner = { url: "https://cdn.example.com/banner.jpg", mediumUrl: "https://cdn.example.com/banner-md.jpg" };
const photo = { url: "https://cdn.example.com/slide.jpg", mediumUrl: "https://cdn.example.com/slide-md.jpg" };

const draw = (slides: StoreHeroSlide[], storeWords = true) =>
  render(
    <HeroFullBleedStoreIsland
      base="/shop"
      storeName="Rafi's Mart"
      storeWords={storeWords}
      slides={slides}
      fallback={{ image: banner, fit: "cover" }}
    />,
  );

describe("HeroFullBleedStoreIsland", () => {
  it("draws the banner hero from an empty first slide: the store's name and its own wording", () => {
    const { container } = draw([{}]);
    expect(container.querySelector("h1")?.textContent).toBe("Rafi's Mart");
    expect(container.querySelector("h1")?.className).toContain("sf-hero-fullbleed-title");
    // Full size, not the medium variant: the picture runs the width of the page.
    expect(container.querySelector("img")?.getAttribute("src")).toContain("banner.jpg");
    expect(container.querySelector(".sf-hero-fullbleed-copy a")?.textContent).toBe("Start shopping");
  });

  it("rotates every slide, and fills only the ones with no picture of their own", () => {
    const { container } = draw([
      { image: photo, title: "First" },
      { title: "Second" },
      { title: "Third" },
    ]);
    // Dots appear only where the hero rotates — one per slide.
    expect(container.querySelectorAll(".sf-hero-fullbleed-dots button")).toHaveLength(3);
    // The first slide owns its artwork; the banner is for the ones that do not.
    expect(container.querySelector("img")?.getAttribute("src")).toContain("slide.jpg");
  });

  it("keeps the merchant's own headline and button label over the store's", () => {
    const { container } = draw([{ title: "Eid edit", buttonLabel: "Buy", link: "/pages/eid" }]);
    expect(container.querySelector("h1")?.textContent).toBe("Eid edit");
    const cta = container.querySelector(".sf-hero-fullbleed-copy a") as HTMLAnchorElement;
    expect([cta.textContent, cta.getAttribute("href")]).toEqual(["Buy", "/shop/pages/eid"]);
  });

  it("passes the hero's alignment on to the view", () => {
    const { container } = render(
      <HeroFullBleedStoreIsland
        base="/shop"
        storeName="Rafi's Mart"
        storeWords
        align="center"
        slides={[{ title: "Eid edit" }]}
        fallback={{ image: banner, fit: "cover" }}
      />,
    );
    expect(container.querySelector(".sf-hero-fullbleed")?.getAttribute("data-align")).toBe("center");
  });

  it("passes the phone-text choice on to the view", () => {
    // The trap §0.4 of the plan names: a prop that stops at `sections/hero.tsx`
    // fixes the plain full-bleed hero and silently leaves the store-banner one
    // drawing the old rendering.
    const draw2 = (mobileCopy?: "full" | "title-only") =>
      render(
        <HeroFullBleedStoreIsland
          base="/shop"
          storeName="Rafi's Mart"
          storeWords
          mobileCopy={mobileCopy}
          slides={[{ title: "Eid edit", subtitle: "Free delivery over 1000tk" }]}
          fallback={{ image: banner, fit: "cover" }}
        />,
      );
    const attr = (c: HTMLElement) => c.querySelector(".sf-hero-fullbleed")?.getAttribute("data-mobile-copy");
    expect(attr(draw2("full").container)).toBe("full");
    // Anything but "full" sets NO attribute, so the stylesheet's `:not(...)`
    // keeps drawing what every shop already saw.
    expect(attr(draw2("title-only").container)).toBeNull();
    expect(attr(draw2().container)).toBeNull();
  });

  it("stands in for the shop whatever the wording setting, but invents no button without it", () => {
    // The two are separate promises: "Use the store banner" is what makes this
    // hero the shop's own, and "Use the store's wording" only decides whether a
    // slide with no button label gets the store's word for one.
    const { container } = draw([{}], false);
    expect(container.querySelector("h1")?.textContent).toBe("Rafi's Mart");
    expect(container.querySelector(".sf-hero-fullbleed-copy a")).toBeNull();
  });
});
