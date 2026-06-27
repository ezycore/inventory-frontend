"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStorePage } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { storeHref } from "@/lib/storefront-links";

export default function StoreContentPage() {
  const { slug, base } = useStoreContext();
  const pageSlug = String(useParams().pageSlug);
  const { data: page, isLoading, isError } = useStorePage(slug, pageSlug);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  if (isError || !page) {
    return (
      <div className="space-y-2 py-10 text-center">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <Link href={storeHref(base)} className="text-sm text-gray-500 hover:underline">
          ← Back to store
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{page.title}</h1>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {page.body}
      </div>
    </article>
  );
}
