// coding-standard: maintained
import type { CSSProperties } from "react";

/**
 * Prose styling for CMS page bodies, consumed by the rich-doc renderer
 * (rich-doc-view.tsx / rich-doc-faq-view.tsx). Values are mirrored from
 * markdown-view.tsx (the frozen legacy renderer) so both formats look
 * identical on the storefront — update the two files together.
 */

export const HEADING_SIZE: Record<1 | 2 | 3, number> = { 1: 22, 2: 19, 3: 16.5 };

export const proseHeading = (level: 1 | 2 | 3): CSSProperties => ({
  fontSize: HEADING_SIZE[level],
  fontWeight: 700,
  letterSpacing: "-0.015em",
  margin: "22px 0 2px",
});

export const proseBodyText: CSSProperties = { fontSize: 15, lineHeight: 1.75, color: "var(--text)" };

export const proseParagraph: CSSProperties = { ...proseBodyText, margin: "10px 0" };

export const proseList: CSSProperties = {
  ...proseBodyText,
  margin: "10px 0",
  paddingLeft: 24,
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

export const proseQuote: CSSProperties = {
  ...proseBodyText,
  color: "var(--muted)",
  margin: "14px 0",
  padding: "4px 0 4px 16px",
  borderLeft: "3px solid var(--primary)",
};

export const proseDivider: CSSProperties = {
  border: "none",
  borderTop: "1px solid var(--border)",
  margin: "24px 0",
};

export const proseLink: CSSProperties = {
  color: "var(--primary)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

export const proseFaqGroup: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  margin: "16px 0",
};

export const proseFaqCard: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "15px 18px",
};

export const proseFaqQuestionRow: CSSProperties = {
  display: "flex",
  gap: 10,
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.5,
};

// Muted, not brand: a dark brand colour would vanish on dark cards.
export const proseFaqBadge: CSSProperties = { color: "var(--muted)", flex: "none" };

export const proseFaqAnswerLine = (first: boolean): CSSProperties => ({
  marginTop: first ? 7 : 4,
  paddingLeft: 26,
  fontSize: 14,
  lineHeight: 1.7,
  color: "var(--muted)",
});
