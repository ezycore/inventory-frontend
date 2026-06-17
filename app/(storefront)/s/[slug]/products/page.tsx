"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  useStore,
  useStoreCategories,
  useStoreProducts,
} from "@/services/storefront/hooks";
import { ProductCard } from "@/components/storefront/product-card";

function ProductsInner() {
  const slug = String(useParams().slug);
  const initialCategory = useSearchParams().get("categoryId") ?? "";

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [page, setPage] = useState(1);

  const { data: store } = useStore(slug);
  const { data: categories } = useStoreCategories(slug);
  const { data, isLoading } = useStoreProducts(slug, {
    q: q || undefined,
    categoryId: categoryId || undefined,
    page,
    limit: 12,
  });

  const currency = store?.currency;
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search products…"
          className="w-full rounded-md border px-3 py-2 text-sm sm:max-w-xs"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p._id} slug={slug} product={p} currency={currency} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
      <ProductsInner />
    </Suspense>
  );
}
