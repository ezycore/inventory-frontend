// coding-standard: maintained
import type { CSSProperties } from "react";

/**
 * Shared styling for storefront dropdown popovers — the checkout Combobox and
 * SfSelect render the same menu card and option rows. One source so every
 * storefront popover looks identical.
 */
export const popoverMenu: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  zIndex: 30,
  maxHeight: 240,
  overflowY: "auto",
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  padding: 4,
};

/** One option row; `on` = keyboard/hover-active highlight. */
export const optionRow = (on: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  padding: "9px 11px",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
  background: on ? "var(--primary-soft)" : "transparent",
  color: on ? "var(--primary)" : "var(--text)",
});
