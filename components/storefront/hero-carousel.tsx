"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { StoreHeroSlide } from "@/lib/storefront-client";
import { Icon } from "@/components/storefront/sf-icons";
import { HeroCtaLink, wrap } from "@/components/storefront/home/home-shared";
import { useStoreImageFit } from "@/services/storefront/use-image-fit";

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
 * the merchant's choice (Customize → Product cards → Image fit, `useStoreImageFit`):
 * a blurred fill (`.sf-hero-art-bg`) behind the full photo at `contain`
 * (`.sf-hero-art-fg`, default, so a slide never loses its edges to a crop) or the
 * classic `.sf-hero-art` cover crop. Either way a scrim keeps the white text
 * readable. Classes live in storefront.css (.sf-hero-*).
 */
export function HeroCarousel({
  slides,
  base,
}: {
  slides: StoreHeroSlide[];
  base: string;
}) {
  const fit = useStoreImageFit();
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
          return (
            <section
              key={i}
              className={`sf-hero-slide${i === current ? " sf-hero-active" : ""}`}
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={i !== current}
            >
              {img ? (
                fit === "cover" ? (
                  <div className="sf-hero-art" style={{ backgroundImage: `url("${img}")` }} />
                ) : (
                  <>
                    <div className="sf-hero-art-bg" style={{ backgroundImage: `url("${img}")` }} />
                    <div className="sf-hero-art-fg" style={{ backgroundImage: `url("${img}")` }} />
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
