"use client";
// coding-standard: maintained

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { Icon } from "@/components/storefront/sf-icons";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import {
  useHeaderSearch,
  type HeaderSearchController,
} from "@/services/storefront/use-header-search";
import { SearchPanel } from "@/components/storefront/header-search-panel";
import type { CatalogCategory } from "@/lib/storefront-client";

/* Popover shell for the classic bar. Minimal/centered reuse only the scroll. */
const popover: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  left: 0,
  right: 0,
  zIndex: 40,
  background: "var(--card)",
  border: "1px solid var(--border-strong)",
  borderRadius: 12,
  boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
  overflow: "hidden",
};
const panelScroll: CSSProperties = {
  maxHeight: 340,
  overflowY: "auto",
  overscrollBehavior: "contain",
};

/** Close `open` when a mousedown lands outside `ref`. */
function useOutsideClose(open: boolean, ref: { current: HTMLElement | null }, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, ref, close]);
}

/** The input row itself — icon, field, and a clear button once there's text. */
function SearchInput({
  c,
  autoFocus,
  size = "md",
}: {
  c: HeaderSearchController;
  autoFocus?: boolean;
  size?: "sm" | "md";
}) {
  const { t } = useStorefrontUI();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <div
      className="sf-search-box"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flex: 1,
        minWidth: 0,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: size === "sm" ? "0 12px" : "0 14px",
        height: size === "sm" ? 40 : 42,
      }}
    >
      <span style={{ display: "flex", color: "var(--faint)", flex: "none" }}>
        <Icon name="search" size={17} />
      </span>
      <input
        ref={ref}
        value={c.q}
        onChange={(e) => c.setQ(e.target.value)}
        onKeyDown={c.onInputKeyDown}
        placeholder={t.searchPh}
        aria-label={t.searchPh}
        autoComplete="off"
        spellCheck={false}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--text)",
          // 16px floor — below it iOS Safari zooms the page on focus and never
          // zooms back, which on the mobile takeover strands the shopper.
          fontSize: 16,
          fontWeight: 500,
          fontFamily: "inherit",
          height: "100%",
        }}
      />
      {c.q ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={c.clear}
          aria-label={t.clearAll}
          style={{ display: "flex", flex: "none", border: "none", background: "none", padding: 2, cursor: "pointer", color: "var(--faint)" }}
        >
          <Icon name="close" size={15} />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Classic-header search — a real input that opens a typeahead popover on focus.
 * Replaces the old button-styled-as-input that navigated away on click.
 */
export function HeaderSearchBar({ categories }: { categories: CatalogCategory[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const c = useHeaderSearch(() => setOpen(false), open);
  useOutsideClose(open, wrapRef, () => setOpen(false));

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1, minWidth: 200 }} onFocus={() => setOpen(true)}>
      <SearchInput c={c} />
      {open ? (
        <div className="sf-search-pop" style={popover}>
          <div style={panelScroll}>
            <SearchPanel c={c} categories={categories} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Minimal / Centered header search — an icon that expands a full-width layer
 * under the header (anchored to the sticky header, which is the nearest
 * positioned ancestor). Same typeahead, no page navigation.
 */
export function HeaderSearchIcon({ categories }: { categories: CatalogCategory[] }) {
  const { t } = useStorefrontUI();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const c = useHeaderSearch(() => setOpen(false), open);
  useOutsideClose(open, wrapRef, () => setOpen(false));

  return (
    // `display: contents` keeps this out of the positioning chain, so the layer
    // below resolves against the sticky header and spans its full width.
    <span ref={wrapRef} style={{ display: "contents" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.searchPh}
        aria-expanded={open}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", color: "var(--text)" }}
      >
        <Icon name="search" size={20} />
      </button>
      {open ? (
        <div
          className="sf-search-pop"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            zIndex: 40,
            background: "var(--card)",
            borderTop: "1px solid var(--border)",
            boxShadow: "0 16px 30px -12px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ maxWidth: 620, margin: "0 auto", padding: "14px var(--pad)" }}>
            <SearchInput c={c} autoFocus />
            <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", ...panelScroll }}>
              <SearchPanel c={c} categories={categories} />
            </div>
          </div>
        </div>
      ) : null}
    </span>
  );
}

/**
 * Mobile search — the full-screen takeover sheet (auto-focused input + results
 * list). Same typeahead, phone-shaped.
 *
 * **Controlled, and mounted once by the mobile chrome.** It owned its own state
 * and drew its own full-width trigger until the chrome became configurable, at
 * which point search stopped being one fixed field under the logo: it is an
 * `openSearch` action a merchant can put in either bar slot, in a tab, or on the
 * row under the brand. One sheet with the trigger outside it is what lets those
 * four entry points open the same panel instead of four copies of it — see
 * `components/storefront/mobile/`.
 */
export function HeaderSearchMobile({
  categories,
  open,
  onOpenChange,
}: {
  categories: CatalogCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useStorefrontUI();
  const setOpen = onOpenChange;
  const historyMarker = `sf-search-${useId()}`;
  const previousStateRef = useRef<unknown>(null);

  const close = useCallback((reason: "dismiss" | "navigate") => {
    const ownsHistoryEntry = window.history.state?.sfSearchSheet === historyMarker;
    if (ownsHistoryEntry && reason === "dismiss") {
      window.history.back();
      return;
    }
    if (ownsHistoryEntry) {
      // Remove the synthetic sheet entry before Next navigates. Replacing the
      // destination then leaves one clean Back step to this storefront page.
      window.history.replaceState(previousStateRef.current, "", window.location.href);
      setOpen(false);
      return "replace" as const;
    }
    setOpen(false);
    /* ⚠ `setOpen` is `onOpenChange`, a PROP — not a `useState` setter, and so
       not stable by construction. Leaving it out of these deps pinned `close`
       to whichever callback arrived first, and the React Compiler refused to
       optimize the component over exactly that mismatch (an ERROR, not a
       warning). The parent memoizes what it passes, so declaring it honestly
       here costs nothing — see `mobile-chrome.tsx`. */
  }, [historyMarker, setOpen]);

  const openSheet = useCallback(() => {
    if (window.history.state?.sfSearchSheet !== historyMarker) {
      previousStateRef.current = window.history.state;
      window.history.pushState(
        { ...(window.history.state ?? {}), sfSearchSheet: historyMarker },
        "",
        window.location.href,
      );
    }
  }, [historyMarker]);

  const c = useHeaderSearch(close, open);

  // Lock the page behind the takeover while it's open.
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onPopState = () => setOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close("dismiss");
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>(".sf-search-sheet");
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href]',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open, setOpen]);

  const sheet = open ? (
    <div
      className="sf-search-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={t.searchPh}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "var(--page)", display: "flex", flexDirection: "column", minHeight: "100dvh" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--border)", background: "var(--card)", flex: "none" }}>
        <SearchInput c={c} autoFocus size="sm" />
        <button type="button" onClick={() => close("dismiss")} style={{ flex: "none", border: "none", background: "none", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, color: "var(--primary)", cursor: "pointer", padding: "11px 6px" }}>
          {t.cancelEdit}
        </button>
      </div>
      <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <SearchPanel c={c} categories={categories} />
      </div>
    </div>
  ) : null;

  /* The synthetic history entry is pushed when the sheet OPENS, and the caller
     now owns that flag — so the push has to follow `open` rather than sit in a
     click handler that no longer exists here. Without it the Android back
     button leaves the shop instead of closing the search, which on a phone is
     the difference between a dismissable panel and a trap. */
  useEffect(() => {
    if (open) openSheet();
  }, [open, openSheet]);

  if (typeof document === "undefined" || !sheet) return null;
  return createPortal(
    sheet,
    document.querySelector<HTMLElement>(".sf-root") ?? document.body,
  );
}
