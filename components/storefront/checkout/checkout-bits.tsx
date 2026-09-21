"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { sfInput } from "@/components/storefront/field-styles";
import { brandButton, buttonMetrics } from "@/lib/storefront-button";

/* Shared checkout styling — the section eyebrow, text inputs and buttons. */

export const label: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 12,
};

/**
 * Checkout's text field IS the storefront's text field — re-export, don't
 * re-declare. This was a near-identical fourth copy of `sfInput`, and the copy
 * had already drifted (its own radius, its own padding, `--card` instead of
 * `--surface`), so checkout's inputs quietly looked unlike every other
 * shopper-facing form in the storefront.
 *
 * The 16px floor that `sfInput` documents matters most here: iOS Safari zooms
 * on any focused field under 16px and never zooms back, and checkout has the
 * most fields of any page.
 */
export const input: CSSProperties = sfInput;

export const primaryBtn: CSSProperties = {
  ...brandButton({ radius: 9, padding: 14, fontSize: 14.5 }),
  border: "none",
  fontFamily: "inherit",
  fontWeight: 700,
  cursor: "pointer",
};

export const ghostBtn: CSSProperties = {
  ...buttonMetrics({ radius: 8, padding: "12px 22px", fontSize: 14 }),
  background: "transparent",
  color: "var(--text)",
  border: "1px solid var(--border-strong)",
  fontFamily: "inherit",
  fontWeight: 600,
  cursor: "pointer",
};

export const primaryLink: CSSProperties = {
  ...brandButton({ radius: 9, padding: "12px 24px", fontSize: 14 }),
  display: "inline-block",
  fontWeight: 600,
};

export const ghostLink: CSSProperties = {
  ...buttonMetrics({ radius: 9, padding: "12px 24px", fontSize: 14 }),
  display: "inline-block",
  background: "transparent",
  color: "var(--text)",
  border: "1px solid var(--border-strong)",
  fontWeight: 600,
};

/** Selectable delivery-zone card (Inside/Outside Dhaka). */
/** Order-summary line (subtotal / discount / shipping). */
export function SummaryRow({
  label: rowLabel,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: accent ? "var(--primary)" : "var(--muted)" }}>
      <span>{rowLabel}</span>
      <span className="sf-mono">{value}</span>
    </div>
  );
}

/** Numbered progress header for the multi-step checkout template. */
export function StepsBar({
  steps,
  step,
}: {
  steps: { n: number; label: string }[];
  step: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 26 }}>
      {steps.map((st, idx) => (
        <div key={st.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span
              className="sf-mono"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: st.n === step ? "var(--primary)" : "var(--surface)",
                color: st.n === step ? "var(--on-primary)" : "var(--muted)",
                border: st.n === step ? "none" : "1px solid var(--border-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flex: "none",
              }}
            >
              {st.n}
            </span>
            <span className="sf-desktop-only" style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{st.label}</span>
          </div>
          {idx < steps.length - 1 ? (
            <span style={{ flex: 1, height: 1, background: "var(--border-strong)", margin: "0 12px" }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
