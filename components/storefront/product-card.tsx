"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useCartStore } from "@/services/stores/use-cart-store";
import { formatMoney } from "./format";

export function ProductCard({
  slug,
  product,
  currency,
}: {
  slug: string;
  product: CatalogProduct;
  currency?: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const price = product.price ?? 0;
  const outOfStock = product.availableQuantity <= 0;
  const thumb = product.images?.[0]?.thumbnailUrl || product.images?.[0]?.url;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border bg-white">
      <Link
        href={`/s/${slug}/products/${product.slug}`}
        className="block aspect-square overflow-hidden bg-gray-100"
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            No image
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/s/${slug}/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between">
          <span className="flex items-baseline gap-1">
            <span className="font-semibold">{formatMoney(price, currency)}</span>
            {product.compareAtPrice ? (
              <span className="text-xs text-gray-400 line-through">
                {formatMoney(product.compareAtPrice, currency)}
              </span>
            ) : null}
          </span>
          {product.featured && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Featured
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => {
            addItem(slug, {
              productId: product._id,
              slug: product.slug,
              name: product.name,
              price,
              image: thumb,
              maxQty: product.availableQuantity,
            });
            toast.success("Added to cart");
          }}
          className="rounded-md bg-[var(--sf-brand,#111827)] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
