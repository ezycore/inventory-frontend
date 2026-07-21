"use client";
// coding-standard: maintained

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/storefront/sf-icons";
import { optionRow, popoverMenu } from "@/components/storefront/menu-styles";

export interface SfSelectOption {
  value: string;
  label: string;
}

/**
 * Storefront-native dropdown select (button trigger + popover listbox) — the
 * non-searchable sibling of the checkout Combobox, sharing its menu styling
 * via `menu-styles.ts`. Use this instead of a bare `<select>` (which renders
 * the OS picker and ignores the store theme) and instead of the admin Radix
 * `SimpleSelect` (Tailwind/admin tokens — doesn't follow `.sf-root` theming).
 */
export function SfSelect({
  value,
  options,
  onChange,
  ariaLabel,
  align = "right",
}: {
  value: string;
  options: SfSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  /** Which trigger edge the (possibly wider) menu hangs from. */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openMenu = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openMenu();
      else setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) openMenu();
      else if (options[active]) commit(options[active].value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: "inherit",
          color: "var(--text)",
          background: "var(--card)",
          border: "1px solid var(--border-strong)",
          borderRadius: 8,
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        {selected?.label}
        <span
          style={{
            display: "flex",
            color: "var(--muted)",
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 0.15s",
          }}
        >
          <Icon name="chevD" size={13} />
        </span>
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          style={{
            ...popoverMenu,
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            minWidth: "100%",
            whiteSpace: "nowrap",
          }}
        >
          {options.map((o, i) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              style={{ ...optionRow(i === active), fontSize: 13, gap: 8 }}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(o.value);
              }}
            >
              <span style={{ flex: 1 }}>{o.label}</span>
              {o.value === value ? <Icon name="check" size={13} /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
