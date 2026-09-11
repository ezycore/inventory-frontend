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

/**
 * A list that actually shows its markers.
 *
 * Two things conspire to remove them and BOTH have to be answered here, because
 * this renders inside the storefront where a global reset is out of reach:
 *
 * - `display: flex` (what this used to be, for the item gap) makes the children
 *   flex items, and a flex item generates **no list marker at all**. The gap is
 *   now item margin instead.
 * - a `list-style: none` reset — Tailwind's preflight does exactly this — wins
 *   over the browser default, so the type has to be stated rather than assumed.
 *
 * `listStylePosition: "outside"` keeps the marker in the 24px of padding, so
 * wrapped lines align under the text and not under the bullet.
 */
export const proseList = (ordered: boolean): CSSProperties => ({
  ...proseBodyText,
  margin: "10px 0",
  paddingLeft: 24,
  listStyleType: ordered ? "decimal" : "disc",
  listStylePosition: "outside",
});

/** Item rhythm — replaces the flex `gap` the list used to get it from. */
export const proseListItem: CSSProperties = {
  display: "list-item",
  margin: "5px 0",
};

/**
 * A paragraph nested inside a list item or a blockquote.
 *
 * No block margin (the container supplies the rhythm) but it IS a `<p>`, so a
 * `textAlign` the merchant set on it survives — rendering the inline content
 * bare, as this used to, silently dropped alignment inside every list and quote.
 */
export const proseNestedParagraph: CSSProperties = {
  fontSize: proseBodyText.fontSize,
  lineHeight: proseBodyText.lineHeight,
  margin: 0,
  // No `color` on purpose — it inherits, so a blockquote's colour still applies
  // to the paragraphs inside it. Copying `proseBodyText` wholesale would set
  // `var(--text)` here and override the container.
};

export const proseQuote: CSSProperties = {
  ...proseBodyText,
  // `--text`, not `--muted`. Muted grey is fine for a caption; for a paragraph
  // of body copy on a tinted storefront theme it reads as unreadable — reported
  // as "the quote text is invisible". The left border and indent already say
  // "quote"; the contrast does not have to.
  color: "var(--text)",
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

// --- Tables ---
// Horizontal scroll wrapper so wide tables (size charts) never break the page.
export const proseTableWrap: CSSProperties = { margin: "16px 0", overflowX: "auto" };

export const proseTable: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  fontSize: 14,
  color: "var(--text)",
};

export const proseTableCell: CSSProperties = {
  border: "1px solid var(--border)",
  padding: "8px 12px",
  verticalAlign: "top",
  lineHeight: 1.6,
};

export const proseTableHeader: CSSProperties = {
  ...proseTableCell,
  background: "var(--card)",
  fontWeight: 700,
  textAlign: "left",
};

// --- Callouts ---
// Alpha-tinted so each variant reads on both light and dark storefront themes.
const CALLOUT_COLORS: Record<"info" | "warning" | "success", { border: string; bg: string }> = {
  info: { border: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
  warning: { border: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  success: { border: "#10b981", bg: "rgba(16,185,129,0.11)" },
};

export const proseCallout = (variant: "info" | "warning" | "success"): CSSProperties => ({
  ...proseBodyText,
  margin: "16px 0",
  padding: "12px 16px",
  borderRadius: 10,
  borderLeft: `4px solid ${CALLOUT_COLORS[variant].border}`,
  background: CALLOUT_COLORS[variant].bg,
});

// --- Highlight mark ---
// Highlighter look: bright background with forced-dark text so it stays legible
// over a light tint regardless of the page theme.
export const proseHighlight = (color?: string): CSSProperties => ({
  background: color ?? "#fde68a",
  color: "#1f2937",
  padding: "0.05em 0.2em",
  borderRadius: 3,
});

/**
 * Body images, at the merchant's chosen width and alignment.
 *
 * `maxWidth: 100%` and `height: auto` stay regardless of the chosen width: they
 * are what stops a 2000px camera upload forcing the page to scroll sideways on a
 * ~360px phone column. The width percentage narrows the image WITHIN the column;
 * it can never widen it past one.
 *
 * Only the WIDTH is inline. Alignment and text-wrap are data attributes handled
 * by `.sf-rdimg` in `storefront.css`, because wrap has to switch off below the
 * 680px breakpoint and an inline style cannot express that. The margins here are
 * the non-wrapped defaults; the CSS overrides them when a float is in play.
 */
export const proseImage = (
  widthPercent: number,
  align: "left" | "center" | "right",
): CSSProperties => ({
  display: "block",
  width: `${widthPercent}%`,
  maxWidth: "100%",
  height: "auto",
  borderRadius: 8,
  marginTop: 14,
  marginBottom: 14,
  marginLeft: align === "left" ? 0 : "auto",
  marginRight: align === "right" ? 0 : "auto",
});
