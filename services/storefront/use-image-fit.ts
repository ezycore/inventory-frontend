"use client";
// coding-standard: maintained
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { mediaFitFor, resolveTemplates } from "@/lib/storefront-templates";

/**
 * How product/banner photos should fill their boxes (Customize → Product cards →
 * Image fit), draft-first. Read here rather than threaded as a prop — it applies to
 * five unrelated surfaces (product cards, home banners, hero, wishlist), and passing
 * it through each would be five chances to forget one, the same reasoning
 * `useStoreLogoStyle` documents for `<Brand>`. `useStore` is the same cached query
 * those surfaces already run, so this costs nothing extra.
 */
export function useStoreImageFit(): "cover" | "canvas" {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const draft = useSfPreview((s) => s.imageFit);
  const saved = resolveTemplates(store).imageFit;
  const raw = draft === "fit" || draft === "crop" ? draft : saved;
  return mediaFitFor(raw);
}
