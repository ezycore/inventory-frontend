"use client";
// coding-standard: maintained

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/**
 * The filter surfaces' building blocks — one row, one value chip, the typed
 * price range and the availability switch. Every surface (sheet, drawer,
 * sidebar, desktop bar popover, quick-chip mini-sheet) draws through these, so
 * a row looks and taps the same wherever it appears.
 *
 * Inline-styled against the storefront CSS vars, like the rest of the shop.
 */

/** One facet row — box (or dot) + label (+ optional count). */
export function FilterRow({
  label,
  active,
  count,
  nested,
  single,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  /** A sub-category row — indented under its parent, same tap height. */
  nested?: boolean;
  /** Picks exactly one (a round dot) rather than toggling (a square box). */
  single?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role={single ? "radio" : "checkbox"}
      aria-checked={active}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        width: "100%",
        fontSize: nested ? 12.5 : 13,
        fontFamily: "inherit",
        color: active ? "var(--text)" : "var(--muted)",
        fontWeight: active ? 600 : 400,
        background: "none",
        border: "none",
        // A bare row is only as tall as its 15px box — far too small to tap.
        // Vertical padding takes it to 40px.
        padding: "10px 0",
        // Indent only — never a shorter row. The tap floor applies at every level.
        paddingLeft: nested ? 16 : undefined,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 15,
          height: 15,
          borderRadius: single ? "50%" : 4,
          flex: "none",
          background: active ? "var(--primary)" : "transparent",
          border: active ? "none" : "1.5px solid var(--border-strong)",
          boxShadow: active && single ? "inset 0 0 0 3.5px var(--card)" : undefined,
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {count != null ? (
        <span className="sf-mono" style={{ fontSize: 11, color: "var(--faint)" }}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * A value as a pill — variant options ("M", "Red") and price ranges, where the
 * values are short and a wrap of pills scans faster than a column of rows.
 */
export function ValueChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        // 40px tall with a 13px label — the storefront's tap floor.
        minHeight: 40,
        padding: "0 14px",
        borderRadius: 999,
        fontSize: 13,
        fontFamily: "inherit",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        color: active ? "var(--primary)" : "var(--text)",
        background: active ? "var(--primary-soft)" : "var(--card)",
        border: `1px solid ${active ? "transparent" : "var(--border-strong)"}`,
      }}
    >
      {label}
      {count != null ? (
        <span className="sf-mono" style={{ fontSize: 10.5, color: "var(--faint)" }}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

/** A wrap of `ValueChip`s. */
export const chipWrap: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 7 };

/**
 * Min/max price fields — plain numeric-text inputs (no native number input,
 * per house rules) committing on blur/Enter so half-typed bounds never fire a
 * fetch. Values resync when the URL changes elsewhere (chip ✕, a preset, Clear).
 */
export function PriceBounds({
  min,
  max,
  onCommit,
}: {
  min: string;
  max: string;
  onCommit: (min: string, max: string) => void;
}) {
  const { t } = useStorefrontUI();
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  const [prev, setPrev] = useState(`${min}|${max}`);
  if (prev !== `${min}|${max}`) {
    setPrev(`${min}|${max}`);
    setLo(min);
    setHi(max);
  }

  const commit = () => {
    if (lo === min && hi === max) return;
    if (lo && hi && Number(lo) > Number(hi)) onCommit(hi, lo);
    else onCommit(lo, hi);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") commit();
  };
  const digits = (v: string) => v.replace(/[^0-9]/g, "");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <input
        type="text"
        inputMode="numeric"
        value={lo}
        placeholder={t.minLabel}
        aria-label={t.minLabel}
        onChange={(e) => setLo(digits(e.target.value))}
        onBlur={commit}
        onKeyDown={onKey}
        style={priceField}
      />
      <span style={{ color: "var(--muted)", fontSize: 12 }}>–</span>
      <input
        type="text"
        inputMode="numeric"
        value={hi}
        placeholder={t.maxLabel}
        aria-label={t.maxLabel}
        onChange={(e) => setHi(digits(e.target.value))}
        onBlur={commit}
        onKeyDown={onKey}
        style={priceField}
      />
    </div>
  );
}

const priceField: CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  padding: "9px 9px",
  // 16px stops iOS zooming the page on focus.
  fontSize: 16,
  fontFamily: "inherit",
  background: "var(--card)",
  color: "var(--text)",
};

export function SwitchRow({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 9,
        width: "100%",
        background: "none",
        border: "none",
        // Matches the option rows — the 18px switch alone is not tappable.
        padding: "10px 0",
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "inherit",
        color: on ? "var(--text)" : "var(--muted)",
        fontWeight: on ? 600 : 400,
        textAlign: "left",
      }}
    >
      {label}
      <span
        aria-hidden
        style={{
          width: 30,
          height: 18,
          borderRadius: 999,
          background: on ? "var(--primary)" : "var(--border-strong)",
          position: "relative",
          flex: "none",
          transition: "background 0.15s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 14 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.15s",
          }}
        />
      </span>
    </button>
  );
}
