"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { StoreHeroSlide } from "@/lib/storefront-client";
import { focalPosition } from "@/lib/storefront-focal";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { Icon } from "@/components/storefront/sf-icons";
import { HeroCtaLink, wrap } from "@/components/storefront/home/home-shared";

const INTERVAL_MS = 5000;

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
 * the slide's OWN choice (Customize → Hero → the slide's "This photo"): a blurred
 * fill (`.sf-hero-art-bg`) behind the full photo at `contain` (`.sf-hero-art-fg`,
 * the default, so a slide never loses its edges to a crop) or the `.sf-hero-art`
 * cover crop. Either way a scrim keeps the white text readable. Classes live in
 * storefront.css (.sf-hero-*).
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
}: {
  slides: StoreHeroSlide[];
  base: string;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  // Bumped to restart the active dot's fill animation when the timer resets.
  const [cycle, setCycle] = useState(0);
  const downX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (i: number) => {
      setCurrent(((i % count) + count) % count);
      setCycle((c) => c + 1);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setCurrent((c) => (c + 1) % count),
      INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [paused, count, cycle]);

  if (count === 0) return null;

  return (
    <div style={{ ...wrap, padding: "var(--pad)" }}>
      <div
        className={`sf-hero${paused ? " sf-hero-paused" : ""}`}
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          setCycle((c) => c + 1);
        }}
        onPointerDown={(e) => {
          downX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (downX.current === null) return;
          const dx = e.clientX - downX.current;
          downX.current = null;
          if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
        }}
      >
        {slides.map((slide, i) => {
          const img = slide.image?.mediumUrl || slide.image?.url;
          // The two sources are published as custom properties rather than
          // written into `background-image` here because which one is right is a
          // VIEWPORT question, and this component renders on the server: the
          // 800px `mediumUrl` was being stretched across a 1200px hero (and 2x
          // that on a retina panel), which is the softness owners were seeing on
          // desktop. storefront.css picks per breakpoint; see `.sf-hero-art`.
          const artVars = img
            ? ({
                "--sf-slide-img": `url("${img}")`,
                "--sf-slide-img-lg": `url("${slide.image?.url || img}")`,
              } as CSSProperties)
            : undefined;
          // Each slide answers for itself; nothing else in the shop votes. An
          // unset or unrecognised id means "show the whole photo" — see the
          // warning in the block comment above.
          const slideFit = isImageFit(slide.imageFit)
            ? mediaFitFor(slide.imageFit)
            : "canvas";
          // Only the CROPPING layers take the focal point. `-fg` is `contain`,
          // so the whole photo is already visible and moving it would only slide
          // it around inside its own letterbox.
          const focal = focalPosition(slide.focal);
          return (
            <section
              key={i}
              className={`sf-hero-slide${i === current ? " sf-hero-active" : ""}`}
              style={artVars}
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={i !== current}
            >
              {img ? (
                slideFit === "cover" ? (
                  <div className="sf-hero-art" style={{ backgroundPosition: focal }} />
                ) : (
                  <>
                    <div className="sf-hero-art-bg" style={{ backgroundPosition: focal }} />
                    <div className="sf-hero-art-fg" />
                  </>
                )
              ) : (
                <div className="sf-hero-art" style={{ background: TINTS[i % TINTS.length] }} />
              )}
              <div className="sf-hero-scrim" />
              <div className="sf-hero-copy">
                {slide.badge?.trim() ? (
                  <span className="sf-hero-badge">{slide.badge}</span>
                ) : null}
                <h1 className="sf-hero-title">{slide.title}</h1>
                {slide.subtitle?.trim() ? (
                  <p className="sf-hero-sub">{slide.subtitle}</p>
                ) : null}
                <SlideCta slide={slide} base={base} />
              </div>
            </section>
          );
        })}

        {count > 1 ? (
          <>
            {/* <button
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
            </button> */}
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
