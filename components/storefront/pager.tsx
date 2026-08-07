"use client";
// coding-standard: maintained
/**
 * Numbered Prev / n of N / Next pager — the storefront's "pages" listing mode.
 *
 * Shared by the collection page and search results so the two can't drift; it
 * was inline in the collection view until search grew paging too.
 *
 * Note these are buttons, not links: page 2 has never had a URL of its own on
 * this storefront, so a crawler only ever saw page 1 here. That is why switching
 * a store to infinite/load-more costs no crawl path — there was none to lose.
 */
import type { ReactNode } from "react";
import { useStorefrontUI } from "@/services/storefront/ui-context";

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 28 }}>
      <PageBtn disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t.prev}
      </PageBtn>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--on-primary)", background: "var(--primary)", borderRadius: 7, padding: "8px 14px" }}>
        {page}
      </span>
      <span style={{ fontSize: 13, color: "var(--muted)", padding: "0 6px" }}>
        / {totalPages}
      </span>
      <PageBtn disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {t.next}
      </PageBtn>
    </div>
  );
}

function PageBtn({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        fontSize: 13,
        fontWeight: 500,
        color: "var(--text)",
        border: "1px solid var(--border-strong)",
        borderRadius: 7,
        padding: "8px 13px",
        background: "var(--card)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
