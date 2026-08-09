"use client";
// coding-standard: maintained
/**
 * Numbered pager — the storefront's "pages" listing mode.
 *
 * Shared by the collection page and search results so the two can't drift; it
 * was inline in the collection view until search grew paging too.
 *
 * It renders the real page numbers (`‹ 1 … 4 5 6 … 20 ›`), not just Prev/Next:
 * a shopper on a 20-page collection could otherwise only walk it one click at a
 * time, with no idea how deep the list went or where in it they stood.
 *
 * Note these are buttons, not links: page 2 has never had a URL of its own on
 * this storefront, so a crawler only ever saw page 1 here. That is why switching
 * a store to infinite/load-more costs no crawl path — there was none to lose.
 */
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/storefront/sf-icons";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/** Pages kept visible either side of the current one before a gap takes over. */
const SIBLINGS = 1;

/** One slot in the strip: a page to jump to, or the collapsed "…". */
export type PageItem = number | "gap";

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * The slots to render for a given position in the list.
 *
 * First and last are always reachable, `siblings` pages flank the current one,
 * and each jump collapses into one "…". The slot count is **constant** at every
 * page (`siblings * 2 + 5`), which is the point: a strip that grew and shrank
 * would slide the buttons out from under the cursor as the shopper walked the
 * collection. Holding that width is also why a "…" may stand in for a single
 * page mid-run (`1 … 3 4 5 …`) rather than showing it — spending the slot on
 * page 2 there would push the last page out of reach.
 */
export function pageItems(
  page: number,
  totalPages: number,
  siblings = SIBLINGS,
): PageItem[] {
  const slots = siblings * 2 + 5;
  if (totalPages <= slots) return range(1, totalPages);

  const current = Math.min(Math.max(page, 1), totalPages);
  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, totalPages);
  // Length of the unbroken run when only one side collapses — chosen so the
  // total stays at `slots` in all three shapes below.
  const run = siblings * 2 + 3;

  if (left <= 2) return [...range(1, run), "gap", totalPages];
  if (right >= totalPages - 1) {
    return [1, "gap", ...range(totalPages - run + 1, totalPages)];
  }
  return [1, "gap", ...range(left, right), "gap", totalPages];
}

export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const { t } = useStorefrontUI();
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label={t.pagination}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 5,
        marginTop: 28,
      }}
    >
      <StepBtn
        label={t.prev}
        icon="back"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      />
      {pageItems(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" style={gapStyle}>
            …
          </span>
        ) : (
          <PageBtn
            key={item}
            label={t.pageX.replace("{n}", String(item))}
            current={item === page}
            onClick={() => onChange(item)}
          >
            {item}
          </PageBtn>
        ),
      )}
      <StepBtn
        label={t.next}
        icon="chevR"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      />
    </nav>
  );
}

/* --------------------------------- pieces --------------------------------- */

const btn: CSSProperties = {
  minWidth: 36,
  height: 36,
  padding: "0 9px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text)",
  background: "var(--card)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  cursor: "pointer",
};

const gapStyle: CSSProperties = {
  minWidth: 22,
  textAlign: "center",
  fontSize: 13,
  color: "var(--faint)",
};

/** Prev / Next. The word is desktop-only — at 320px the strip needs the room,
 *  and the arrow plus the `aria-label` already carry the meaning. */
function StepBtn({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: "back" | "chevR";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...btn,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {icon === "back" ? <Icon name="back" size={15} /> : null}
      <span className="sf-desktop-only">{label}</span>
      {icon === "chevR" ? <Icon name="chevR" size={15} /> : null}
    </button>
  );
}

function PageBtn({
  children,
  label,
  current,
  onClick,
}: {
  children: ReactNode;
  label: string;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      className="sf-mono"
      style={{
        ...btn,
        ...(current
          ? {
              background: "var(--primary)",
              borderColor: "var(--primary)",
              color: "var(--on-primary)",
              fontWeight: 700,
            }
          : null),
      }}
    >
      {children}
    </button>
  );
}
