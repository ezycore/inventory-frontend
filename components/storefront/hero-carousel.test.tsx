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
