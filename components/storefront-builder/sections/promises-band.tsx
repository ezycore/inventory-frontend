// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { PromiseRows } from "@/components/storefront/home/promise-rows";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["promises-band"]["settings"];
type BlockSpec = (typeof SECTION_SPECS)["promises-band"]["blocks"]["settings"];

/**
 * The shop's promises — delivery, returns, authenticity — as icon + text rows:
 * the home page's trust band as a section, every word the merchant's own. Rows
 * are the blocks, or under `storePromises` the store's own promises from
 * Customize → Footer, which the header and footer show too — so a band moved
 * from the classic home stays in step with them.
 *
 * The band's accent tint is the section type's default frame (`section-registry.tsx`),
 * so the style box can put the same rows on any other ground.
 */
export function PromisesBandSection({ settings, blocks, context }: SectionViewProps<Spec, BlockSpec>) {
  const promises = settings.storePromises
    ? (context.trustBadges ?? [])
    : blocks.map((block) => block.settings);
  return (
    <>
      {settings.heading ? <SectionTitle>{settings.heading}</SectionTitle> : null}
      <PromiseRows promises={promises} />
    </>
  );
}
