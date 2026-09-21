// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { pickByIds } from "@/lib/storefront-builder/store-lists";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { TagChipLinks } from "@/components/storefront/home/tag-chip-links";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["shop-by-tag"]["settings"];

/**
 * Chips for the tags the merchant picked, in their order, each linking to the
 * catalogue filtered by that tag. A tag deleted since drops out of the row.
 *
 * By default the heading is the merchant's or none. A row moved from the classic
 * home keeps that row's heading (`storeHeading`): always there, "Shop by age" in
 * the shopper's language until the merchant types their own.
 */
export function ShopByTagSection({ settings, context }: SectionViewProps<Spec>) {
  const tags = pickByIds(context.tags ?? [], settings.tagIds);
  if (tags.length === 0) return null;
  if (settings.storeHeading) {
    return (
      <>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0 }}>
            {settings.heading?.trim() || <Island name="store-word" props={{ word: settings.storeHeading }} />}
          </h2>
        </div>
        <TagChipLinks base={context.base} tags={tags} />
      </>
    );
  }
  return (
    <>
      {settings.heading ? (
        <SectionTitle subheading={settings.subheading}>{settings.heading}</SectionTitle>
      ) : null}
      <div data-flow={settings.flow?.base} data-flow-m={settings.flow?.mobile}>
        <TagChipLinks base={context.base} tags={tags} />
      </div>
    </>
  );
}
