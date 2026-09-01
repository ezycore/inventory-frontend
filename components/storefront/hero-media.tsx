// coding-standard: maintained

import type { CSSProperties } from "react";
import type { StorefrontImage } from "@/lib/storefront-client";

type HeroImage = StorefrontImage | string;

const imageSources = (image: HeroImage) => {
  if (typeof image === "string") return { src: image, srcSet: undefined };

  const src = image.url || image.mediumUrl || "";
  const srcSet = [
    image.mediumUrl ? `${image.mediumUrl} 800w` : null,
    image.url ? `${image.url} 1600w` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return { src, srcSet: srcSet || undefined };
};

/**
 * One responsive renderer for the carousel and full-bleed hero photographs.
 * `canvas` preserves every edge over a soft fill; `cover` fills the frame from
 * the merchant's chosen focal point. Keeping both hero families on this one
 * renderer prevents a template from silently ignoring the editor controls.
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
  const { src, srcSet } = imageSources(image);
  const mobile = mobileImage ? imageSources(mobileImage) : undefined;
  if (!src) return null;

  const position = focal || "center";
  const style = {
    "--sf-hero-desktop-focus": position,
    "--sf-hero-mobile-focus": mobileFocal || position,
  } as CSSProperties;
  const imageProps = {
    src,
    srcSet,
    sizes: "100vw",
  } as const;
  const responsiveImage = (
    className: string,
    priority: boolean,
  ) => (
    <picture style={{ display: "contents" }}>
      {mobile?.src ? (
        <source
          media="(max-width: 640px)"
          srcSet={mobile.srcSet || mobile.src}
          sizes="100vw"
        />
      ) : null}
      <img
        {...imageProps}
        alt=""
        aria-hidden="true"
        className={className}
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );

  return (
    <div className={`sf-hero-media${className ? ` ${className}` : ""}`} style={style}>
      {fit === "canvas" ? (
        <>
          {responsiveImage("sf-hero-media-bg", false)}
          {responsiveImage("sf-hero-media-fg", eager)}
        </>
      ) : (
        responsiveImage("sf-hero-media-cover", eager)
      )}
    </div>
  );
}
