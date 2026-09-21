// coding-standard: maintained
import type { ReactNode } from "react";

/**
 * A section's own heading, and under it an optional line.
 *
 * For the sections that draw a plain `<h2>` rather than a heading ROW with a
 * link beside it — `benefits`, `how-to-order`, `testimonials`, `faq`,
 * `offer-pricing`. Those with a link use `SectionHeading` over `SectionTitle`,
 * which grew the same line; this exists so the five do not each grow their own.
 *
 * ⚠ **With no subheading it renders the bare `<h2>` those five drew before**,
 * margins and all — no wrapper. A section that has not been given a line must
 * be unchanged on the 21 live stores now on the builder, and "unchanged" is
 * asserted in `section-lede.test.tsx` as the absence of the wrapper rather than
 * as the heading merely appearing.
 */
export function SectionLede({
  heading,
  subheading,
  gap,
}: {
  heading?: ReactNode;
  subheading?: string;
  /** The room under the heading. Each of the five drew its own, so each keeps it. */
  gap: number;
}) {
  if (!heading) return null;
  const title = (
    <h2
      style={{
        fontSize: "var(--h2)",
        fontWeight: 700,
        margin: subheading ? 0 : `0 0 ${gap}px`,
        letterSpacing: "-0.02em",
      }}
    >
      {heading}
    </h2>
  );
  if (!subheading) return title;
  return (
    <div style={{ margin: `0 0 ${gap}px` }}>
      {title}
      <p style={{ fontSize: 14.5, color: "var(--sfb-muted, var(--muted))", lineHeight: 1.6, margin: "6px 0 0", whiteSpace: "pre-line" }}>
        {subheading}
      </p>
    </div>
  );
}
