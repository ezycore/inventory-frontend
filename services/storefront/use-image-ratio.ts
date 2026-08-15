"use client";
// coding-standard: maintained
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { isImageRatio, mediaRatioFor, resolveTemplates } from "@/lib/storefront-templates";

/**
 * The frame product photos sit in (Customize → Product cards → Photo shape),
 * draft-first. Sibling of `useStoreImageFit` and read the same way rather than
 * threaded as a prop — the same four surfaces would each be a chance to forget
 * one.
 *
 * **Only the product GRIDS and the side-by-side product page read this.** The
 * fixed-size thumbnails in the cart, the search suggestions and the tracking
 * timeline stay square on purpose: those sit in horizontal rows sized in px, and
 * a 3:4 frame there would stretch the row rather than restyle the shop. The
 * home banner and hero keep their own ratios for the same reason — they are
 * layout decisions, not "how this shop photographs its products".
 */
export function useStoreImageRatio(): string {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const draft = useSfPreview((s) => s.imageRatio);
  const saved = resolveTemplates(store).imageRatio;
  // The draft is guarded so an unknown id streamed from the editor falls back to
  // the SAVED choice rather than silently rendering square — `mediaRatioFor`'s
  // own default would hide the drift instead of showing it.
  return mediaRatioFor(isImageRatio(draft) ? draft : saved);
}
