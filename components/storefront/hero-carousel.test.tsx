// coding-standard: maintained

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeroCarousel } from "@/components/storefront/hero-carousel";

const slides = [
  {
    title: "First",
    image: { url: "/first.jpg" },
    buttonLabel: "Browse",
    link: "/products",
  },
  { title: "Second", image: { url: "/second.jpg" } },
];

describe("HeroCarousel swipe", () => {
  it("moves to the next slide after a primary horizontal touch drag", () => {
    const { container } = render(
      <HeroCarousel slides={slides} base="/shop" storeName="Test store" />,
    );
    const hero = container.querySelector<HTMLElement>(".sf-hero")!;

    fireEvent.pointerDown(hero, {
      pointerId: 7,
      pointerType: "touch",
      isPrimary: true,
      clientX: 280,
      clientY: 120,
    });
    fireEvent.pointerUp(hero, {
      pointerId: 7,
      pointerType: "touch",
      isPrimary: true,
      clientX: 130,
      clientY: 126,
    });

    expect(container.querySelectorAll(".sf-hero-slide")[1]).toHaveClass(
      "sf-hero-active",
    );
  });

  it("does not change slides for a mostly vertical drag", () => {
    const { container } = render(
      <HeroCarousel slides={slides} base="/shop" storeName="Test store" />,
    );
    const hero = container.querySelector<HTMLElement>(".sf-hero")!;

    fireEvent.pointerDown(hero, {
      pointerId: 9,
      pointerType: "touch",
      isPrimary: true,
      clientX: 250,
      clientY: 80,
    });
    fireEvent.pointerUp(hero, {
      pointerId: 9,
      pointerType: "touch",
      isPrimary: true,
      clientX: 190,
      clientY: 210,
    });

    expect(container.querySelectorAll(".sf-hero-slide")[0]).toHaveClass(
      "sf-hero-active",
    );
  });

  it("leaves nested navigation controls in charge of pointer clicks", () => {
    const { container } = render(
      <HeroCarousel slides={slides} base="/shop" storeName="Test store" />,
    );
    const hero = container.querySelector<HTMLElement>(".sf-hero")!;
    const capture = vi.fn();
    hero.setPointerCapture = capture;
    const next = screen.getByRole("button", { name: "Next slide" });

    fireEvent.pointerDown(next, {
      pointerId: 11,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      clientX: 300,
      clientY: 100,
    });
    fireEvent.pointerUp(next, {
      pointerId: 11,
      pointerType: "mouse",
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    });
    fireEvent.click(next);

    expect(capture).not.toHaveBeenCalled();
    expect(container.querySelectorAll(".sf-hero-slide")[1]).toHaveClass(
      "sf-hero-active",
    );
  });

  it("does not capture a slide CTA press", () => {
    const { container } = render(
      <HeroCarousel slides={slides} base="/shop" storeName="Test store" />,
    );
    const hero = container.querySelector<HTMLElement>(".sf-hero")!;
    const capture = vi.fn();
    hero.setPointerCapture = capture;
    const cta = screen.getByRole("link", { name: "Browse" });

    fireEvent.pointerDown(cta, {
      pointerId: 12,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
    });

    expect(capture).not.toHaveBeenCalled();
    expect(cta).toHaveAttribute("href", "/shop/products");
  });

  it("marks only opted-in slides for artwork-only mobile rendering", () => {
    const { container } = render(
      <HeroCarousel
        slides={[{ ...slides[0], hideTextOnMobile: true }, slides[1]]}
        base="/shop"
        storeName="Test store"
      />,
    );

    expect(container.querySelectorAll(".sf-hero-slide")[0]).toHaveAttribute(
      "data-hide-mobile-copy",
      "true",
    );
    expect(container.querySelectorAll(".sf-hero-slide")[1]).not.toHaveAttribute(
      "data-hide-mobile-copy",
    );
  });
});

// The link used to be reachable only through the button, so a slide with a
// destination and no button label stored a URL and did nothing.
describe("HeroCarousel whole-slide link", () => {
  const linkOnly = [
    { image: { url: "/a.jpg" }, link: "/sale" },
    { title: "Second", image: { url: "/b.jpg" } },
  ];

  it("makes a picture-only slide clickable when it has a link but no button", () => {
    const { container } = render(
      <HeroCarousel slides={linkOnly} base="/shop" storeName="Test store" />,
    );
    const link = container.querySelector<HTMLAnchorElement>(
      ".sf-hero-slide-link",
    )!;

    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/shop/sale");
    // Nothing else on the slide names it, so the label has to be synthesised.
    expect(link).toHaveAttribute("aria-label", "Slide 1 of 2");
  });

  it("leaves the photo inert when the slide has a button to carry the link", () => {
    const { container } = render(
      <HeroCarousel slides={slides} base="/shop" storeName="Test store" />,
    );

    expect(
      container.querySelectorAll(".sf-hero-slide")[0].querySelector(
        ".sf-hero-slide-link",
      ),
    ).toBeNull();
    expect(screen.getByText("Browse")).toBeInTheDocument();
  });

  it("adds no link to a slide that has no destination", () => {
    const { container } = render(
      <HeroCarousel slides={linkOnly} base="/shop" storeName="Test store" />,
    );

    // `storeLinkHref` falls back to /products for an empty link, so a slide
    // without one must never reach it.
    expect(
      container.querySelectorAll(".sf-hero-slide")[1].querySelector(
        ".sf-hero-slide-link",
      ),
    ).toBeNull();
  });

  it("still swipes when the drag starts on the whole-slide link", () => {
    const { container } = render(
      <HeroCarousel slides={linkOnly} base="/shop" storeName="Test store" />,
    );
    const link = container.querySelector<HTMLElement>(".sf-hero-slide-link")!;

    fireEvent.pointerDown(link, {
      pointerId: 3,
      pointerType: "touch",
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    });
    fireEvent.pointerUp(link, {
      pointerId: 3,
      pointerType: "touch",
      isPrimary: true,
      clientX: 140,
      clientY: 104,
    });

    expect(container.querySelectorAll(".sf-hero-slide")[1]).toHaveClass(
      "sf-hero-active",
    );
  });

  it("swallows the click a completed swipe synthesises on the slide link", () => {
    const { container } = render(
      <HeroCarousel slides={linkOnly} base="/shop" storeName="Test store" />,
    );
    const link = container.querySelector<HTMLElement>(".sf-hero-slide-link")!;

    fireEvent.pointerDown(link, {
      pointerId: 4,
      pointerType: "touch",
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    });
    fireEvent.pointerUp(link, {
      pointerId: 4,
      pointerType: "touch",
      isPrimary: true,
      clientX: 140,
      clientY: 104,
    });

    // A swipe must change the slide, not navigate to it.
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });
});
