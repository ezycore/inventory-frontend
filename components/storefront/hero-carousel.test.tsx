// coding-standard: maintained

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroCarousel } from "@/components/storefront/hero-carousel";

const slides = [
  { title: "First", image: { url: "/first.jpg" } },
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
});
