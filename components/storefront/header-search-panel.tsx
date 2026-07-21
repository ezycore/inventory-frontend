"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { money, discountPct } from "@/components/storefront/format";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import type { CatalogCategory, CatalogProduct } from "@/lib/storefront-client";
import type { HeaderSearchController } from "@/services/storefront/use-header-search";

const sectionLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--faint)",
  padding: "12px 16px 6px",
};

const rowBtn: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "9px 16px",
  border: "none",
  background: "none",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  color: "var(--text)",
};

const chip: CSSProperties = {
  border: "1px solid var(--border-strong)",
  background: "var(--card)",
  color: "var(--muted)",
  borderRadius: 999,
  padding: "5px 13px",
  fontSize: 12.5,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
};

/** Split a product name around the query so the match reads at a glance. */
function highlight(name: string, q: string): ReactNode {
  const i = q ? name.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <mark style={{ background: "var(--primary-soft)", color: "var(--primary)", borderRadius: 3, padding: "0 1px" }}>
        {name.slice(i, i + q.length)}
      </mark>
      {name.slice(i + q.length)}
    </>
  );
}

/**
 * The dropdown contents shared by every search anchor: recents + category
 * chips when the query is empty, skeletons while fetching, then result rows
 * (or an empty state). The caller wraps this in its own scroll container.
 */
export function SearchPanel({
  c,
  categories,
}: {
  c: HeaderSearchController;
  categories: CatalogCategory[];
}) {
  const { t } = useStorefrontUI();

  if (!c.hasQuery) {
    return (
      <div>
        {c.recents.length > 0 ? (
          <>
            <div style={sectionLabel}>
              <span>{t.recentSearches}</span>
              <button
                type="button"
                onClick={c.clearRecents}
                style={{ border: "none", background: "none", font: "inherit", letterSpacing: "inherit", textTransform: "uppercase", color: "var(--muted)", cursor: "pointer", padding: 0 }}
              >
                {t.clearAll}
              </button>
            </div>
            {c.recents.map((r) => (
              <button key={r} type="button" className="sf-search-row" onClick={() => c.applyRecent(r)} style={rowBtn}>
                <span style={{ display: "flex", color: "var(--faint)" }}>
                  <Icon name="clock" size={16} />
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{r}</span>
              </button>
            ))}
          </>
        ) : null}
        {categories.length > 0 ? (
          <>
            <div style={sectionLabel}>
              <span>{t.categoriesLabel}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "6px 16px 14px" }}>
              {categories.slice(0, 8).map((cat) => (
                <button key={cat._id} type="button" className="sf-search-chip" onClick={() => c.goCategory(cat._id)} style={chip}>
                  {cat.name}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  if (c.loading) {
    return (
      <div style={{ padding: "6px 0" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 16px" }}>
            <span className="sf-skeleton" style={{ width: 42, height: 42, borderRadius: 8, flex: "none" }} />
            <span className="sf-skeleton" style={{ height: 12, flex: 1, borderRadius: 6 }} />
            <span className="sf-skeleton" style={{ height: 12, width: 58, borderRadius: 6, flex: "none" }} />
          </div>
        ))}
      </div>
    );
  }

  if (c.items.length === 0) {
    return (
      <div style={{ padding: "26px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, color: "var(--faint)" }}>
          <Icon name="search" size={34} />
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 3px" }}>{t.noResults}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 12px" }}>{t.noResultsMsg}</div>
        <button
          type="button"
          onClick={() => c.goSearchPage()}
          style={{ border: "none", background: "var(--primary-soft)", color: "var(--primary)", borderRadius: 7, padding: "7px 14px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
        >
          {t.viewAllProducts}
        </button>
      </div>
    );
  }

  const catName = new Map(categories.map((cat) => [cat._id, cat.name]));
  return (
    <div>
      {c.items.map((p, i) => (
        <SearchResultRow
          key={p._id}
          product={p}
          category={p.categoryId ? catName.get(p.categoryId) : undefined}
          currency={c.currency}
          q={c.q.trim()}
          outLabel={t.outOfStock}
          active={c.active === i}
          onActivate={() => c.goProduct(p)}
          onHover={() => c.setActive(i)}
        />
      ))}
      <button
        type="button"
        className="sf-search-viewall"
        onClick={() => c.goSearchPage()}
        onMouseEnter={() => c.setActive(c.items.length)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "12px 16px",
          border: "none",
          borderTop: "1px solid var(--border)",
          background: c.active === c.items.length ? "var(--primary-soft)" : "none",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--primary)",
          cursor: "pointer",
        }}
      >
        {t.showResults.replace("{n}", String(c.total))}
        <Icon name="chevR" size={15} />
      </button>
    </div>
  );
}

function SearchResultRow({
  product,
  category,
  currency,
  q,
  outLabel,
  active,
  onActivate,
  onHover,
}: {
  product: CatalogProduct;
  category?: string;
  currency?: string;
  q: string;
  outLabel: string;
  active: boolean;
  onActivate: () => void;
  onHover: () => void;
}) {
  const outOfStock = product.availableQuantity <= 0;
  const thumb = product.images?.[0]?.thumbnailUrl || product.images?.[0]?.url;
  const onSale = discountPct(product.price, product.compareAtPrice) > 0;
  return (
    <button
      type="button"
      className="sf-search-row"
      onClick={onActivate}
      onMouseEnter={onHover}
      style={{ ...rowBtn, background: active ? "var(--surface)" : undefined }}
    >
      <span style={{ width: 42, height: 42, flex: "none", borderRadius: 8, overflow: "hidden", opacity: outOfStock ? 0.55 : 1 }}>
        <Media src={thumb} alt={product.name} label="product" radius={8} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {highlight(product.name, q)}
          {outOfStock ? (
            <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", background: "var(--surface)", borderRadius: 5, padding: "1px 7px", marginLeft: 7, verticalAlign: 1 }}>
              {outLabel}
            </span>
          ) : null}
        </span>
        {category ? (
          <span style={{ display: "block", fontSize: 11.5, color: "var(--faint)", marginTop: 1 }}>{category}</span>
        ) : null}
      </span>
      <span style={{ flex: "none", textAlign: "right", fontSize: 13.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
        {onSale ? (
          <span style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--faint)", textDecoration: "line-through" }}>
            {money(product.compareAtPrice, currency)}
          </span>
        ) : null}
        {money(product.price, currency)}
      </span>
    </button>
  );
}
