"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import type { StoreHeroSlide, StorefrontImage } from "@/lib/storefront-client";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { HeroCtaLink, HeroSlideLink } from "@/components/storefront/home/hero-links";
import {
  HeroActions,
  HeroCardView,
  HeroOpenView,
  heroPrimaryButton,
  heroSecondaryButton,
  heroSlidePhoto,
  type HeroFrame,
  type HeroPlacement,
} from "@/components/storefront/home/hero-static";
import { useHeroRotation } from "@/components/storefront/use-hero-rotation";

/**
 * The card and open heroes, rotating — **the section a merchant chose, still
 * the section they get once they add a second slide.**
 *
 * Both used to hand off to a dark, edge-to-edge photo carousel the moment slides
 * existed — structurally the opposite of a bordered card or of copy sitting on
 * the page. Nothing in the editor said so. A merchant picked Card, added a
 * slide, and the section became a different section. This draws
 * the slides in the shape they picked instead, on the same beat and with the
 * same pause, swipe and reduced-motion rules as the other two rotating heroes,
 * because all three share `useHeroRotation`.
 *
 * **Every slide stays in the DOM, stacked in one grid cell.** That is what lets
 * the box size itself to the tallest slide so its height never jumps mid-
 * rotation, and it is why only the first slide's photo is `priority`: five
 * priority hero images would undo the LCP care the static path takes. The
 * inactive slides are `inert` and `aria-hidden`, so neither a pointer nor the
 * tab order reaches a slide nobody can see.
 *
 * **Dots and swipe, no arrows** (decision D4). The carousel's arrows are white
 * chevrons on a translucent dark pill, drawn for a photograph; over a light
 * bordered card they need a visual treatment of their own, and the piece most
 * likely to look bolted on is the one worth leaving out.
 */
export function HeroSlidesView({
  base,
  slides,
  storeName,
  layout,
  align = "left",
  banner,
  storeWords,
  campaignLabel,
  frame,
  placement,
  promises = [],
}: {
  base: string;
  slides: StoreHeroSlide[];
  storeName: string;
  layout: "card" | "open";
  align?: "left" | "center";
  /** The store banner, for a hero that fills artwork-less slides with it. */
  banner?: StorefrontImage | null;
  /** The classic banner hero's wording: both buttons always, catalogue by default. */
  storeWords?: boolean;
  /**
   * The running offer without its last word ("Eid sale · 10%"), drawn on any
   * slide whose own badge is empty (decision D6) — it describes what the shop
   * is doing, not what this slide says. It arrives as text because the word
   * "off" is the shopper's and lives in the dictionary this component reads.
   */
  campaignLabel?: string;
  /**
   * The merchant's shape, handed to EVERY slide rather than to the stack. The
   * slides share one grid cell, so one shape on the wrapper would not reach the
   * `Media` calls that read it — and giving them all the same one is what keeps
   * the box from resizing as the slides cross-fade.
   */
  frame?: HeroFrame;
  /** Where the picture sits, handed to every slide for the same reason as `frame`. */
  placement?: HeroPlacement;
  /** The store's promises. Card only, and identical on every slide — see below. */
  promises?: string[];
}) {
  const { t } = useStorefrontUI();
  const count = slides.length;
  const rotates = count > 1;
  const { current, cycle, paused, go, hoverProps, focusProps, swipeProps } = useHeroRotation(count);

  return (
    <div
      className={`sf-heroslides${paused ? " sf-hero-paused" : ""}`}
      {...(rotates ? { ...hoverProps, ...focusProps, ...swipeProps } : {})}
      aria-roledescription={rotates ? "carousel" : undefined}
    >
      {slides.map((slide, i) => {
        const active = i === current;
        const title = slide.title?.trim();
        const badge = slide.badge?.trim();
        const secondaryLabel = slide.secondaryLabel?.trim();
        const primary = slide.buttonLabel?.trim();
        let actions: ReactNode = null;
        if (storeWords) {
          // The classic banner hero's pair: both buttons always, each going to
          // the catalogue where the merchant set no link.
          actions = (
            <HeroActions align={align}>
              <HeroCtaLink base={base} link={slide.link} style={heroPrimaryButton}>
                {primary || t.shopNow}
              </HeroCtaLink>
              <HeroCtaLink base={base} link={slide.secondaryLink} style={heroSecondaryButton}>
                {secondaryLabel || t.browseCats}
              </HeroCtaLink>
            </HeroActions>
          );
        } else {
          /* The label alone, as every other hero does — see the note in
             `hero.tsx`. An empty link means the catalogue, not "no button". */
          const hasPrimary = !!primary;
          const hasSecondary = !!secondaryLabel;
          if (hasPrimary || hasSecondary) {
            actions = (
              <HeroActions align={align}>
                {hasPrimary ? (
                  <HeroCtaLink base={base} link={slide.link} style={heroPrimaryButton}>
                    {primary}
                  </HeroCtaLink>
                ) : null}
                {hasSecondary ? (
                  <HeroCtaLink base={base} link={slide.secondaryLink} style={heroSecondaryButton}>
                    {secondaryLabel}
                  </HeroCtaLink>
                ) : null}
              </HeroActions>
            );
          }
        }
        const copy = {
          badge:
            badge ||
            (campaignLabel ? `${campaignLabel} ${t.campaignOff}` : undefined) ||
            undefined,
          title: title || storeName,
          hideTitle: !title && !storeWords,
          subtitle: slide.subtitle?.trim() || undefined,
          actions,
          photo: heroSlidePhoto(slide, banner),
          hideMobileCopy: slide.hideTextOnMobile,
          priority: i === 0,
          slideLink: actions ? null : (
            <HeroSlideLink
              base={base}
              link={slide.link}
              label={title || badge || `Slide ${i + 1} of ${count}`}
              reachable={active}
            />
          ),
        };
        return (
          <div
            key={i}
            className="sf-heroslides-slide"
            data-active={active ? "true" : undefined}
            role="group"
            aria-label={`${i + 1} / ${count}`}
            aria-hidden={!active}
            inert={!active}
          >
            {layout === "open" ? (
              <HeroOpenView {...copy} align={align} frame={frame} placement={placement} />
            ) : (
              /* The promises go on EVERY card, not once beneath the stack.
                 They belong inside the card's border — that footer strip is
                 part of the shape this component exists to preserve, and a
                 detached strip under a bordered card is not that shape. The
                 copies are identical, so nothing about them appears to change
                 as the slides cross-fade, which is what decision D6 is for. */
              <HeroCardView
                {...copy}
                align={align}
                frame={frame}
                placement={placement}
                promises={promises}
              />
            )}
          </div>
        );
      })}

      {rotates ? (
        <div className="sf-heroslides-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current}
              className={`sf-hero-dot${i === current ? " sf-hero-dot-active" : ""}`}
              onClick={() => go(i)}
            >
              {i === current ? <span key={`${current}-${cycle}`} className="sf-hero-fill" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
