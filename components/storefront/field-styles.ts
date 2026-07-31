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
export const sfInput: CSSProperties = {
  width: "100%",
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text)",
  borderRadius: 8,
  padding: "11px 13px",
  fontFamily: "inherit",
  fontSize: 16,
  outline: "none",
};
