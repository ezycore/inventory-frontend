// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { storeLinkHref } from "@/lib/storefront-links";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["call-to-action"]["settings"];

/** `storeLinkHref` treats every non-http scheme as unsafe; these two are allowed here. */
const CONTACT_SCHEME = /^(tel:|mailto:)/i;
const EXTERNAL = /^https?:\/\//i;

/**
 * Heading, optional line of text and one button.
 *
 * The button is a plain `<a>`, not `next/link`: a view ships no client code,
 * and the pages it links to are server-rendered anyway. External links open in
 * a new tab; `tel:` and `mailto:` go straight to the phone or mail app.
 */
export function CallToActionSection({ settings, context }: SectionViewProps<Spec>) {
  const href = CONTACT_SCHEME.test(settings.buttonHref)
    ? settings.buttonHref
    : storeLinkHref(context.base, settings.buttonHref);
  const external = EXTERNAL.test(href);

  return (
    <div className="sfb-cta" style={responsiveVars("sfb-cta-align", settings.align)}>
      <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
        {settings.heading}
      </h2>
      {settings.text ? (
        <p style={{ margin: "10px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{settings.text}</p>
      ) : null}
      <a
        href={href}
        className="sfb-button"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {settings.buttonLabel}
      </a>
    </div>
  );
}
