import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  HeroCard,
  HeroFullBleed,
  HeroOpen,
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

/**
 * ⚠ **The classic home is what LIVE shops render**, and it shares every hero
 * renderer with the Storefront Builder (plan §0.3 of
 * `storefront-hero-shape-controls.md`). The builder's shape and placement
 * settings reach those views as props these callers do not pass, and every one
 * of them is inert when unset — the stylesheet's rules are all gated on a
 * `data-` attribute the builder alone emits.
 *
 * This asserts the ABSENCE, because absence is the whole promise: an attribute
 * that leaked here would hand a live shop a shape, a placement or a phone-copy
 * rule its owner never chose, and no other test in this file would notice.
 */
describe("the classic home stays untouched by the builder's hero settings", () => {
  const BUILDER_ONLY = [
    "data-frame",
    "data-frame-m",
    "data-media-side",
    "data-mobile-first",
    "data-mobile-copy",
  ];

  it.each([
    ["HeroCard", HeroCard],
    ["HeroOpen", HeroOpen],
    ["HeroFullBleed", HeroFullBleed],
  ])("%s emits no builder-only attribute and no shape variable", (_name, Hero) => {
    const { container } = render(<Hero {...props} />);
    for (const attr of BUILDER_ONLY) {
      expect(container.querySelector(`[${attr}]`)).toBeNull();
    }
    // The variables travel with the attributes; neither may appear here.
    expect(container.innerHTML).not.toContain("--sfb-hero-frame");
    expect(container.innerHTML).not.toContain("--sfb-hero-pad");
  });
});

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

  it("renders an image-only slide as a card, without an invented copy overlay", () => {
    const { container } = render(
      <HeroCard
        {...props}
        heroSlides={[{ image: { url: "/artwork.jpg" } }]}
      />,
    );

    /* Decision D1: a shop that chose the framed card keeps it once slides
       exist. This used to render `HeroCarousel` — `.sf-hero-media` over a dark
       scrim, edge to edge — which is a different section from the one the
       merchant picked. */
    expect(container.querySelector(".sf-herocard")).toBeInTheDocument();
    expect(container.querySelector(".sf-hero-media")).not.toBeInTheDocument();
    expect(container.querySelector(".sf-hero-scrim")).not.toBeInTheDocument();
    expect(container.querySelector("img")?.getAttribute("src")).toContain("artwork.jpg");
    expect(screen.getByRole("heading", { level: 1, name: "My Store" })).toHaveClass(
      "sf-visually-hidden",
    );
  });

  it("keeps the open hero open, and the store's promises under the card, once slides exist", () => {
    const slides = [{ title: "First" }, { title: "Second" }];
    const card = render(
      <HeroCard
        {...props}
        store={{ ...props.store, trustBadges: [{ text: "Pickup available" }] }}
        heroSlides={slides}
      />,
    );
    expect(card.container.querySelector(".sf-herocard-trust")?.textContent).toContain(
      "Pickup available",
    );
    // Two slides rotate: one dot each, under the card rather than on it.
    expect(card.container.querySelectorAll(".sf-heroslides-dots button")).toHaveLength(2);

    const open = render(<HeroOpen {...props} heroSlides={slides} />);
    expect(open.container.querySelector(".sf-heroopen")).toBeInTheDocument();
    expect(open.container.querySelector(".sf-herocard")).toBeNull();
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

/**
 * The alignment that replaced the `hero-manifesto` SECTION.
 *
 * The failure to watch for is a half-centred hero: a centred headline over a
 * button row still pinned hard left, which reads as a layout bug rather than a
 * choice. The buttons are flex children, so `textAlign` alone does not move
 * them — `heroBtns` takes the alignment and sets `justifyContent`.
 */
describe("HeroOpen alignment", () => {
  const banner = { title: "Handmade in Dhaka", subtitle: "Small batches." };

  it("is left-aligned when the merchant has never chosen", () => {
    const { container } = render(<HeroOpen {...props} heroBanner={banner} />);
    expect(container.querySelector('[style*="text-align: center"]')).toBeNull();
  });

  it("centres the copy AND the buttons under it", () => {
    const { container } = render(
      <HeroOpen {...props} heroBanner={banner} heroAlign="center" />,
    );
    expect(container.querySelector('[style*="text-align: center"]')).toBeInTheDocument();
    expect(
      container.querySelector('[style*="justify-content: center"]'),
    ).toBeInTheDocument();
  });

  // What `hero-manifesto` was: centred, no picture, one column. The merchant
  // keeps the banner they uploaded instead of the section discarding it.
  it("still shows the banner when centred", () => {
    const { container } = render(
      <HeroOpen {...props} heroBanner={banner} heroAlign="center" banner="/banner.jpg" />,
    );
    expect(container.querySelector("img")).toBeInTheDocument();
  });
});

describe("HeroFullBleed", () => {
  /* Moved here from `HeroSplit` when that section retired: this is the only
     caller left passing `bannerPhoto(hb, "cover")`, and the default is what
     stops an owner's static banner being letterboxed inside a full-bleed
     section it was cropped for. */
  it("preserves the legacy cover default while honoring a deliberate fit choice", () => {
    const { container, rerender } = render(
      <HeroFullBleed {...props} banner="/banner.jpg" />,
    );
    // `HeroMedia` paints one cover image, or a blurred bg + contained fg.
    expect(container.querySelector(".sf-hero-media-cover")).toBeInTheDocument();

    rerender(
      <HeroFullBleed
        {...props}
        banner="/banner.jpg"
        heroBanner={{ imageFit: "fit" }}
      />,
    );
    expect(container.querySelector(".sf-hero-media-cover")).toBeNull();
    expect(container.querySelector(".sf-hero-media-fg")).toBeInTheDocument();
  });

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
