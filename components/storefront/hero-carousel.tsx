"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type { StoreHeroSlide } from "@/lib/storefront-client";
import { focalPosition } from "@/lib/storefront-focal";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { HeroMedia } from "@/components/storefront/hero-media";
import { Icon } from "@/components/storefront/sf-icons";
import { HeroCtaLink, wrap } from "@/components/storefront/home/home-shared";
import { useHeroRotation } from "@/components/storefront/use-hero-rotation";

/** Brand-tinted panel backgrounds for slides without an image (alternating). */
const TINTS = [
  `radial-gradient(90% 130% at 88% -10%, color-mix(in srgb, var(--primary) 62%, #1b1e3a) 0%, transparent 55%),
   radial-gradient(70% 110% at 10% 110%, color-mix(in srgb, var(--primary) 40%, #10121f) 0%, transparent 60%),
   linear-gradient(120deg, #171a2e 0%, #232848 100%)`,
  `radial-gradient(80% 120% at 15% -15%, color-mix(in srgb, var(--primary) 55%, #14213a) 0%, transparent 58%),
   radial-gradient(90% 130% at 95% 115%, color-mix(in srgb, var(--primary) 34%, #0e1524) 0%, transparent 55%),
   linear-gradient(300deg, #131a2b 0%, #1d2742 100%)`,
];

const ctaStyle: CSSProperties = {
  display: "inline-block",
  background: "var(--primary)",
  color: "var(--on-primary)",
  fontSize: 14,
  fontWeight: 600,
  padding: "11px 22px",
  borderRadius: 9,
  // The hero panel is always dark; a near-black brandColor would sink the
  // button without this separation (see skill: --primary may be near-black).
  border: "1px solid rgba(255, 255, 255, 0.3)",
};

function SlideCta({ slide, base }: { slide: StoreHeroSlide; base: string }) {
  if (!slide.buttonLabel?.trim()) return null;
  return (
    <HeroCtaLink base={base} link={slide.link} style={ctaStyle}>
      {slide.buttonLabel}
    </HeroCtaLink>
  );
}

/**
 * Home hero carousel — owner-managed slides (Customize → Hero).
 * Crossfade + staggered text rise, 5s autoplay (paused on hover/press, skipped
 * for reduced-motion), dots with a time-to-next fill, arrows, and swipe.
 * Slides without an image get a brand-tinted panel. With an image, the fill is
 * the slide's OWN choice (Customize → Hero → the slide's "This photo"). The
 * shared `HeroMedia` renderer either preserves the whole photo over a soft fill
 * or crops from the chosen focus point. On phones the photo and copy become two
 * rows, so a desktop-shaped upload is not forced behind mobile text.
 *
 * ⚠ **This deliberately does NOT call `useStoreImageFit()`.** It used to, which
 * meant a hero followed *Product cards → Image fit* — so changing how product
 * thumbnails crop silently re-cropped the shop's biggest picture, and the two
 * could never disagree. They are different jobs on different shapes: one grid of
 * small squares, one wide banner. A slide that has chosen nothing shows the whole
 * photo, which is the answer that can never cut a face or a word in half.
 *
 * A cropping slide is anchored on its own focal point (Customize → Hero → the
 * slide's "Focus point", `lib/storefront-focal.ts`) rather than its centre —
 * without it the phone crop, which is the narrowest box the same upload has to
 * survive, keeps whichever third of the photo happens to be in the middle.
 */
export function HeroCarousel({
  slides,
  base,
  storeName,
}: {
  slides: StoreHeroSlide[];
  base: string;
  storeName: string;
}) {
  const count = slides.length;
  // Shared with `HeroFullBleed` so the two rotating heroes keep one beat and one
  // set of pause rules — see `use-hero-rotation.ts`.
  const { current, paused, cycle, go, hoverProps, focusProps, swipeProps } =
    useHeroRotation(count);

  if (count === 0) return null;

  return (
    <div style={{ ...wrap, padding: "var(--pad)" }}>
      <div
        className={`sf-hero${paused ? " sf-hero-paused" : ""}`}
        aria-roledescription="carousel"
        {...hoverProps}
        {...focusProps}
        {...swipeProps}
      >
        {slides[current]?.title?.trim() ? null : (
          <h1 className="sf-visually-hidden">{storeName}</h1>
        )}
        {slides.map((slide, i) => {
          const primaryImage = slide.image || slide.mobileImage;
          const img = primaryImage?.mediumUrl || primaryImage?.url;
          // Each slide answers for itself; nothing else in the shop votes. An
          // unset or unrecognised id means "show the whole photo" — see the
          // warning in the block comment above.
          const slideFit = isImageFit(slide.imageFit)
            ? mediaFitFor(slide.imageFit)
            : "canvas";
          // The full foreground stays centred in canvas mode; its blurred fill
          // and every cropped image follow the merchant's chosen subject.
          const focal = focalPosition(slide.focal);
          const title = slide.title?.trim();
          const badge = slide.badge?.trim();
          const subtitle = slide.subtitle?.trim();
          const hasCopy = !!(
            title ||
            badge ||
            subtitle ||
            slide.buttonLabel?.trim()
          );
          return (
            <section
              key={i}
              className={`sf-hero-slide${i === current ? " sf-hero-active" : ""}`}
              data-hide-mobile-copy={slide.hideTextOnMobile || undefined}
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={i !== current}
            >
              {img ? (
                <HeroMedia
                  image={primaryImage!}
                  mobileImage={slide.mobileImage}
                  fit={slideFit}
                  focal={focal}
                  mobileFocal={focalPosition(slide.mobileFocal || slide.focal)}
                  eager={i === 0}
                />
              ) : (
                <div
                  className="sf-hero-media sf-hero-media-empty"
                  style={{ background: TINTS[i % TINTS.length] }}
                />
              )}
              {hasCopy ? <div className="sf-hero-scrim" /> : null}
              {hasCopy ? (
                <div className="sf-hero-copy">
                  {badge ? <span className="sf-hero-badge">{badge}</span> : null}
                  {title ? <h1 className="sf-hero-title">{title}</h1> : null}
                  {subtitle ? <p className="sf-hero-sub">{subtitle}</p> : null}
                  <SlideCta slide={slide} base={base} />
                </div>
              ) : null}
            </section>
          );
        })}

        {count > 1 ? (
          <>
            <button
              type="button"
              className="sf-hero-nav sf-hero-prev"
              aria-label="Previous slide"
              onClick={() => go(current - 1)}
            >
              <Icon name="back" size={17} />
            </button>
            <button
              type="button"
              className="sf-hero-nav sf-hero-next"
              aria-label="Next slide"
              onClick={() => go(current + 1)}
            >
              <Icon name="chevR" size={17} />
            </button>
            <div className="sf-hero-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  className={`sf-hero-dot${i === current ? " sf-hero-dot-active" : ""}`}
                  onClick={() => go(i)}
                >
                  {i === current ? (
                    <span key={`${current}-${cycle}`} className="sf-hero-fill" />
                  ) : null}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
