// coding-standard: maintained
import type { CSSProperties } from "react";

/**
 * The storefront's text-field skin — one copy, shared by every shopper-facing
 * form (account, addresses, password, reset-password, checkout).
 *
 * It exists because the identical object had been pasted into six files, and
 * they all carried the same defect: **iOS Safari zooms the page whenever a
 * focused field is smaller than 16px**, and since the viewport meta (correctly)
 * permits scaling, it never zooms back out. Checkout alone has seven fields, so
 * placing one order meant seven manual pinch-outs. `fontSize` here is therefore
 * a floor, not a preference — do not lower it, and do not re-inline this style.
 */
/**
 * The label that sits above a field.
 *
 * Third copy of an identical object (account profile + password already had
 * one each), which is the point at which the repo's rule says extract. It is
 * NOT muted grey: a label is the question the field is asking, and a question
 * greyed out below the answer's contrast is a question nobody re-reads.
 */
export const sfFieldLabel: CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--text)",
  marginBottom: 6,
};

export const sfInput: CSSProperties = {
  width: "100%",
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text)",
  borderRadius: "var(--radius-sm)",
  padding: "11px 13px",
  fontFamily: "inherit",
  fontSize: 16,
  outline: "none",
};

/**
 * The same skin worn by a `<select>`.
 *
 * `appearance: none` is the whole point. Left native, the control paints the
 * platform's own chevron — a fixed dark glyph that ignores `--text`, sits at
 * its own offset, and read as a foreign object inside checkout's error ring.
 * The caller draws the chevron instead, which is why the right padding is
 * reserved here and not in `sfInput`: the gap and the glyph are one decision.
 *
 * The control stays a real `<select>`. On a phone that is the OS wheel picker,
 * which beats any popover we could build; only the closed trigger is ours.
 */
export const sfSelect: CSSProperties = {
  ...sfInput,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  paddingRight: 36,
  cursor: "pointer",
};

/**
 * Present to a screen reader, absent to the eye.
 *
 * Used for words a sighted shopper reads from a symbol instead — the `*` on a
 * required field is a star to a screen reader and means nothing, so the word
 * rides along hidden. `display: none` and `visibility: hidden` would remove it
 * from the accessibility tree too, which is the opposite of the point.
 */
export const sfVisuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};
