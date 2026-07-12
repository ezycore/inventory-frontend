"use client";
// coding-standard: maintained

import { Suspense, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useStore,
  useStoreCategories,
  useStoreProducts,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { resolveTemplates } from "@/lib/storefront-templates";
import { ProductCard } from "@/components/storefront/product-card";
import { SkeletonCard } from "@/components/storefront/sf-skeleton";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "18px var(--pad) 40px",
};

function CollectionInner() {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const pathname = usePathname();
  // The URL is the single source of truth for the filter, so header/home
  // category links keep working while already on this page (same-route query
  // navigation re-renders without remounting).
  const categoryId = useSearchParams().get("categoryId") ?? "";

  const [page, setPage] = useState(1);
  // Reset pagination whenever the active category changes (render-time adjust).
  const [prevCategory, setPrevCategory] = useState(categoryId);
  if (prevCategory !== categoryId) {
    setPrevCategory(categoryId);
    setPage(1);
  }

  const { data: store } = useStore(slug);
  const { data: categories } = useStoreCategories(slug);
  const { data, isLoading } = useStoreProducts(slug, {
    categoryId: categoryId || undefined,
    page,
    limit: 12,
  });

  const currency = store?.currency;
  const variant = resolveTemplates(store).collection;
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? items.length;
  const cats = categories ?? [];
  const activeCat = cats.find((c) => c._id === categoryId);

  // Sidebar picks navigate too (shareable URL), keeping one code path with the
  // header/home category links.
  const selectCategory = (id: string) => {
    router.replace(id ? `${pathname}?categoryId=${id}` : pathname, {
      scroll: false,
    });
  };

  const gridClass = variant === "grid3" || variant === "sidebar" ? "sf-grid-3" : "sf-grid-4";

  const grid = (
    <div className={gridClass} style={{ alignContent: "start" }}>
      {isLoading
        ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
        : items.map((p) => <ProductCard key={p._id} product={p} currency={currency} />)}
    </div>
  );

  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {activeCat?.name ?? t.allProducts}
          </h1>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {total} {t.results}
          </span>
        </div>
      </div>

      {variant === "sidebar" ? (
        <div style={{ display: "grid", gridTemplateColumns: "var(--colmain)", gap: "var(--gap)" }}>
          <aside style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, alignSelf: "start" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
              {t.category}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <FilterRow
                label={t.allProducts}
                active={!categoryId}
                onClick={() => selectCategory("")}
              />
              {cats.map((c) => (
                <FilterRow
                  key={c._id}
                  label={c.name}
                  active={categoryId === c._id}
                  onClick={() => selectCategory(c._id)}
                />
              ))}
            </div>
          </aside>
          {grid}
        </div>
      ) : (
        grid
      )}

      {!isLoading && items.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16 }}>{t.noResults}</p>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 28 }}>
          <PageBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t.prev}
          </PageBtn>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--on-primary)", background: "var(--primary)", borderRadius: 7, padding: "8px 14px" }}>
            {pagination.page}
          </span>
          <span style={{ fontSize: 13, color: "var(--muted)", padding: "0 6px" }}>
            / {pagination.totalPages}
          </span>
          <PageBtn disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            {t.next}
          </PageBtn>
        </div>
      ) : null}
    </div>
  );
}

function FilterRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        fontSize: 13,
        color: active ? "var(--text)" : "var(--muted)",
        fontWeight: active ? 600 : 400,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 15,
          height: 15,
          borderRadius: 4,
          flex: "none",
          background: active ? "var(--primary)" : "transparent",
          border: active ? "none" : "1.5px solid var(--border-strong)",
        }}
      />
      {label}
    </button>
  );
}

function PageBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
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

export default function CollectionPage() {
  const { t } = useStorefrontUI();
  return (
    <Suspense fallback={<p style={{ padding: 24, fontSize: 13, color: "var(--muted)" }}>{t.loading}</p>}>
      <CollectionInner />
    </Suspense>
  );
}
