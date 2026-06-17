"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useStore, useStoreProduct } from "@/services/storefront/hooks";
import { useCartStore } from "@/services/stores/use-cart-store";
import { formatMoney } from "@/components/storefront/format";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = String(params.slug);
  const productSlug = String(params.productSlug);

  const { data: store } = useStore(slug);
  const { data: product, isLoading, isError } = useStoreProduct(slug, productSlug);
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (isError || !product) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Product not found.</p>
        <Link href={`/s/${slug}/products`} className="text-sm underline">
          ← Back to products
        </Link>
      </div>
    );
  }

  const price = product.price ?? 0;
  const outOfStock = product.availableQuantity <= 0;
  const img =
    product.images?.[0]?.url ||
    product.images?.[0]?.mediumUrl ||
    product.images?.[0]?.thumbnailUrl;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl border bg-white">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} className="aspect-square w-full object-cover" />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-gray-100 text-gray-300">
            No image
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {formatMoney(price, store?.currency)}
          </span>
          {product.compareAtPrice ? (
            <span className="text-base text-gray-400 line-through">
              {formatMoney(product.compareAtPrice, store?.currency)}
            </span>
          ) : null}
        </p>
        <p className="text-sm text-gray-600">
          {outOfStock ? (
            <span className="text-red-600">Out of stock</span>
          ) : (
            <span className="text-green-600">
              {product.availableQuantity} in stock
            </span>
          )}
        </p>

        {product.description && (
          <p className="whitespace-pre-line text-sm text-gray-700">
            {product.description}
          </p>
        )}

        {!outOfStock && (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={product.availableQuantity}
              value={qty}
              onChange={(e) =>
                setQty(
                  Math.max(
                    1,
                    Math.min(product.availableQuantity, Number(e.target.value) || 1),
                  ),
                )
              }
              className="w-20 rounded-md border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                addItem(
                  slug,
                  {
                    productId: product._id,
                    slug: product.slug,
                    name: product.name,
                    price,
                    image: product.images?.[0]?.thumbnailUrl,
                    maxQty: product.availableQuantity,
                  },
                  qty,
                );
                toast.success("Added to cart");
              }}
              className="rounded-md bg-[var(--sf-brand,#111827)] px-5 py-2 text-sm font-medium text-white"
            >
              Add to cart
            </button>
          </div>
        )}

        <Link href={`/s/${slug}/products`} className="block text-sm underline">
          ← Back to products
        </Link>
      </div>
    </div>
  );
}
