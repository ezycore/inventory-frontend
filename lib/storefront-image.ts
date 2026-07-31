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
 * Images imported by URL store the same URL in all three fields, so both
 * helpers degrade to that one URL on their own.
 */
import type { StorefrontImage } from "@/lib/storefront-client";

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
