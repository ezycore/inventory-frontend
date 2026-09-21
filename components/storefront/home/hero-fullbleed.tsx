"use client";
// coding-standard: maintained

import type { StoreHeroSlide, StorefrontImage } from "@/lib/storefront-client";
import { focalPosition } from "@/lib/storefront-focal";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { HeroMedia } from "@/components/storefront/hero-media";
import { heroFrameAttrs, type HeroFrame } from "@/components/storefront/home/hero-static";
import { HeroCtaLink, HeroSlideLink } from "@/components/storefront/home/hero-links";
import { wrap } from "@/components/storefront/home/wrap";
import { HeroNav } from "@/components/storefront/hero-nav";
import { useHeroRotation } from "@/components/storefront/use-hero-rotation";

/**
 * What the full-bleed hero shows where no slide supplies it — the home page's
 * banner and its copy, already resolved. A builder hero passes none: its slides
 * are the whole hero.
 */
export interface HeroFullBleedFallback {
  image?: StorefrontImage | string | null;
  mobileImage?: StorefrontImage | null;
  fit: "cover" | "canvas";
  focal?: string;
  mobileFocal?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  link?: string;
}

/**
 * Full-bleed — edge-to-edge photograph with the type laid over it. Shared by the
 * home page's `HeroFullBleed` and, as an island, the Storefront Builder's hero.
 *
 * The editorial hero, and structurally unlike the other two: no card, no
 * border, no max-width, and the image is a background rather than a sibling of
 * the copy.
 *
 * **It ROTATES when the merchant has more than one slide** (2026-08-29). It used
 * to take only the first slide's image, on the reasoning that "a carousel inside
 * a full-bleed hero fights the one thing this section is for, which is a single
 * confident picture". That was overruled once a theme actually composed this
 * section: `little-steps` seeds three slides, so the shop reported "Slides
 * carousel · 3 slides" in Customize and then showed one static photograph
 * forever. Promising a slideshow and rendering a still is worse than either
 * choice made honestly.
 *
 * A single slide still has no dots or timer. Whenever slides exist, the selected
 * slide owns both artwork and copy; this is what lets an artwork-only slide stay
 * free of banner fallback text. On phones, compact optional copy overlays a
 * bottom gradient on the same image surface.
 */
export function HeroFullBleedView({
  base,
  slides,
  storeName,
  fallback,
  align = "left",
  mobileCopy,
  frame,
  nav,
  interval,
}: {
  base: string;
  slides: StoreHeroSlide[];
  storeName: string;
  fallback?: HeroFullBleedFallback;
  /**
   * Where the type sits over the photograph. The scrim here runs top to bottom
   * rather than diagonally, so unlike the dark carousel this hero can be
   * centred without the gradient pointing the wrong way. Left by default — the
   * classic home passes nothing.
   */
  align?: "left" | "center";
  /**
   * How much of the copy a phone shows. The phone has always drawn the headline
   * alone — the badge and the subtitle were deleted outright below 640px, with
   * nothing in the editor saying so — and `title-only` keeps exactly that.
   * `full` brings both back, sized for a phone rather than inherited from the
   * desktop; the rules are beside `.sf-hero-fullbleed` in storefront.css.
   *
   * Undefined, not `"title-only"`, is what the **classic home** passes: it sets
   * no attribute at all, so the stylesheet's `:not([data-mobile-copy="full"])`
   * keeps drawing that page exactly as it did.
   */
  mobileCopy?: "full" | "title-only";
  /**
   * The merchant's shape. Setting one takes this hero's `min-height` FLOOR away
   * — see the rules beside `.sf-hero-fullbleed` in storefront.css. Without that,
   * the floor wins every time and the control does nothing on the one layout
   * whose height a merchant most wants to decide.
   */
  frame?: HeroFrame;
  /**
   * What the shopper moves the slides with — dots (unset), arrows, or both.
   * This hero has always drawn its dots ON the photograph, so unlike the card
   * and open heroes it has no second PLACE to put them; where they sit is not a
   * question here, only whether they are what the merchant wants.
   */
  nav?: "dots" | "arrows" | "both";
  /** How long each slide holds, in SECONDS. Unset is the shared 5s beat. */
  interval?: number;
}) {
  const centred = align === "center";
  const hasSlides = slides.length > 0;
  const rotates = slides.length > 1;
  const { current, go, hoverProps, focusProps, swipeProps } = useHeroRotation(
    slides.length,
    interval ? interval * 1000 : undefined,
  );
  const showDots = nav !== "arrows";
  const showArrows = nav === "arrows" || nav === "both";
  // A selected slide owns its copy even when it is the only one. Falling back
  // to banner defaults here made an intentional image-only slide grow a title
  // and CTA it never asked for.
  const slide = hasSlides ? slides[rotates ? current : 0] : undefined;
  const badge = hasSlides ? slide?.badge?.trim() : fallback?.badge;
  const title = hasSlides ? slide?.title?.trim() : fallback?.title;
  const subtitle = hasSlides ? slide?.subtitle?.trim() : fallback?.subtitle;
  const ctaLabel = hasSlides ? slide?.buttonLabel?.trim() : fallback?.ctaLabel;
  const link = hasSlides ? slide?.link : fallback?.link;
  const hasCopy = !!(badge || title || subtitle || ctaLabel);
  const slideHasImage = Boolean(slide?.image?.url || slide?.image?.mediumUrl);
  const slideHasMobileImage = Boolean(
    slide?.mobileImage?.url || slide?.mobileImage?.mediumUrl,
  );
  const slideHasArtwork = slideHasImage || slideHasMobileImage;
  const image = slideHasImage
    ? slide!.image!
    : slideHasMobileImage
      ? slide!.mobileImage!
      : fallback?.image;
  const imageFit = slideHasArtwork
    ? isImageFit(slide?.imageFit)
      ? mediaFitFor(slide.imageFit)
      : "canvas"
    : (fallback?.fit ?? "cover");
  const imageFocal = slideHasArtwork ? focalPosition(slide?.focal) : fallback?.focal;
  const mobileImage = slideHasArtwork ? slide?.mobileImage : fallback?.mobileImage;
  const mobileFocal = slideHasArtwork
    ? focalPosition(slide?.mobileFocal || slide?.focal)
    : fallback?.mobileFocal;
  return (
    <section
      className={`sf-hero-fullbleed${image ? " sf-hero-fullbleed-image" : ""}`}
      data-align={centred ? "center" : undefined}
      data-hide-mobile-copy={slide?.hideTextOnMobile || undefined}
      data-mobile-copy={mobileCopy === "full" ? "full" : undefined}
      {...heroFrameAttrs(frame)}
      style={frame?.vars}
      {...(rotates ? { ...hoverProps, ...focusProps, ...swipeProps } : {})}
      aria-roledescription={rotates ? "carousel" : undefined}
    >
      {!title ? <h1 className="sf-visually-hidden">{storeName}</h1> : null}
      {/* Keep only the active photograph in the document. Painting every slide
          made the browser fetch the whole hero deck during the LCP path. */}
      {image ? (
        <HeroMedia
          image={image}
          mobileImage={mobileImage}
          fit={imageFit}
          focal={imageFocal}
          mobileFocal={mobileFocal}
          eager={current === 0}
        />
      ) : null}
      {/* Scrim, not a tint: type over an unknown photograph is unreadable
          without one, and the merchant's photo is genuinely unknown. */}
      {hasCopy ? <div className="sf-hero-fullbleed-scrim" /> : null}
      {hasCopy ? <div className="sf-hero-fullbleed-copy" style={centred ? { ...wrap, textAlign: "center" } : wrap}>
        {badge ? <span className="sf-hero-fullbleed-badge" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.82)", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 }}>
          {badge}
        </span> : null}
        {title ? <h1
          className="sf-hero-fullbleed-title"
          style={{
            fontSize: "var(--h1m)",
            lineHeight: 1.02,
            fontWeight: 700,
            color: "#fff",
            margin: "14px 0 18px",
            letterSpacing: "-0.035em",
            maxWidth: 620,
            // The `maxWidth` is what pins these left; centring the text without
            // centring the column leaves a 620px block hard against the gutter.
            marginInline: centred ? "auto" : undefined,
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </h1> : null}
        {subtitle ? <p className="sf-hero-fullbleed-sub" style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", lineHeight: 1.55, margin: "0 0 26px", maxWidth: 460, marginInline: centred ? "auto" : undefined }}>
          {subtitle}
        </p> : null}
        {ctaLabel ? <HeroCtaLink
          base={base}
          link={link}
          style={{
            display: "inline-block",
            background: "#fff",
            color: "#111",
            padding: "14px 34px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {ctaLabel}
        </HeroCtaLink> : null}
        {/* Dots, and they are not decoration: without them a shopper cannot tell
            the photograph is going to change, and cannot go back to the one they
            were reading. No arrows — this hero has no frame to hang them on, and
            the section is swipeable. */}
      </div> : null}
      {/* Same fallback as the carousel: a destination with no button becomes the
          slide itself. Placed after the copy so it covers the photograph, and
          before the dots, which carry `zIndex: 3` and stay clickable. */}
      {!ctaLabel ? (
        <HeroSlideLink
          base={base}
          link={link}
          label={title || badge || storeName}
        />
      ) : null}
        {rotates && showDots ? (
          <div className="sf-hero-fullbleed-dots" style={{ position: "absolute", zIndex: 3, display: "flex", gap: 8, right: "var(--pad)", bottom: 18 }}>
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                style={{
                  width: i === current ? 26 : 9,
                  height: 9,
                  padding: 0,
                  border: 0,
                  borderRadius: 999,
                  cursor: "pointer",
                  background:
                    i === current ? "#fff" : "rgba(255,255,255,0.45)",
                  transition: "width 300ms ease, background 300ms ease",
                }}
              />
            ))}
          </div>
        ) : null}
        {rotates && showArrows ? (
          <HeroNav onPrevious={() => go(current - 1)} onNext={() => go(current + 1)} />
        ) : null}
    </section>
  );
}
