"use client";
// coding-standard: maintained

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { input } from "./checkout-bits";

export interface ComboOption {
  value: string;
  label: string;
}

/**
 * Storefront-themed searchable select. Typing filters the option list; picking
 * commits `option.value`. With `allowFreeText` the typed text itself is a valid
 * value (committed live), so the shopper can enter an area the suggestion list
 * doesn't carry — the storefront's own theme, not the admin Radix `Select`.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  allowFreeText = false,
  disabled = false,
  noMatchText,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboOption[];
  placeholder: string;
  allowFreeText?: boolean;
  disabled?: boolean;
  noMatchText?: string;
}) {
  const [open, setOpen] = useState(false);
  // null → show the selected option's label; string → the shopper's live query.
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedLabel = useMemo(() => {
    const hit = options.find((o) => o.value === value);
    return hit ? hit.label : allowFreeText ? value : "";
  }, [options, value, allowFreeText]);
  const text = query ?? selectedLabel;

  const filtered = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  // Close on outside click; snap the visible text back to the committed value.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const commit = (v: string) => {
    onChange(v);
    setQuery(null);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) commit(filtered[active].value);
      else if (allowFreeText) commit((query ?? "").trim());
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(null);
    }
  };

  const wrap: CSSProperties = { position: "relative", opacity: disabled ? 0.6 : 1 };
  const menu: CSSProperties = {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    zIndex: 30,
    maxHeight: 240,
    overflowY: "auto",
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    padding: 4,
  };
  const row = (on: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    padding: "9px 11px",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
    background: on ? "var(--primary-soft)" : "transparent",
    color: on ? "var(--primary)" : "var(--text)",
  });

  return (
    <div ref={wrapRef} style={wrap}>
      <input
        style={{ ...input, cursor: disabled ? "not-allowed" : "text" }}
        disabled={disabled}
        placeholder={placeholder}
        value={text}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setOpen(true);
          setActive(0);
          if (allowFreeText) onChange(v);
        }}
        onKeyDown={onKeyDown}
      />
      {open && !disabled ? (
        <div id={listId} style={menu} role="listbox">
          {filtered.length > 0 ? (
            filtered.map((o, i) => (
              <div
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                style={row(i === active)}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(o.value);
                }}
              >
                {o.label}
              </div>
            ))
          ) : (
            <div style={{ padding: "9px 11px", fontSize: 13, color: "var(--muted)" }}>
              {noMatchText ?? "No matches"}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
