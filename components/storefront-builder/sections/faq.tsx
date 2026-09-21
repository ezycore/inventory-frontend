// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { JsonLd } from "@/components/storefront/json-ld";
import {
  proseFaqAnswerLine,
  proseFaqCard,
  proseFaqGroup,
  proseFaqQuestionRow,
} from "@/components/storefront/storefront-prose-styles";
import { SectionLede } from "@/components/storefront-builder/section-lede";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["faq"]["settings"];
type BlockSpec = (typeof SECTION_SPECS)["faq"]["blocks"]["settings"];

const PROSE_MAX_WIDTH = 780;

/**
 * Questions and answers as native `<details>` — open and close with no
 * JavaScript at all — styled like the rich-text FAQ cards so the two read as one
 * design.
 *
 * Also emits a schema.org `FAQPage` node from the same items, which is what a
 * search engine reads the Q&A from. Answers are plain text (one language per
 * field, decision 3), so line breaks are kept with `pre-line`.
 */
export function FaqSection({ settings, blocks }: SectionViewProps<Spec, BlockSpec>) {
  return (
    <div className="sfb-own-column" style={{ "--sfb-own-column": `${PROSE_MAX_WIDTH}px` } as CSSProperties}>
      <SectionLede heading={settings.heading} subheading={settings.subheading} gap={14} />
      <div style={{ ...proseFaqGroup, textAlign: "left" }}>
        {blocks.map((block) => (
          <details key={block.id} style={proseFaqCard} open={settings.openFirst === true && block === blocks[0]}>
            <summary style={{ ...proseFaqQuestionRow, cursor: "pointer" }}>{block.settings.question}</summary>
            <p style={{ ...proseFaqAnswerLine(true), whiteSpace: "pre-line" }}>{block.settings.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: blocks.map((block) => ({
            "@type": "Question",
            name: block.settings.question,
            acceptedAnswer: { "@type": "Answer", text: block.settings.answer },
          })),
        }}
      />
    </div>
  );
}
