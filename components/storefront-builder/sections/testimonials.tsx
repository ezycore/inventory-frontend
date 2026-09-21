// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { TRACK } from "@/lib/storefront-builder/grid-track";
import { Icon } from "@/components/storefront/sf-icons";
import { SfImage } from "@/components/storefront/sf-image";
import { SectionLede } from "@/components/storefront-builder/section-lede";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["testimonials"]["settings"];
type BlockSpec = (typeof SECTION_SPECS)["testimonials"]["blocks"]["settings"];

/** A review shows only with something to read or see: its words, or a screenshot. */
export const shownTestimonials = <T extends { settings: { text?: string; image?: unknown } }>(
  blocks: readonly T[],
): T[] => blocks.filter((block) => block.settings.text || block.settings.image);

/**
 * What customers said, exactly as the merchant entered it: a card per review
 * with its stars, words or screenshot, and the customer's name and photo.
 *
 * **Never labelled "verified"** (plan §8): nothing here checks that a buyer
 * wrote it, so the section makes no claim the merchant has not typed. A grid
 * past the breakpoint, one swipeable row on a phone (`.sfb-cards`) — no script.
 */
export function TestimonialsSection({ settings, blocks }: SectionViewProps<Spec, BlockSpec>) {
  const reviews = shownTestimonials(blocks);
  return (
    <>
      <SectionLede heading={settings.heading} subheading={settings.subheading} gap={16} />
      <div
        className="sfb-cards"
        data-flow={settings.flow?.base}
        data-flow-m={settings.flow?.mobile}
        style={responsiveVars("sfb-review-track", settings.columns, TRACK) as CSSProperties}
      >
        {reviews.map(({ id, settings: review }) => (
          <figure key={id} style={card}>
            {review.rating ? (
              <div role="img" aria-label={`${review.rating}/5`} style={{ display: "flex", gap: 2, color: "#f59e0b" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} style={{ display: "flex", opacity: n <= (review.rating ?? 0) ? 1 : 0.25 }}>
                    <Icon name="star" size={16} />
                  </span>
                ))}
              </div>
            ) : null}
            {review.text ? <blockquote style={quote}>{review.text}</blockquote> : null}
            {review.image ? (
              <SfImage
                image={review.image}
                alt={review.image.alt ?? ""}
                sizes="(max-width: 679px) 85vw, 400px"
                width={review.image.width}
                height={review.image.height}
                style={{ display: "block", width: "100%", height: "auto", borderRadius: 10 }}
              />
            ) : null}
            <figcaption style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
              {review.photo ? (
                <SfImage
                  image={review.photo}
                  alt=""
                  sizes="40px"
                  width={40}
                  height={40}
                  style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover", flex: "none" }}
                />
              ) : null}
              <span style={{ fontSize: 14, fontWeight: 600 }}>{review.name}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}

const card: CSSProperties = {
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  height: "100%",
  padding: 18,
  background: "var(--card)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  textAlign: "left",
};

const quote: CSSProperties = {
  margin: 0,
  fontSize: 14.5,
  lineHeight: 1.6,
  whiteSpace: "pre-line",
};
