"use client";
// coding-standard: maintained

import Link from "next/link";
import type { StoreHeroSlide } from "@/lib/storefront-client";
import { focalPosition } from "@/lib/storefront-focal";
import { storeHref } from "@/lib/storefront-links";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { HeroMedia } from "@/components/storefront/hero-media";
import { useHeroRotation } from "@/components/storefront/use-hero-rotation";
import { HeaderSearchBar } from "@/components/storefront/header-search";
import {
  bannerPhoto,
  campaignBadge,
  HeroCtaLink,
  HeroSlideLink,
  heroBtns,
  wrap,
  type SectionProps,
} from "@/components/storefront/home/home-shared";

/**
 * The hero family — **three, and they answer one question each.**
 *
 * A page uses exactly one, and which one is the single biggest reason two shops
 * read as different businesses. What separates them is how FRAMED the hero is:
 *
 * - `hero-card` — framed. Copy and photo inside a bordered card.
 * - `hero-open` — unframed. The copy sits on the page itself, so a store that
 *   chose a tinted ground gets to show it on the first screen.
 * - `hero-fullbleed` — the photograph *is* the hero, type laid over it.
 *
 * **Three more retired on 2026-09-06**, and each for its own reason:
 *
 * - `hero-split` was the middle position on that axis — framed, with a bigger
 *   picture. A merchant choosing between four points on one axis is choosing
 *   between shades of the same decision; the ends are the decision.
 * - `hero-manifesto` was `hero-open` with no picture and centred type, and
 *   `hero-open` already collapses to one column when no banner is set. All it
 *   really added was an alignment, which is now `theme.heroAlign` — a question
 *   a merchant can answer without knowing that "Centred statement" is where
 *   alignment lives, and without silently discarding the banner they uploaded.
 * - `search-hero` had nothing composing it, and the one vertical it was built
 *   for refuses it in writing: Fresh Market's `search-first` header already
 *   carries the search box, and a hero repeating it is the page saying the same
 *   thing twice on its most expensive screen.
 *
 * **One deliberate change from the 2026-08-12 lift:** the hardcoded corner radii
 * read `--radius-lg` / `--radius-sm`, so a store on the Sharp or Round setting
 * gets it up here too.
 *
 * `heroSlides` short-circuits every static hero: an owner who built a carousel
 * gets it, whatever the section chose. That rule predates the registry and is
 * kept per-section rather than hoisted — `hero-fullbleed` still renders the
 * slides in its OWN edge-to-edge shape rather than handing off to
 * `HeroCarousel`, which is a contained card (see below). Both rotate on the
 * same beat via `useHeroRotation`.
 */

/**
 * Classic — bordered hero card, copy left and photo right on a desktop; on a
 * phone the photo leads and the trust badges become the card's footer.
 *
 * **The only static hero styled by CLASS rather than inline**, because the phone
 * layout reorders its own children and no inline style can express that. The
 * rules, and why the mobile version had to change at all, are beside
 * `.sf-herocard` in storefront.css; the DOM order here (copy, photo, badges) is
 * the desktop reading order, which the phone re-points with `order`.
 */
export function HeroCard(props: SectionProps) {
  const { base, t, banner, heroSlides, heroBanner: hb, store } = props;
  if (heroSlides?.length) {
    return <HeroCarousel slides={heroSlides} base={base} storeName={store.name} />;
  }
  const badge = hb?.badge || campaignBadge(props);
  const photo = bannerPhoto(hb);
  const bannerSrc = banner || photo.mobileSrc;
  const promises = (store.trustBadges ?? []).flatMap((item) => {
    const label = item.text?.trim();
    return label ? [label] : [];
  });
  return (
    <div style={{ ...wrap, padding: "var(--pad)" }}>
      <div className="sf-herocard">
        <div className="sf-herocard-copy">
          {/* The ACCENT, not the brand. A hero badge is the storefront's most
              purely informational chip — "Week 33 · harvest in", a campaign
              name — sitting directly above the buttons that are the brand
              colour. Painting both in `--primary` was the loudest reason a shop
              read as one hue rather than a palette. Falls back to the brand pair
              when the merchant has set no accent, so nothing changes for them. */}
          {badge ? <span className="sf-herocard-badge">{badge}</span> : null}
          <h1 className="sf-herocard-title">{hb?.title || store.name}</h1>
          {hb?.subtitle ? <p className="sf-herocard-sub">{hb.subtitle}</p> : null}
          {heroBtns(base, t, t.shopNow, hb)}
        </div>
        {/* Only when there IS one. The striped `Placeholder` exists so missing
            PRODUCT art stays honest rather than faked — but above the fold, on a
            shop that has simply not uploaded a banner yet (which is every shop on
            day one), a box captioned "hero banner" reads as a broken page, not as
            an empty slot. Rendering nothing and letting the copy run full width is
            a finished-looking default; the merchant's own banner still takes over
            the moment they add one.

            The card is a `grid-template-areas` layout on a desktop, so dropping
            this child is not enough on its own — `.sf-herocard` carries a
            `:has()` rule that collapses to one column when it is absent.

            Wrapped rather than styled directly: `<Media>` sets its own radius
            inline, and the corner differs per breakpoint (the card's own
            `overflow: hidden` clips the full-bleed phone version). */}
        {bannerSrc && (
          <div className="sf-herocard-media">
            <Media
              src={bannerSrc}
              alt=""
              label="hero banner"
              ratio="var(--herocard-ratio)"
              radius={0}
              {...photo}
            />
          </div>
        )}
        {promises.length ? <div className="sf-herocard-trust">
          {promises.map((label) => (
            <span key={label}>
              <Icon name="check" size={15} /> {label}
            </span>
          ))}
        </div> : null}
      </div>
    </div>
  );
}

/**
 * Open — the copy sits on the PAGE, with the picture in a tinted panel beside
 * it. No card, no border, no frame of any kind.
 *
 * **This exists because every other hero is a card**, and that turned out to be
 * the single loudest defect in a themed shop: a full-width `--card` block is the
 * first screen, so a store that chose a tinted ground showed near-white exactly
 * where its ground was supposed to introduce itself. Sampling the rendered
 * pixels of a designed page against ours is what caught it — the top strip of
 * the design read `#f5ead8` all the way across, ours read `#f9f4ed`, and every
 * DOM-level check had missed it because the gutters beside the card were right.
 *
 * So the shape is the point, not the decoration: `hero-card` frames the hero,
 * `hero-fullbleed` replaces the frame with a photograph, and this one refuses to
 * frame it at all. Choose it whenever the page's own colour is meant to be seen.
 *
 * **The one hero that reads `theme.heroAlign`.** Centred, with no banner, this
 * is what `hero-manifesto` used to be — and the merchant keeps their banner
 * instead of discovering it was dropped by the section they chose.
 */
export function HeroOpen(props: SectionProps) {
  const { base, t, banner, heroSlides, heroBanner: hb, store } = props;
  if (heroSlides?.length) {
    return <HeroCarousel slides={heroSlides} base={base} storeName={store.name} />;
  }
  const badge = hb?.badge || campaignBadge(props);
  const photo = bannerPhoto(hb);
  const bannerSrc = banner || photo.mobileSrc;
  const align = props.heroAlign ?? "left";
  const centred = align === "center";
  return (
    <div style={{ ...wrap, padding: "clamp(28px,5vw,64px) var(--pad) clamp(20px,3vw,40px)" }}>
      <div
        style={{
          display: "grid",
          // No banner → the copy panel takes the full width (see HeroCard).
          gridTemplateColumns: bannerSrc ? "var(--herocols)" : "1fr",
          gap: "clamp(24px,4vw,48px)",
          alignItems: "center",
        }}
      >
        {/* Centring is a TYPE decision, not a layout one, and that is why it
            needs no mobile variant: `--herocols` is `1fr` on a phone, so this
            hero is already a single column there and the only thing left to
            decide is where the words sit inside it.

            The subtitle's `maxWidth` has to be centred too — a 46ch column
            pinned to the left under a centred headline is the giveaway that a
            page was centred by half-measures. */}
        <div style={centred ? { textAlign: "center" } : undefined}>
          {/* The accent, like every other informational chip — see the note on
              `HeroCard`'s badge. */}
          {badge ? <span
            style={{
              display: "inline-block",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: 999,
              marginBottom: 18,
            }}
          >
            {badge}
          </span> : null}
          <h1
            style={{
              fontSize: "var(--h1m)",
              lineHeight: 1.02,
              fontWeight: 700,
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
              whiteSpace: "pre-line",
            }}
          >
            {hb?.title || store.name}
          </h1>
          {hb?.subtitle ? <p
            style={{
              fontSize: 17,
              color: "var(--muted)",
              lineHeight: 1.55,
              margin: centred ? "0 auto 26px" : "0 0 26px",
              maxWidth: "46ch",
            }}
          >
            {hb.subtitle}
          </p> : null}
          {heroBtns(base, t, t.shopNow, hb, align)}
        </div>
        {/* A tinted panel rather than a bare photo: the picture needs an edge to
            sit against once there is no card providing one, and `--accent-soft`
            gives it one without introducing a second near-white surface beside
            the page. Dropped entirely with no banner — an empty tinted block is
            worse than none (see HeroCard). */}
        {bannerSrc && (
        <div
          style={{
            background: "var(--accent-soft)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            padding: "clamp(14px,2vw,26px)",
          }}
        >
          <Media
            src={bannerSrc}
            alt=""
            label="lifestyle shot"
            ratio="4 / 3"
            radius={0}
            style={{ borderRadius: "var(--radius-md)" }}
            {...photo}
          />
        </div>
        )}
      </div>
    </div>
  );
}

/**
 * Full-bleed — edge-to-edge photograph with the type laid over it.
 *
 * The editorial hero, and structurally unlike the other three: no card, no
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
export function HeroFullBleed({ base, t, banner, heroSlides, heroBanner: hb, store }: SectionProps) {
  const slides = heroSlides ?? [];
  const hasSlides = slides.length > 0;
  const rotates = slides.length > 1;
  const { current, go, hoverProps, focusProps, swipeProps } =
    useHeroRotation(slides.length);
  // A selected slide owns its copy even when it is the only one. Falling back
  // to banner defaults here made an intentional image-only slide grow a title
  // and CTA it never asked for.
  const slide = hasSlides ? slides[rotates ? current : 0] : undefined;
  const badge = hasSlides ? slide?.badge?.trim() : hb?.badge?.trim();
  const title = hasSlides
    ? slide?.title?.trim()
    : hb?.title?.trim() || store.name;
  const subtitle = hasSlides ? slide?.subtitle?.trim() : hb?.subtitle?.trim();
  const ctaLabel = hasSlides
    ? slide?.buttonLabel?.trim()
    : hb?.primaryLabel?.trim() || t.startShopping;
  const hasCopy = !!(badge || title || subtitle || ctaLabel);
  const slideHasImage = Boolean(slide?.image?.url || slide?.image?.mediumUrl);
  const slideHasMobileImage = Boolean(
    slide?.mobileImage?.url || slide?.mobileImage?.mediumUrl,
  );
  const slideHasArtwork = slideHasImage || slideHasMobileImage;
  const staticBannerImage = banner || hb?.mobileImage;
  const image = slideHasImage
    ? slide!.image!
    : slideHasMobileImage
      ? slide!.mobileImage!
      : staticBannerImage;
  const imageFit = slideHasArtwork
    ? isImageFit(slide?.imageFit)
      ? mediaFitFor(slide.imageFit)
      : "canvas"
    : bannerPhoto(hb, "cover").fit;
  const imageFocal = focalPosition(slideHasArtwork ? slide?.focal : hb?.focal);
  const mobileImage = slideHasArtwork ? slide?.mobileImage : hb?.mobileImage;
  const mobileFocal = focalPosition(
    slideHasArtwork
      ? slide?.mobileFocal || slide?.focal
      : hb?.mobileFocal || hb?.focal,
  );
  return (
    <section
      className={`sf-hero-fullbleed${image ? " sf-hero-fullbleed-image" : ""}`}
      data-hide-mobile-copy={slide?.hideTextOnMobile || undefined}
      {...(rotates ? { ...hoverProps, ...focusProps, ...swipeProps } : {})}
      aria-roledescription={rotates ? "carousel" : undefined}
    >
      {!title ? <h1 className="sf-visually-hidden">{store.name}</h1> : null}
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
      {hasCopy ? <div className="sf-hero-fullbleed-copy" style={wrap}>
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
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </h1> : null}
        {subtitle ? <p className="sf-hero-fullbleed-sub" style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", lineHeight: 1.55, margin: "0 0 26px", maxWidth: 460 }}>
          {subtitle}
        </p> : null}
        {ctaLabel ? <HeroCtaLink
          base={base}
          link={hasSlides ? slide?.link : hb?.primaryLink}
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
          link={hasSlides ? slide?.link : hb?.primaryLink}
          label={title || badge || store.name}
        />
      ) : null}
        {rotates ? (
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
    </section>
  );
}
