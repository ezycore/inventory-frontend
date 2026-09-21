// coding-standard: maintained
import type { ReactNode } from "react";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { SectionLink } from "@/components/storefront-builder/section-link";

/**
 * A product section's heading row: the heading, with a link beside it. The link
 * draws only with both a label and a destination, and sits alone at the right
 * when there is a link but no heading. Either may be the storefront's own word
 * (`productRowHeading`) rather than the merchant's.
 */
export function SectionHeading({
  base,
  heading,
  subheading,
  linkLabel,
  linkHref,
}: {
  base: string;
  heading?: ReactNode;
  /** A line under the heading; drawn only with a heading to sit under. */
  subheading?: ReactNode;
  linkLabel?: ReactNode;
  linkHref?: string;
}) {
  const link =
    linkLabel && linkHref ? (
      <SectionLink base={base} href={linkHref} style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
        {linkLabel} →
      </SectionLink>
    ) : null;
  if (heading)
    return (
      <SectionTitle action={link} subheading={subheading}>
        {heading}
      </SectionTitle>
    );
  return link ? (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>{link}</div>
  ) : null;
}
