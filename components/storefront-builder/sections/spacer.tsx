// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["spacer"]["settings"];

const px = (value: number) => `${value}px`;

/**
 * Room between two sections: a band of the chosen height, with a line across
 * its middle when asked. Nothing in it is content, so it is hidden from screen
 * readers; the phone height is a CSS variable (`.sfb-spacer`), never a script.
 */
export function SpacerSection({ settings }: SectionViewProps<Spec>) {
  return (
    <div
      className="sfb-spacer"
      data-line={settings.line ? "" : undefined}
      style={responsiveVars("sfb-space", settings.space, px)}
      aria-hidden="true"
    />
  );
}
