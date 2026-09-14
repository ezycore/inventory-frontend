// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { pickByIds } from "@/lib/storefront-builder/store-lists";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { TagChipLinks } from "@/components/storefront/home/tag-chip-links";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["shop-by-tag"]["settings"];

/**
 * Chips for the tags the merchant picked, in their order, each linking to the
 * catalogue filtered by that tag. A tag deleted since drops out of the row.
 *
 * No fallback heading: the home page's row says "Shop by age" when untitled,
 * which is platform copy, and a builder section draws only the merchant's words.
 */
export function ShopByTagSection({ settings, context }: SectionViewProps<Spec>) {
  const tags = pickByIds(context.tags ?? [], settings.tagIds);
  if (tags.length === 0) return null;
  return (
    <>
      {settings.heading ? <SectionTitle>{settings.heading}</SectionTitle> : null}
      <TagChipLinks base={context.base} tags={tags} />
    </>
  );
}
