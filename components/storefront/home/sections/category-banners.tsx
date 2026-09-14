"use client";
// coding-standard: maintained

import { SectionTitle } from "@/components/storefront/sf-bits";
import {
  CategoryBannerRow,
  pickedCategories,
} from "@/components/storefront/home/category-banner-row";
import { CategoryStrip } from "@/components/storefront/home/category-strip";
import { useStoreImageFit } from "@/services/storefront/use-image-fit";
import { wrap, type SectionProps } from "@/components/storefront/home/home-shared";

/**
 * Category promo cards on the home page: the merchant's `sectionConfig` read
 * over `CategoryBannerRow` (`category-banner-row.tsx`), which holds the card
 * markup and every layout rule, shared with the Storefront Builder.
 *
 * Renders nothing without categories, like every section in the family.
 */
export function CategoryBanners({ base, categories, config, t }: SectionProps) {
  const imageFit = useStoreImageFit();
  const picked = pickedCategories(categories, config?.categoryIds);
  if (!picked.length) return null;

  return (
    <div
      style={{
        /* Full width drops the content column entirely rather than widening it:
           the merchant asked for a band across the window, and a wider `maxWidth`
           would still centre the row inside a page gutter. The side padding
           stays either way — type running into the window edge on a phone is
           not what "full width" means. */
        ...(config?.fullWidth ? null : wrap),
        padding: "clamp(16px,3vw,28px) var(--pad)",
      }}
    >
      {config?.title?.trim() ? (
        <SectionTitle>{config.title.trim()}</SectionTitle>
      ) : null}
      <CategoryBannerRow
        base={base}
        categories={picked}
        config={config}
        imageFit={imageFit}
        defaultButtonLabel={t.shopNow}
        renderStrip={(strip) => <CategoryStrip {...strip} />}
      />
    </div>
  );
}
