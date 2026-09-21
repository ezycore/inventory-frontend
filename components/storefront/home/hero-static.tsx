// coding-standard: maintained
import type { CSSProperties, ReactNode } from "react";
import type { StoreHeroSlide, StorefrontImage } from "@/lib/storefront-client";
import { focalPosition } from "@/lib/storefront-focal";
import { isImageFit, mediaFitFor } from "@/lib/storefront-templates";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { brandButton, buttonMetrics } from "@/lib/storefront-button";

/**
 * The two static heroes' markup — framed (`HeroCardView`) and open
 * (`HeroOpenView`) — with copy, photo and buttons already resolved by the
 * caller. Pure, so a server component can render it: the home page's
 * `HeroCard` / `HeroOpen` pass the store banner and its copy, the Storefront
 * Builder's hero passes a single slide.
 */

/**
 * The shape the merchant chose for a hero, ready for a view to put on its root
 * element: `vars` carries `--sfb-hero-frame` and its `-m` twin, and the two
 * booleans say which of them exists.
 *
 * The booleans are not redundant with the variables. CSS cannot ask whether a
 * custom property was set, and two of the stylesheet's rules turn on exactly
 * that: the full-bleed hero lifts its `min-height` floor only where a shape
 * replaces it, and a phone-only shape must not reach the desktop. So a view
 * spreads `heroFrameAttrs(frame)` beside `style={{ ...frame?.vars }}`.
 *
 * Undefined on every classic home hero, which sets nothing and keeps the shapes
 * the stylesheet has always drawn.
 */
export interface HeroFrame {
  vars: CSSProperties;
  /** A desktop shape is set — `data-frame`. */
  base: boolean;
  /** A phone shape is set — `data-frame-m`. */
  mobile: boolean;
  /**
   * A desktop HEIGHT is set — `data-h`.
   *
   * ⚠ A height and a shape answer the same question, and a **height replaces
   * the shape** on the screen it is given, exactly as it does on the promo card
   * row: with both, an aspect box computes its width from the height and the
   * picture collapses. The stylesheet hands `--*-ratio` to `auto` wherever a
   * height applies, so the two can never both be in force on one screen.
   */
  heightBase?: boolean;
  /** A phone height is set — `data-h-m`. */
  heightMobile?: boolean;
}

/**
 * Where the picture sits relative to the copy: `side` past the breakpoint, and
 * `mobileFirst` in the phone's single column.
 *
 * Two fields and not one responsive value, because the two devices start from
 * opposite defaults — the picture is second on a desktop card and first on a
 * phone — and a responsive value inherits the desktop's until it is set, which
 * would move every existing hero's photograph below the fold.
 *
 * Both undefined on every classic home hero, which keeps the placement this
 * file has always drawn: picture right on a desktop, picture first on a phone
 * card, copy first on a phone open hero.
 */
export interface HeroPlacement {
  side?: "left" | "right";
  mobileFirst?: "picture" | "text";
}

/** `data-media-side` / `data-mobile-first` for a hero's root element. */
export const heroPlacementAttrs = (placement?: HeroPlacement) => ({
  "data-media-side": placement?.side === "left" ? "left" : undefined,
  "data-mobile-first": placement?.mobileFirst,
});

/** `data-frame` / `data-frame-m` and the height's `data-h` pair, for a hero's root. */
export const heroFrameAttrs = (frame?: HeroFrame) => ({
  "data-frame": frame?.base ? "" : undefined,
  "data-frame-m": frame?.mobile ? "" : undefined,
  "data-h": frame?.heightBase ? "" : undefined,
  "data-h-m": frame?.heightMobile ? "" : undefined,
});

/** The hero photo, as `Media` takes it. */
export interface HeroPhoto {
  src: string;
  mobileSrc?: string;
  fit: "cover" | "canvas";
  focal?: string;
  mobileFocal?: string;
}

const imageSrc = (image: StorefrontImage | null | undefined) => image?.mediumUrl || image?.url;

/**
 * One slide's photo for the two static heroes — the store banner in its place
 * where the hero uses it and the slide has none of its own.
 *
 * Unset fit shows the whole photo, as a slide and the banner always have. Lives
 * here rather than in either caller because the builder's server hero and the
 * rotating client hero both resolve the same slide the same way.
 */
export const heroSlidePhoto = (
  slide: StoreHeroSlide,
  banner?: StorefrontImage | null,
): HeroPhoto | undefined => {
  const src = imageSrc(slide.image) || imageSrc(banner) || imageSrc(slide.mobileImage);
  if (!src) return undefined;
  return {
    src,
    mobileSrc: imageSrc(slide.mobileImage),
    fit: isImageFit(slide.imageFit) ? mediaFitFor(slide.imageFit) : "canvas",
    focal: focalPosition(slide.focal),
    mobileFocal: focalPosition(slide.mobileFocal || slide.focal),
  };
};

export const heroPrimaryButton: CSSProperties = {
  ...brandButton({ radius: "var(--radius-sm)", padding: "12px 24px", fontSize: 14 }),
  fontWeight: 600,
};

export const heroSecondaryButton: CSSProperties = {
  ...buttonMetrics({ radius: "var(--radius-sm)", padding: "12px 22px", fontSize: 14 }),
  color: "var(--text)",
  border: "1px solid var(--border-strong)",
  fontWeight: 600,
};

/** The hero's button row, following the hero's own alignment. */
export function HeroActions({
  align = "left",
  children,
}: {
  align?: "left" | "center";
  children: ReactNode;
}) {
  return (
    /* `justifyContent`, not `textAlign`: the buttons are flex children, so
       centring the text around them leaves the row itself hard left. That is
       the exact failure a centred hero shows first — a centred headline over a
       left-aligned button pair reads as a layout bug rather than a choice. */
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : undefined,
      }}
    >
      {children}
    </div>
  );
}

interface HeroCopy {
  /** Text, or a builder hero's running-offer badge with its word in the shopper's language. */
  badge?: ReactNode;
  title: string;
  /** The title is the store's name standing in for one — kept for the outline, hidden from view. */
  hideTitle?: boolean;
  subtitle?: string;
  actions?: ReactNode;
  photo?: HeroPhoto;
  /**
   * The slide's "Hide text on phones", which until now only the two island
   * heroes honoured — a merchant who ticked it on a card or open hero saw
   * nothing change. Drops the copy column below 680px and keeps the photograph;
   * the rules sit beside `.sf-herocard` / `.sf-heroopen` in storefront.css.
   */
  hideMobileCopy?: boolean;
  /**
   * False on every slide of a rotating hero but the first. A grid stack keeps
   * all five in the DOM, so marking them all as the likely LCP image would have
   * the browser fetch the whole deck on the critical path — the opposite of
   * what the flag is for.
   */
  priority?: boolean;
  /**
   * `HeroSlideLink` for a slide with a destination but no button to hang it on,
   * as the islands already render. It covers the whole hero, so the caller must
   * pass it only where there is no button — two overlapping hit areas is the
   * worse answer, and here the link would paint over the buttons and swallow
   * their presses outright.
   */
  slideLink?: ReactNode;
  /**
   * Something drawn INSIDE the picture's box, over the photograph — today the
   * rotating hero's dots under `dots: "over"` (`HeroSlidesView`).
   *
   * It goes in the media wrapper rather than beside the photo because that
   * wrapper is the only element whose box IS the picture: the card's is a grid
   * area on a desktop and a full-width row on a phone, and the open hero's is a
   * padded panel, so nothing outside it can know where the picture's bottom
   * edge fell. Dropped with the photograph, which is why a caller may only ask
   * for it on a hero that has one.
   */
  mediaOverlay?: ReactNode;
}

/**
 * Whether a hero has anything to SAY, as opposed to anything to show.
 *
 * ⚠ **An image-only slide is the common case on a real shop, not an edge case.**
 * Both live merchants build hero banners with the words baked into the artwork
 * and fill in no text fields at all — so `title` is the store's name standing in
 * for one (`hideTitle`), and badge, subtitle and buttons are empty. Rendering the
 * copy element anyway hands a two-column grid a column with nothing in it and
 * squeezes the photograph into the other half, letterboxed on a blurred canvas.
 *
 * The carousel these views replaced carried the same guard and the port dropped
 * it (`hero-carousel.tsx`, deleted in 74b98613 — it read
 * `hasCopy = !!(title || badge || subtitle || buttonLabel)`). It reached
 * production on 2026-09-21 and broke both live shops' home pages; the rollback
 * and the diagnosis are in `docs/plan/storefront-builder.md` §17.
 *
 * `title` alone is NOT copy: it is always set, falling back to the store's name,
 * and `hideTitle` is how the views say it is a stand-in rather than a headline.
 */
export const heroHasCopy = ({
  badge,
  title,
  hideTitle,
  subtitle,
  actions,
}: Pick<HeroCopy, "badge" | "title" | "hideTitle" | "subtitle" | "actions">): boolean =>
  !!(badge || (title && !hideTitle) || subtitle || actions);

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
export function HeroCardView({
  badge,
  title,
  hideTitle,
  subtitle,
  actions,
  photo,
  hideMobileCopy,
  priority = true,
  slideLink,
  align = "left",
  frame,
  placement,
  promises = [],
  mediaOverlay,
}: HeroCopy & {
  align?: "left" | "center";
  frame?: HeroFrame;
  placement?: HeroPlacement;
  promises?: string[];
}) {
  return (
    /* `data-align`, not an inline style: centring a card is four rules, not one
       — the copy column, the button row's own stretch on a phone and the trust
       strip all have to agree, and `text-align` alone leaves the buttons and
       the badges hard left. They live beside `.sf-herocard` in storefront.css.
       Left is the default everywhere, so a caller that passes nothing (every
       classic home hero) renders exactly as before. */
    <div
      className="sf-herocard"
      data-align={align === "center" ? "center" : undefined}
      data-hide-mobile-copy={hideMobileCopy || undefined}
      {...heroFrameAttrs(frame)}
      {...heroPlacementAttrs(placement)}
      style={frame?.vars}
    >
      {heroHasCopy({ badge, title, hideTitle, subtitle, actions }) ? (
        <div className="sf-herocard-copy">
          {/* The ACCENT, not the brand. A hero badge is the storefront's most
              purely informational chip — "Week 33 · harvest in", a campaign
              name — sitting directly above the buttons that are the brand
              colour. Painting both in `--primary` was the loudest reason a shop
              read as one hue rather than a palette. Falls back to the brand pair
              when the merchant has set no accent, so nothing changes for them. */}
          {badge ? <span className="sf-herocard-badge">{badge}</span> : null}
          <h1 className={hideTitle ? "sf-visually-hidden" : "sf-herocard-title"}>{title}</h1>
          {subtitle ? <p className="sf-herocard-sub">{subtitle}</p> : null}
          {actions}
        </div>
      ) : (
        /* The page still needs its heading. Absolutely positioned, so unlike the
           copy column it takes no grid track — which is what lets the collapse
           rule beside `.sf-herocard` give the whole card to the photograph. */
        <h1 className="sf-visually-hidden">{title}</h1>
      )}
      {/* Only when there IS one. The striped `Placeholder` exists so missing
          PRODUCT art stays honest rather than faked — but above the fold, on a
          shop that has simply not uploaded a banner yet (which is every shop on
          day one), a box captioned "hero banner" reads as a broken page, not as
          an empty slot. Rendering nothing and letting the copy run full width is
          a finished-looking default.

          The card is a `grid-template-areas` layout on a desktop, so dropping
          this child is not enough on its own — `.sf-herocard` carries a
          `:has()` rule that collapses to one column when it is absent.

          Wrapped rather than styled directly: `<Media>` sets its own radius
          inline, and the corner differs per breakpoint (the card's own
          `overflow: hidden` clips the full-bleed phone version). */}
      {photo ? (
        <div className="sf-herocard-media">
          <Media
            {...photo}
            alt=""
            label="hero banner"
            ratio="var(--herocard-ratio)"
            radius={0}
            /* The likely LCP image: a hero sits first on nearly every page, and
               a hero moved lower costs one early request, not a slow page. Off
               for the slides behind the first one — see `priority`. */
            priority={priority}
          />
          {mediaOverlay}
        </div>
      ) : null}
      {promises.length ? (
        <div className="sf-herocard-trust">
          {promises.map((label) => (
            <span key={label}>
              <Icon name="check" size={15} /> {label}
            </span>
          ))}
        </div>
      ) : null}
      {/* Last child, and absolutely positioned, so it covers the card without
          taking a grid track of its own — the card's `grid-template-areas`
          would otherwise grow an implicit row for it. */}
      {slideLink}
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
 * where its ground was supposed to introduce itself. Choose it whenever the
 * page's own colour is meant to be seen.
 */
export function HeroOpenView({
  badge,
  title,
  hideTitle,
  subtitle,
  actions,
  photo,
  hideMobileCopy,
  priority = true,
  slideLink,
  align = "left",
  frame,
  placement,
  mediaOverlay,
}: HeroCopy & { align?: "left" | "center"; frame?: HeroFrame; placement?: HeroPlacement }) {
  const centred = align === "center";
  return (
    /* Two classes on an otherwise inline-styled hero, and only because neither
       job can be done inline: a breakpoint (`sf-heroopen-copy`, dropped below
       680px) and a whole-hero link that needs a positioned ancestor. */
    <div
      className="sf-heroopen"
      data-hide-mobile-copy={hideMobileCopy || undefined}
      {...heroFrameAttrs(frame)}
      {...heroPlacementAttrs(placement)}
      style={{
        ...frame?.vars,
        display: "grid",
        // No photo → the copy panel takes the full width (see HeroCardView).
        /* `--heroopen-cols` so the stylesheet can swap the tracks when the
           picture moves left — an inline value is otherwise unreachable from
           CSS. Unset it falls back to `--herocols`, which is `1fr` on a phone
           and `1.1fr 1fr` above, exactly as before. */
        /* Either side missing collapses it. The photo half was always here; the
           copy half is the image-only slide (`heroHasCopy`) — the same void
           column the card grew, and it has to be answered inline because an
           inline `grid-template-columns` is unreachable from the stylesheet. */
        gridTemplateColumns:
          photo && heroHasCopy({ badge, title, hideTitle, subtitle, actions })
            ? "var(--heroopen-cols, var(--herocols))"
            : "1fr",
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
      {!heroHasCopy({ badge, title, hideTitle, subtitle, actions }) ? (
        /* Image-only slide — see `heroHasCopy`. The heading still renders, out
           of the flow, so the picture gets the full width instead of sitting
           beside a void. */
        <h1 className="sf-visually-hidden">{title}</h1>
      ) : (
      <div className="sf-heroopen-copy" style={centred ? { textAlign: "center" } : undefined}>
        {/* The accent, like every other informational chip — see the note on
            `HeroCardView`'s badge. */}
        {badge ? (
          <span
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
          </span>
        ) : null}
        <h1
          className={hideTitle ? "sf-visually-hidden" : undefined}
          style={
            hideTitle
              ? undefined
              : {
                  fontSize: "var(--h1m)",
                  lineHeight: 1.02,
                  fontWeight: 700,
                  margin: "0 0 16px",
                  letterSpacing: "-0.02em",
                  whiteSpace: "pre-line",
                }
          }
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              fontSize: 17,
              color: "var(--muted)",
              lineHeight: 1.55,
              margin: centred ? "0 auto 26px" : "0 0 26px",
              maxWidth: "46ch",
            }}
          >
            {subtitle}
          </p>
        ) : null}
        {actions}
      </div>
      )}
      {/* A tinted panel rather than a bare photo: the picture needs an edge to
          sit against once there is no card providing one, and `--accent-soft`
          gives it one without introducing a second near-white surface beside
          the page. Dropped entirely with no photo — an empty tinted block is
          worse than none (see HeroCardView). */}
      {photo ? (
        /* The class exists only so the placement rules have something to order
           — this hero is inline-styled everywhere else, and `order` has to come
           from a stylesheet because it changes at a breakpoint. */
        <div
          className="sf-heroopen-media"
          style={{
            background: "var(--accent-soft)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            padding: "clamp(14px,2vw,26px)",
            /* Containing block for `mediaOverlay`, and the inset it sits at:
               this hero's picture is inset in a tinted panel, so `bottom: 0`
               would drop the dots onto the panel below the photograph rather
               than on it. The card's media has no padding and takes the `0px`
               fallback. */
            position: "relative",
            "--sf-hero-dots-inset": "clamp(14px,2vw,26px)",
          } as CSSProperties}
        >
          <Media
            {...photo}
            alt=""
            label="lifestyle shot"
            /* The merchant's shape where they chose one — the stylesheet
               resolves `--heroopen-ratio` per breakpoint, so a phone shape does
               not reach the desktop. */
            ratio="var(--heroopen-ratio, 4 / 3)"
            radius={0}
            style={{ borderRadius: "var(--radius-md)" }}
            // The likely LCP image — see HeroCardView.
            priority={priority}
          />
          {mediaOverlay}
        </div>
      ) : null}
      {/* Last child so it covers both columns — see HeroCardView. */}
      {slideLink}
    </div>
  );
}
