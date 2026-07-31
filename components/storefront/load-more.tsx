"use client";
// coding-standard: maintained
/**
 * The tail control under a product listing when the store is on an infinite /
 * load-more pagination template. One component for both modes and both listing
 * pages (collection + search), so the accessible status line and the end state
 * can't drift between them.
 *
 * `infinite` is deliberately NOT infinite: it auto-loads `AUTO_LOADS` pages and
 * then asks for a tap. Auto-loading forever makes the footer unreachable — this
 * storefront's footer carries real navigation (CMS pages, contact, social) and
 * the mobile bottom nav sits over it — and it strands keyboard and screen-reader
 * users in a list with no end. Two free pages is the usual compromise: the
 * scroll feels seamless through the range most shoppers browse, and anyone going
 * deeper opts in.
 *
 * **Remount it when the query changes** (`key={filterKey}`) — that is what resets
 * the auto-load budget, so a new filter gets its own two free pages.
 */
import { useEffect, useRef, useState } from "react";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/** Pages fetched without asking, after the first. */
export const AUTO_LOADS = 2;

export function LoadMore({
  mode,
  hasMore,
  loading,
  onLoad,
  shown,
  total,
}: {
  mode: "infinite" | "loadMore";
  hasMore: boolean;
  loading: boolean;
  onLoad: () => void;
  shown: number;
  total: number;
}) {
  const { t } = useStorefrontUI();
  const [autoUsed, setAutoUsed] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  const auto = mode === "infinite" && hasMore && autoUsed < AUTO_LOADS;

  useEffect(() => {
    const el = sentinel.current;
    if (!auto || !el || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setAutoUsed((n) => n + 1);
        onLoadRef.current();
      },
      // Start the fetch before the shopper reaches the end, so the next rows are
      // usually there by the time they would have seen the gap.
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // `loading` is a dependency on purpose: an observer only reports *changes* in
    // intersection, so one left mounted across a fetch never re-fires while the
    // sentinel stays on screen. Rebuilding it when the fetch settles re-reads the
    // current position and continues — without this the scroll stalls one page in.
  }, [auto, loading]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 28 }}>
      <div ref={sentinel} aria-hidden="true" />
      {/* Announced rather than shown-only: with auto-load there is no other cue
          that the list grew. */}
      <span aria-live="polite" style={{ fontSize: 13, color: "var(--muted)" }}>
        {t.showingOf.replace("{n}", String(shown)).replace("{total}", String(total))}
      </span>
      {hasMore && !auto ? (
        <button
          type="button"
          onClick={onLoad}
          disabled={loading}
          style={{
            background: "var(--card)",
            color: "var(--text)",
            border: "1px solid var(--border-strong)",
            padding: "13px 30px",
            borderRadius: 9,
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "progress" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? t.loading : t.loadMore}
        </button>
      ) : null}
    </div>
  );
}
