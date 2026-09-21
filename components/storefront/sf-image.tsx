// coding-standard: maintained
import type { CSSProperties } from "react";
import { preload } from "react-dom";
import type { StorefrontImage } from "@/lib/storefront-client";
import { responsiveImageSources } from "@/lib/storefront-image";

/** The storefront's phone breakpoint, as a media query (`max-width: 679px`). */
export const SF_MOBILE_MEDIA = "(max-width: 679px)";

/**
 * The storefront's one `<img>` for uploaded photos (plan P8).
 *
 * - **`srcset` + `sizes`** over the stored variants, so a phone downloads the
 *   800px medium instead of the 1600px original for a full-width slot.
 *   `sizes` is required: without it the browser assumes `100vw` for every slot,
 *   which is exactly the over-download this exists to stop.
 * - **`priority`** is for the one image that is likely the page's LCP (the
 *   first hero): no lazy loading, `fetchpriority="high"`, and a preload hint
 *   in `<head>` so the request starts before the parser reaches the tag.
 *   Everything else is `loading="lazy"` unless the caller says otherwise.
 * - **`mobileImage`** art-directs a phone crop through `<picture>`; the preload
 *   is split by the same media query so a phone never preloads the desktop file.
 * - **`width` / `height`** reserve the box when the caller knows the ratio.
 *
 * Deliberately not `next/image`: its optimizer would re-encode R2 images on the
 * one VPS (plan §10). Pure — usable from server and client components alike.
 */
export function SfImage({
  image,
  mobileImage,
  mobileMedia = SF_MOBILE_MEDIA,
  alt,
  sizes,
  priority = false,
  loading,
  width,
  height,
  className,
  style,
  decorative = false,
}: {
  image: StorefrontImage | string | null | undefined;
  mobileImage?: StorefrontImage | string | null;
  /** Media query the phone source applies under. */
  mobileMedia?: string;
  alt: string;
  /** The rendered width per breakpoint, e.g. `"(max-width: 679px) 100vw, 50vw"`. */
  sizes: string;
  priority?: boolean;
  /** Overrides the lazy default for a non-priority image that must load at once. */
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  /** A purely visual copy (e.g. a blurred backdrop): hidden from assistive tech. */
  decorative?: boolean;
}) {
  const desktop = responsiveImageSources(image);
  if (!desktop.src) return null;
  const mobile = mobileImage ? responsiveImageSources(mobileImage) : null;
  const mobileSrc = mobile?.src ? mobile : null;

  if (priority) {
    const hint = (sources: typeof desktop, media?: string) =>
      preload(sources.src!, {
        as: "image",
        fetchPriority: "high",
        imageSrcSet: sources.srcSet,
        imageSizes: sources.srcSet ? sizes : undefined,
        media,
      });
    if (mobileSrc) {
      hint(mobileSrc, mobileMedia);
      hint(desktop, `not all and ${mobileMedia}`);
    } else {
      hint(desktop);
    }
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- R2 variants are pre-sized; see above.
    <img
      src={desktop.src}
      srcSet={desktop.srcSet}
      sizes={desktop.srcSet ? sizes : undefined}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      width={width}
      height={height}
      loading={priority ? "eager" : (loading ?? "lazy")}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
      style={style}
    />
  );

  if (!mobileSrc) return img;
  return (
    <picture style={{ display: "contents" }}>
      <source media={mobileMedia} srcSet={mobileSrc.srcSet ?? mobileSrc.src} sizes={sizes} />
      {img}
    </picture>
  );
}
