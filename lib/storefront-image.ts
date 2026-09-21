// coding-standard: maintained
/**
 * Which stored image variant to render, by use site.
 *
 * The backend writes three variants per upload (`imageUpload.ts`): `url` capped
 * at 1600px wide, `mediumUrl` at 800px, and `thumbnailUrl` at a **200×200
 * `fit: "cover"` square crop**. Only the thumbnail changes the aspect ratio, so
 * picking it for anything wider than ~100px both upscales a 200px source and
 * crops the product out of frame.
 *
 * Images imported by URL store the same URL in all three fields, so every
 * helper degrades to that one URL on its own.
 *
 * Used by the storefront AND the admin — `logoImageUrl` in particular. The
 * variants are the backend's, not a storefront concept, and a second module
 * answering the same question is how a call site ends up on the wrong one.
 */
import type { StorefrontImage } from "@/lib/storefront-client";

/** The two widths the backend promises (`imageUpload.ts`): medium and the capped original. */
const MEDIUM_WIDTH = 800;
const ORIGINAL_MAX_WIDTH = 1600;

/**
 * `src` plus a `srcset` over the variants that keep the aspect ratio — the
 * medium (800w) and the capped original (1600w). The 200×200 thumbnail is never
 * a candidate: it is a square crop, not a smaller copy.
 *
 * No `srcSet` when there is nothing to choose between, which is the case for an
 * image imported by URL (all three fields hold the same URL) and for a bare
 * string. The original may be narrower than 1600px (`withoutEnlargement`); the
 * browser then picks it a little early, which costs bytes, never sharpness.
 */
export function responsiveImageSources(
  img?: StorefrontImage | string | null,
): { src: string | undefined; srcSet: string | undefined } {
  if (!img) return { src: undefined, srcSet: undefined };
  if (typeof img === "string") return { src: img || undefined, srcSet: undefined };
  const src = img.url || img.mediumUrl || img.thumbnailUrl || undefined;
  const candidates = [
    img.mediumUrl && img.mediumUrl !== img.url ? `${img.mediumUrl} ${MEDIUM_WIDTH}w` : null,
    img.url && img.mediumUrl && img.mediumUrl !== img.url ? `${img.url} ${ORIGINAL_MAX_WIDTH}w` : null,
  ].filter(Boolean);
  return { src, srcSet: candidates.length > 1 ? candidates.join(", ") : undefined };
}

/** Card / grid tile / hero — anything rendered wider than ~100px. */
export function cardImageUrl(img?: StorefrontImage | null): string | undefined {
  return img?.mediumUrl || img?.thumbnailUrl || img?.url;
}

/** Small square row thumb, avatar or chip (≤100px) — the crop is correct here. */
export function thumbImageUrl(img?: StorefrontImage | null): string | undefined {
  return img?.thumbnailUrl || img?.mediumUrl || img?.url;
}

/** Zoomable gallery, share/OG preview, JSON-LD — anything that wants the largest. */
export function fullImageUrl(img?: StorefrontImage | null): string | undefined {
  return img?.url || img?.mediumUrl || img?.thumbnailUrl;
}

/**
 * A LOGO, at any size — the shop header, the admin sidebar, every preview of one.
 *
 * The thumbnail is last, and that ordering is the whole point of the helper.
 * A logo is a **mark, not a photo**: a 200×200 `fit: "cover"` crop of a wide
 * wordmark is not a smaller version of it, it is an unreadable slice of the
 * middle. A merchant whose logo reads "Uriibaba" saw "riiba" in four separate
 * admin previews — the Customize logo tile, its two-theme preview, the admin
 * sidebar, and (found later, because it is a second logo field and so escaped
 * the first sweep) the Customize **phone-logo** tile — while the shop itself
 * rendered it correctly, because the storefront happened to ask for `url` first
 * and the previews happened to ask for `thumbnailUrl` first.
 *
 * The lesson of that fourth one: fix the slot by routing it here, not by
 * reordering the fields at the call site. Every hand-written ordering is a
 * future miss, so a new logo field gets this helper on its first render.
 *
 * `cardImageUrl` is not a substitute: its second choice IS the square crop,
 * which is survivable for a product photo and never for a mark. Nor is
 * `thumbImageUrl`, however small the logo is drawn — the crop is the problem,
 * not the pixel count.
 *
 * The backend already learned this once: the 96×96 favicon rendition is
 * generated with `fit: "contain"` for exactly this reason (`imageUpload.ts`).
 * This is the read-side half of the same rule.
 */
export function logoImageUrl(
  img?: { url?: string; mediumUrl?: string; thumbnailUrl?: string } | null,
): string | undefined {
  return img?.mediumUrl || img?.url || img?.thumbnailUrl;
}
