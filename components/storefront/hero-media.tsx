// coding-standard: maintained

import type { CSSProperties } from "react";
import type { StorefrontImage } from "@/lib/storefront-client";
import { responsiveImageSources } from "@/lib/storefront-image";
import { SfImage } from "@/components/storefront/sf-image";

type HeroImage = StorefrontImage | string;

/**
 * The hero's phone query. 640px rather than the storefront's 680px because the
 * hero crop rules in `storefront.css` switch at 640px, and the source swap and
 * the focus-point swap must move together.
 */
const HERO_MOBILE_MEDIA = "(max-width: 640px)";

/**
 * One responsive renderer for the carousel and full-bleed hero photographs.
 * `canvas` preserves every edge over a soft fill; `cover` fills the frame from
 * the merchant's chosen focal point. Keeping both hero families on this one
 * renderer prevents a template from silently ignoring the editor controls.
 *
 * `eager` marks the likely LCP image (the first slide): `SfImage` then preloads
 * it with high priority. Every slide still loads eagerly, as before — a lazy
 * off-screen slide would flash empty when the carousel advances to it.
 */
export function HeroMedia({
  image,
  mobileImage,
  fit,
  focal,
  mobileFocal,
  eager = false,
  className,
}: {
  image: HeroImage;
  mobileImage?: HeroImage | null;
  fit: "cover" | "canvas";
  focal?: string;
  mobileFocal?: string;
  eager?: boolean;
  className?: string;
}) {
  if (!responsiveImageSources(image).src) return null;

  const position = focal || "center";
  const style = {
    "--sf-hero-desktop-focus": position,
    "--sf-hero-mobile-focus": mobileFocal || position,
  } as CSSProperties;

  const photo = (imageClassName: string, priority: boolean) => (
    <SfImage
      image={image}
      mobileImage={mobileImage}
      mobileMedia={HERO_MOBILE_MEDIA}
      sizes="100vw"
      alt=""
      decorative
      priority={priority}
      loading="eager"
      className={imageClassName}
    />
  );

  return (
    <div className={`sf-hero-media${className ? ` ${className}` : ""}`} style={style}>
      {fit === "canvas" ? (
        <>
          {/* Same priority as the foreground: this copy is first in the DOM and
              shares its URL, so it decides the download's priority. */}
          {photo("sf-hero-media-bg", eager)}
          {photo("sf-hero-media-fg", eager)}
        </>
      ) : (
        photo("sf-hero-media-cover", eager)
      )}
    </div>
  );
}
