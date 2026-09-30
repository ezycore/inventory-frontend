// coding-standard: maintained
/**
 * The hero views the builder's hero section and its full-bleed islands draw.
 * The harnesses below pass the views what a section passes, so every assertion
 * reads the shared renderer.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dict } from "@/lib/storefront-i18n";
import type { StoreHeroSlide, StorefrontStore, StorefrontImage } from "@/lib/storefront-client";
import { focalPosition } from "@/lib/storefront-focal";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { HeroSlidesView } from "@/components/storefront/hero-slides";
import { HeroFullBleedView } from "@/components/storefront/home/hero-fullbleed";

/** The static banner's words and phone picture, as the harness below reads them. */
interface HeroBannerFixture {
  title?: string;
  badge?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryLink?: string;
  imageFit?: string;
  focal?: { x: number; y: number };
  mobileFocal?: { x: number; y: number };
  mobileImage?: StorefrontImage | null;
}

/** What a hero is handed in these tests. */
interface SectionProps {
  base: string;
  t: Dict;
  banner?: string;
  heroSlides?: StoreHeroSlide[];
  heroBanner?: HeroBannerFixture;
  store: StorefrontStore;
}

const props = {
  base: "/shop",
  t: {
    shopNow: "Shop now",
  },
  store: { name: "My Store", trustBadges: [] },
} as SectionProps;

/** A full-bleed hero, fed the way a section feeds it. */
function HeroFullBleed({ base, t, banner, heroSlides, heroBanner: hb, store }: SectionProps) {
  return (
    <HeroFullBleedView
      base={base}
      slides={heroSlides ?? []}
      storeName={store.name}
      fallback={{
        image: banner || hb?.mobileImage,
        mobileImage: hb?.mobileImage,
        fit: isImageFit(hb?.imageFit) ? mediaFitFor(hb.imageFit) : "cover",
        focal: focalPosition(hb?.focal),
        mobileFocal: focalPosition(hb?.mobileFocal || hb?.focal),
        badge: hb?.badge?.trim(),
        title: hb?.title?.trim() || store.name,
        subtitle: hb?.subtitle?.trim(),
        ctaLabel: hb?.primaryLabel?.trim() || t.startShopping,
        link: hb?.primaryLink,
      }}
    />
  );
}

/** A card or open hero with slides. */
const Slides = ({ layout, slides }: { layout: "card" | "open"; slides: SectionProps["heroSlides"] }) => (
  <HeroSlidesView base="/shop" slides={slides ?? []} storeName="My Store" layout={layout} promises={[]} />
);

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

/**
 * ⚠ **The shape both live merchants actually have.** UriiBaba stores 4 hero
 * slides and LunoraBaby 1, and every one of them carries an image and NO text:
 * the words are baked into the artwork. That is not an edge case, it is how a
 * banner is made — and it was the one slide shape no test asserted the layout
 * of, which is how 2026-09-21's regression reached both shops' home pages
 * (`docs/plan/storefront-builder.md` §17).
 *
 * Each case asserts the copy element is ABSENT rather than empty: the grid
 * collapses on the child's absence, so an empty child is the defect itself.
 */
describe("a hero with a picture and nothing to say", () => {
  const imageOnly = [{ image: { url: "/banner.jpg" } }] as SectionProps["heroSlides"];

  it("gives the card's whole width to the picture", () => {
    const { container } = render(<Slides layout="card" slides={imageOnly} />);
    expect(container.querySelector(".sf-herocard-copy")).toBeNull();
    expect(container.querySelector(".sf-herocard-media")).toBeInTheDocument();
    // The page keeps a heading; it is simply not a column.
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("sf-visually-hidden");
  });

  it("gives the open hero's whole width to the picture", () => {
    const { container } = render(<Slides layout="open" slides={imageOnly} />);
    expect(container.querySelector(".sf-heroopen-copy")).toBeNull();
    /* The open hero's columns are INLINE — a stylesheet cannot reach them — so
       the collapse has to be in the style attribute, not in a rule. */
    expect(container.querySelector<HTMLElement>(".sf-heroopen")?.style.gridTemplateColumns).toBe(
      "1fr",
    );
  });

  it("still lays out two columns as soon as the slide says anything", () => {
    const withCopy = [
      { image: { url: "/banner.jpg" }, title: "Winter sale" },
    ] as SectionProps["heroSlides"];
    const card = render(<Slides layout="card" slides={withCopy} />);
    expect(card.container.querySelector(".sf-herocard-copy")).toBeInTheDocument();

    const open = render(<Slides layout="open" slides={withCopy} />);
    expect(open.container.querySelector(".sf-heroopen-copy")).toBeInTheDocument();
    expect(
      open.container.querySelector<HTMLElement>(".sf-heroopen")?.style.gridTemplateColumns,
    ).not.toBe("1fr");
  });

  it("counts a badge, a subtitle or a button as something to say", () => {
    for (const slide of [
      { image: { url: "/b.jpg" }, badge: "New" },
      { image: { url: "/b.jpg" }, subtitle: "Free delivery" },
      { image: { url: "/b.jpg" }, buttonLabel: "Shop" },
    ]) {
      const { container, unmount } = render(
        <Slides layout="card" slides={[slide] as SectionProps["heroSlides"]} />,
      );
      expect(container.querySelector(".sf-herocard-copy")).toBeInTheDocument();
      unmount();
    }
  });
});
