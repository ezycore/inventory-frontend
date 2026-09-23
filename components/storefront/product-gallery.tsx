"use client";
// coding-standard: maintained
/**
 * PDP gallery — thumbnail rail + hero image with hover-to-magnify.
 *
 * Two layouts, picked by the product template: `top` (full-width hero above the
 * info column, thumbs in a row under it) and `side` (vertical thumb rail beside
 * the hero). The `side` rail flips to a scrollable strip below 680px via
 * `.sf-pdp-*` in storefront.css — inline styles can't carry a media query.
 *
 * The magnify is mouse-only by construction (`pointerType`), so a tap on a
 * touch screen can't leave the hero stuck zoomed with no way to leave it.
 *
 * The hero's crop follows the merchant's `useStoreImageFit()` choice like every
 * other storefront photo. In canvas mode the zoom transform lands on `<Media>`'s
 * wrapper div rather than a bare `<img>` — safe, because `zoomOrigin()` reads its
 * percentage off `.sf-pdp-zoom`'s own bounding rect (the outer hover-tracking
 * box), not the image element, and the wrapper fills that box identically to how
 * the `<img>` used to.
 */
import { useState, type CSSProperties, type PointerEvent } from "react";
import { fullImageUrl, thumbImageUrl } from "@/lib/storefront-image";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { SF_MOBILE_MEDIA } from "@/components/storefront/sf-image";
import { useStoreImageFit } from "@/services/storefront/use-image-fit";
import { useStoreImageRatio } from "@/services/storefront/use-image-ratio";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import type { StorefrontImage } from "@/lib/storefront-client";

/** How far the hero magnifies under the pointer. */
const ZOOM = 2.4;
/** Thumbnails shown; the rest of the gallery is reachable by cycling these. */
const MAX_THUMBS = 4;
const RADIUS = 14;
/**
 * The hero's `srcset` width. Phones render it full width, so they take the 800px
 * medium instead of the 1600px original — a fifth of the bytes for a real upload,
 * on the page's LCP image. Wider screens claim the original on purpose: the hover
 * zoom magnifies 2.4×, which the medium would blur.
 */
const HERO_SIZES = `${SF_MOBILE_MEDIA} 100vw, 1600px`;

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

/**
 * `transform-origin` for a pointer position inside the hero, as a percent pair.
 *
 * The point under the cursor is the one that stays put while the image scales,
 * which is what makes the magnified area track the pointer. Clamped because a
 * pointermove can report a coordinate a fraction outside the box mid-gesture,
 * which would otherwise pan past the image edge and show background.
 */
export function zoomOrigin(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
): string {
  if (!rect.width || !rect.height) return "50% 50%";
  const x = clampPct(((clientX - rect.left) / rect.width) * 100);
  const y = clampPct(((clientY - rect.top) / rect.height) * 100);
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
}

const thumbBtn = (active: boolean): CSSProperties => ({
  padding: 0,
  background: "none",
  cursor: "pointer",
  borderRadius: 10,
  overflow: "hidden",
  border: active ? "2px solid var(--primary)" : "2px solid transparent",
});

export function ProductGallery({
  images,
  alt,
  layout,
  index,
  onSelect,
  imageFit,
}: {
  images: StorefrontImage[];
  alt: string;
  layout: "top" | "side";
  /** Raw selection from the page — clamped here, since a variant switch can
   *  swap in a shorter image list than the one that was being browsed. */
  index: number;
  onSelect: (index: number) => void;
  /**
   * The `product-main` section's own fit, where the merchant set one. Unset
   * follows the store, which is every classic product page and every landing
   * page's Single product section — so this prop is absent on both.
   *
   * Its twin, the SHAPE, does not travel as a prop: it has to differ per screen
   * and an inline `aspect-ratio` cannot carry a media query, so the section
   * writes a custom property instead and the hero reads it below.
   */
  imageFit?: "cover" | "canvas";
}) {
  const { t } = useStorefrontUI();
  // Both hooks run unconditionally and the prop wins after — `??` around a hook
  // call would skip it whenever the section set a fit, which is a hook order
  // that changes with a prop.
  const storeFit = useStoreImageFit();
  const fit = imageFit ?? storeFit;
  const imageRatio = useStoreImageRatio();
  const previewMobile = useSfPreview((s) => s.previewDevice === "mobile");
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const activeIdx = Math.max(0, Math.min(index, images.length - 1));
  const active = images[activeIdx];
  const main = fullImageUrl(active);
  const thumbs = images.slice(0, MAX_THUMBS);

  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    setOrigin(zoomOrigin(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY));
    setZoomed(true);
  };

  const hero = (
    <div
      className="sf-pdp-zoom"
      // Handlers only when there's a real image — the striped placeholder has
      // nothing to magnify.
      onPointerMove={main && !previewMobile ? track : undefined}
      onPointerLeave={main && !previewMobile ? () => setZoomed(false) : undefined}
      style={{ cursor: main && !previewMobile ? "zoom-in" : undefined }}
    >
      <Media
        src={active}
        sizes={HERO_SIZES}
        alt={alt}
        label="product"
        ratio={
          // `--sf-pdp-ratio` is the product page section's own shape, per screen
          // (`.sfb-pdp` in storefront-builder.css). It is absent everywhere else
          // — the classic page, a landing page's Single product — and then the
          // fallback is what has always drawn:
          //
          // `top` keeps its own 16/11 letterbox, because that layout runs the
          // photo the full width of the page where a 3:4 portrait would stand
          // taller than the viewport; the side-by-side layout, framed like a
          // product grid card, follows the store's card shape.
          `var(--sf-pdp-ratio, ${layout === "top" ? "16 / 11" : imageRatio})`
        }
        radius={RADIUS}
        fit={fit}
        // The product page's LCP image.
        priority
        className="sf-pdp-zoom-img"
        style={{
          display: "block",
          // Only the scale transitions; the origin jumps, so tracking has no lag
          // while the zoom in/out still animates.
          transform: zoomed ? `scale(${ZOOM})` : undefined,
          transformOrigin: origin,
        }}
      />
      {main && !previewMobile ? (
        // Affordance only — CSS hides it wherever there is no fine pointer.
        <span className="sf-pdp-zoom-hint" aria-hidden="true">
          <Icon name="zoomIn" size={14} /> {t.zoomHint}
        </span>
      ) : null}
    </div>
  );

  const thumbButton = (th: StorefrontImage | undefined, i: number, style?: CSSProperties) => (
    <button
      key={i}
      type="button"
      onClick={() => onSelect(i)}
      aria-label={`${alt} — ${i + 1}`}
      style={{ ...thumbBtn(i === activeIdx), ...style }}
    >
      <Media src={thumbImageUrl(th)} alt="" radius={8} style={{ display: "block" }} />
    </button>
  );

  if (layout === "top") {
    return (
      <div>
        {hero}
        {thumbs.length > 1 ? (
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {thumbs.map((th, i) => thumbButton(th, i, { flex: 1 }))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="sf-pdp-gallery">
      <div className="sf-pdp-thumbs">
        {(thumbs.length ? thumbs : [undefined]).map((th, i) => thumbButton(th, i))}
      </div>
      <div className="sf-pdp-hero">{hero}</div>
    </div>
  );
}
