// coding-standard: maintained
import type { CSSProperties } from "react";
import { parseRichDoc, richDocToPlainText } from "@/lib/storefront-rich-doc";
import { RichDocView } from "@/components/storefront/rich-doc-view";

/**
 * Renders a product description in whichever format it is stored: rich-doc JSON
 * (anything saved since the description consolidation) or bare prose (products
 * not yet re-edited, and every product the CSV importer creates).
 *
 * The twin of `content-body-view.tsx`, with one deliberate difference: the
 * legacy branch renders PLAIN TEXT, not markdown. A CMS page body genuinely was
 * markdown before the editor existed; a product description was a POS textarea,
 * so `#` and `-` in it are literal characters and `MarkdownView` would eat them.
 * `whiteSpace: pre-line` preserves the line breaks the merchant typed, which is
 * exactly what the old `<p>` on the PDP did.
 */
export function ProductDescriptionView({
  description,
  legacyStyle,
}: {
  description?: string | null;
  legacyStyle?: CSSProperties;
}) {
  if (!description) return null;
  const doc = parseRichDoc(description);
  if (doc) return <RichDocView doc={doc} />;
  return <p style={{ whiteSpace: "pre-line", ...legacyStyle }}>{description}</p>;
}

/**
 * Is this body too big to sit above the Add to Cart button?
 *
 * Length alone is not the test. A description that is 200 characters of ONE
 * paragraph reads fine inline; 200 characters arranged as a heading, a list and
 * a size-chart table does not — it is the block structure that pushes the buy
 * controls off a phone screen, and structure only became possible when the field
 * became rich text.
 *
 * So: long prose OR any non-paragraph block. A short, plain description stays
 * where it always was, because exiling a one-liner to the bottom of the page
 * would be its own regression.
 */
const INLINE_PROSE_LIMIT = 280;

/**
 * The legacy plain-text branch only — `ProductDescriptionView` applies it to the
 * bare <p> so an un-migrated description looks exactly as it did before.
 */
export const descriptionText: CSSProperties = {
  fontSize: 14,
  color: "var(--muted)",
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: "pre-line",
};

/** Owns the spacing for BOTH branches, so a rich body and a legacy paragraph sit the same distance off what follows. */
export const descriptionWrap: CSSProperties = {
  fontSize: 14,
  color: "var(--muted)",
  lineHeight: 1.6,
  marginBottom: 20,
};

export function isLongDescription(description?: string | null): boolean {
  if (!description) return false;
  const doc = parseRichDoc(description);
  if (doc) {
    const hasStructure = (doc.content ?? []).some(
      (block) => block.type !== "paragraph",
    );
    if (hasStructure) return true;
  }
  return richDocToPlainText(description).length > INLINE_PROSE_LIMIT;
}
