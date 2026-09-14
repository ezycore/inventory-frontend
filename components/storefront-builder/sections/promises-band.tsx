// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { PromiseRows } from "@/components/storefront/home/promise-rows";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["promises-band"]["settings"];
type BlockSpec = (typeof SECTION_SPECS)["promises-band"]["blocks"]["settings"];

/**
 * The shop's promises — delivery, returns, authenticity — as icon + text rows:
 * the home page's trust band as a section, every word the merchant's own.
 *
 * The home band's tint is not built in here. The section's style box carries
 * the background, so the same rows can sit on any ground the page needs.
 */
export function PromisesBandSection({ settings, blocks }: SectionViewProps<Spec, BlockSpec>) {
  return (
    <>
      {settings.heading ? <SectionTitle>{settings.heading}</SectionTitle> : null}
      <PromiseRows promises={blocks.map((block) => block.settings)} />
    </>
  );
}
