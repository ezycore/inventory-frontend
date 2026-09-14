// coding-standard: maintained
import { SectionTitle } from "@/components/storefront/sf-bits";
import { SectionLink } from "@/components/storefront-builder/section-link";

/**
 * A product section's heading row: the merchant's heading, with their link
 * beside it. The link draws only with both a label and a destination — a
 * builder section carries no platform wording ("View all") of its own — and
 * sits alone at the right when there is a link but no heading.
 */
export function SectionHeading({
  base,
  heading,
  linkLabel,
  linkHref,
}: {
  base: string;
  heading?: string;
  linkLabel?: string;
  linkHref?: string;
}) {
  const link =
    linkLabel && linkHref ? (
      <SectionLink base={base} href={linkHref} style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
        {linkLabel} →
      </SectionLink>
    ) : null;
  if (heading) return <SectionTitle action={link}>{heading}</SectionTitle>;
  return link ? (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>{link}</div>
  ) : null;
}
