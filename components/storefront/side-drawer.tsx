"use client";
// coding-standard: maintained

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/storefront/sf-icons";

/** Must cover the .sf-drawer CSS transition (0.26s) so the exit finishes. */
const EXIT_MS = 280;

/**
 * Shared slide-over shell: scrim + fixed full-height panel with a pinned
 * header (title, optional accessory, built-in close) and an optional pinned
 * footer. The cart drawer (right) and the products filter drawer (left) both
 * render through this — drawer mechanics live in one place. Children own
 * their scroll (`flex: 1, overflowY: "auto"`). Positioning + slide/fade
 * transitions live in storefront.css (`.sf-drawer*`, reduced-motion aware);
 * the component keeps itself mounted through the exit animation.
 */
export function SideDrawer({
  open,
  onClose,
  side = "right",
  title,
  headerAccessory,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title: ReactNode;
  /** Rendered between the title and the close button (e.g. a Reset link). */
  headerAccessory?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  // Enter mounts closed / exit drops .sf-open immediately — render-time state
  // adjustments (no effect), so the closed position paints before the slide.
  if (open && !mounted) setMounted(true);
  if (!open && shown) setShown(false);

  // Async halves: flip to .sf-open a frame after the closed state painted
  // (double rAF — a single one can land too early for the transition to run),
  // and unmount only after the exit transition finished.
  useEffect(() => {
    if (open) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    const timer = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  // Esc closes — the drawer never holds unsaved state, so closing is always safe.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const openCls = shown ? " sf-open" : "";
  return (
    <>
      <div className={`sf-drawer-scrim${openCls}`} onClick={onClose} />
      <div className={`sf-drawer sf-drawer-${side}${openCls}`}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
              flex: 1,
              minWidth: 0,
            }}
          >
            {title}
          </h3>
          {headerAccessory}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              display: "flex",
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
        {footer ? (
          <div style={{ borderTop: "1px solid var(--border)", padding: "14px 20px" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </>
  );
}
