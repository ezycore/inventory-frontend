// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { SectionLink } from "@/components/storefront-builder/section-link";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["call-to-action"]["settings"];

/** Heading, optional line of text and one button. */
export function CallToActionSection({ settings, context }: SectionViewProps<Spec>) {
  return (
    <div className="sfb-cta" style={responsiveVars("sfb-cta-align", settings.align)}>
      <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
        {settings.heading}
      </h2>
      {settings.text ? (
        <p style={{ margin: "10px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{settings.text}</p>
      ) : null}
      <SectionLink base={context.base} href={settings.buttonHref} className="sfb-button">
        {settings.buttonLabel}
      </SectionLink>
    </div>
  );
}
