"use client";
// coding-standard: maintained
import type { StoreTemplates } from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

/**
 * The store's card badge settings (Customize → Product cards → Badges),
 * draft-first — same shape as `useStoreImageFit`. The draft is re-resolved
 * through `resolveTemplates` so an unknown id falls back exactly as a saved one
 * does, and the preview can never draw a state the live shop cannot.
 */
export function useStoreCardBadges(): {
  tagBadges: number;
  discountBadge: StoreTemplates["discountBadge"];
} {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const draftTags = useSfPreview((s) => s.cardTagBadges);
  const draftDiscount = useSfPreview((s) => s.discountBadge);
  const saved = resolveTemplates(store);
  const drafted = resolveTemplates({
    templates: {
      cardTagBadges: draftTags ?? saved.cardTagBadges,
      discountBadge: draftDiscount ?? saved.discountBadge,
    },
  });
  return {
    tagBadges: Number(drafted.cardTagBadges),
    discountBadge: drafted.discountBadge,
  };
}
