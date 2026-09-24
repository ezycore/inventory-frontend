"use client";
// coding-standard: maintained

import { useEffect, type ReactNode } from "react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useOverlayTransition } from "@/hooks/use-overlay-transition";
import { Icon } from "@/components/storefront/sf-icons";

/** Must cover the .sf-drawer CSS transition (0.26s) so the exit finishes. */
const EXIT_MS = 280;

/**
 * Shared slide-over shell: scrim + fixed full-height panel with a pinned
 * header (title, optional accessory, built-in close) and an optional pinned
 * footer. The cart drawer and the catalogue's filter and sort panels all render
 * through this — drawer mechanics live in one place. Children own their scroll
 * (`flex: "1 1 auto", minHeight: 0, overflowY: "auto"` — `auto`, not `1`, so a
 * `sheet` sizes to its content instead of collapsing to its header).
 *
 * `side="sheet"` is a bottom sheet on a phone and a right-hand drawer from the
 * storefront breakpoint up. The switch is CSS (`.sf-drawer-sheet`), not a
 * `matchMedia` read, so the server and the first client render agree. Positioning + slide/fade
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
  side?: "left" | "right" | "sheet";
  title: ReactNode;
  /** Rendered between the title and the close button (e.g. a Reset link). */
  headerAccessory?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  // Freeze the catalogue behind the panel — without this an overscroll inside
  // the drawer's list scrolls the page underneath it.
  useBodyScrollLock(open);

  const { mounted, shown } = useOverlayTransition(open, EXIT_MS);

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
      <div
        role="dialog"
        aria-modal="true"
        className={`sf-drawer ${side === "sheet" ? "sf-drawer-right sf-drawer-sheet" : `sf-drawer-${side}`}${openCls}`}
      >
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
              // Padding (not size) grows the 20px glyph to a 44px touch target;
              // the negative margin keeps it sitting where it always did.
              padding: 12,
              margin: -12,
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
        {footer ? (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              // The panel is bottom-anchored, so the footer CTA lands under the
              // iPhone home indicator without the safe-area inset.
              padding: "14px 20px calc(14px + env(safe-area-inset-bottom))",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </>
  );
}
