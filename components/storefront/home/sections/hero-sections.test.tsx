import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  HeroCard,
  HeroFullBleed,
  HeroSplit,
} from "@/components/storefront/home/sections/hero-sections";
import type { SectionProps } from "@/components/storefront/home/home-shared";

const props = {
  base: "/shop",
  featured: [],
  latest: [],
  categories: [],
  campaigns: [],
  t: {
    shopNow: "Shop now",
  },
  store: { name: "My Store", trustBadges: [] },
} as SectionProps;

describe("HeroCard", () => {
  it("uses merchant identity without inventing a sale or promise", () => {
    render(<HeroCard {...props} />);

    expect(screen.getByRole("heading", { level: 1, name: "My Store" })).toBeInTheDocument();
    expect(screen.queryByText(/sale|discount|authentic|delivery/i)).not.toBeInTheDocument();
  });

  it("renders a promise only when the merchant supplied it", () => {
    render(
      <HeroCard
        {...props}
        store={{ ...props.store, trustBadges: [{ text: "Pickup available" }] }}
      />,
    );

    expect(screen.getByText("Pickup available")).toBeInTheDocument();
  });

  it("renders an image-only slide without an invented copy overlay", () => {
    const { container } = render(
      <HeroCard
        {...props}
        heroSlides={[{ image: { url: "/artwork.jpg" } }]}
      />,
    );

    expect(container.querySelector(".sf-hero-media")).toBeInTheDocument();
    expect(container.querySelector(".sf-hero-copy")).not.toBeInTheDocument();
    expect(container.querySelector(".sf-hero-scrim")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "My Store" })).toHaveClass(
      "sf-visually-hidden",
    );
  });

  it("uses mobile artwork when no desktop banner exists", () => {
    const { container } = render(
      <HeroCard
        {...props}
        heroBanner={{ mobileImage: { url: "/mobile-banner.jpg" } }}
      />,
    );

    expect(container.querySelector('.sf-herocard-media img[src="/mobile-banner.jpg"]'))
      .toBeInTheDocument();
  });
});

describe("HeroSplit", () => {
  it("preserves the legacy cover default while honoring a deliberate fit choice", () => {
    const { container, rerender } = render(
      <HeroSplit {...props} banner="/banner.jpg" />,
    );
    expect(container.querySelector(".sf-media-cover")).toBeInTheDocument();

    rerender(
      <HeroSplit
        {...props}
        banner="/banner.jpg"
        heroBanner={{ imageFit: "fit" }}
      />,
    );
    expect(container.querySelector(".sf-media-canvas-fg")).toBeInTheDocument();
  });
});

describe("HeroFullBleed", () => {
  const slides = [
    { title: "First", buttonLabel: "First CTA", link: "/shop" },
    { title: "Second", buttonLabel: "Second CTA", link: "/products" },
  ] as SectionProps["heroSlides"];

  it("normalizes the seeded /shop CTA against a tenant storefront base", () => {
    render(<HeroFullBleed {...props} heroSlides={slides} />);
    expect(screen.getByRole("link", { name: "First CTA" })).toHaveAttribute("href", "/shop");
  });

  it("preserves external slide links and opens them safely", () => {
    render(
      <HeroFullBleed
        {...props}
        heroSlides={[
          { ...slides![0], link: "https://example.com/babies" },
          slides![1],
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "First CTA" })).toMatchObject({
      target: "_blank",
      rel: "noopener noreferrer",
    });
    expect(screen.getByRole("link", { name: "First CTA" })).toHaveAttribute(
      "href",
      "https://example.com/babies",
    );
  });

  it("names slide-picker dots as navigation controls", () => {
    render(<HeroFullBleed {...props} heroSlides={slides} />);
    expect(screen.getByRole("button", { name: "Go to slide 1" })).toBeInTheDocument();
  });

  it("updates the active image without remounting its media surface", () => {
    const { container } = render(
      <HeroFullBleed
        {...props}
        heroSlides={[
          { ...slides![0], image: { url: "/first.jpg" } },
          { ...slides![1], image: { url: "/second.jpg" } },
        ]}
      />,
    );
    const media = container.querySelector(".sf-hero-media");

    fireEvent.click(screen.getByRole("button", { name: "Go to slide 2" }));

    expect(container.querySelector(".sf-hero-media")).toBe(media);
    expect(container.querySelector('img[src="/second.jpg"]')).toBeInTheDocument();
  });

  it("pauses rotation while the hero is hovered or keyboard-focused", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<HeroFullBleed {...props} heroSlides={slides} />);
      const hero = container.querySelector("section")!;

      fireEvent.mouseEnter(hero);
      act(() => vi.advanceTimersByTime(5_100));
      expect(screen.getByRole("heading", { name: "First" })).toBeInTheDocument();

      fireEvent.mouseLeave(hero);
      act(() => vi.advanceTimersByTime(5_100));
      expect(screen.getByRole("heading", { name: "Second" })).toBeInTheDocument();

      fireEvent.focus(screen.getByRole("button", { name: "Go to slide 1" }));
      act(() => vi.advanceTimersByTime(5_100));
      expect(screen.getByRole("heading", { name: "Second" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("honours a slide's crop mode and focus point", () => {
    const { container } = render(
      <HeroFullBleed
        {...props}
        heroSlides={[
          {
            ...slides![0],
            image: { url: "/first.jpg" },
            imageFit: "crop",
            focal: { x: 78, y: 31 },
          },
          slides![1],
        ]}
      />,
    );

    expect(container.querySelector(".sf-hero-media-cover")).toBeInTheDocument();
    expect(container.querySelector(".sf-hero-media")).toHaveStyle({
      "--sf-hero-desktop-focus": "78% 31%",
    });
  });

  it("defaults a slide image to showing the whole photo", () => {
    const { container } = render(
      <HeroFullBleed
        {...props}
        heroSlides={[
          { ...slides![0], image: { url: "/first.jpg" } },
          slides![1],
        ]}
      />,
    );

    expect(container.querySelector(".sf-hero-media-fg")).toBeInTheDocument();
  });

  it("keeps a single image-only slide free of banner fallback copy", () => {
    const { container } = render(
      <HeroFullBleed
        {...props}
        heroBanner={{ title: "Banner fallback", primaryLabel: "Shop now" }}
        heroSlides={[{ image: { url: "/artwork.jpg" } }]}
      />,
    );

    expect(container.querySelector(".sf-hero-media")).toBeInTheDocument();
    expect(container.querySelector(".sf-hero-fullbleed-copy")).not.toBeInTheDocument();
    expect(container.querySelector(".sf-hero-fullbleed-scrim")).not.toBeInTheDocument();
    expect(screen.queryByText("Banner fallback")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Shop now" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "My Store" })).toHaveClass(
      "sf-visually-hidden",
    );
  });

  it("renders a mobile-only banner and keeps the legacy cover default", () => {
    const { container } = render(
      <HeroFullBleed
        {...props}
        heroBanner={{ mobileImage: { url: "/mobile-banner.jpg" } }}
      />,
    );

    expect(container.querySelector('.sf-hero-media-cover[src="/mobile-banner.jpg"]'))
      .toBeInTheDocument();
  });

  it("keeps carousel dots away from the left-aligned CTA", () => {
    const { container } = render(<HeroFullBleed {...props} heroSlides={slides} />);

    expect(container.querySelector(".sf-hero-fullbleed-dots")).toHaveStyle({
      right: "var(--pad)",
      bottom: "18px",
    });
  });

  it("marks an opted-in full-bleed slide for artwork-only mobile rendering", () => {
    const { container } = render(
      <HeroFullBleed
        {...props}
        heroSlides={[{ ...slides![0], hideTextOnMobile: true }, slides![1]]}
      />,
    );

    expect(container.querySelector(".sf-hero-fullbleed")).toHaveAttribute(
      "data-hide-mobile-copy",
      "true",
    );
  });
});
