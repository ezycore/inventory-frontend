"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/services/storefront/hooks";
import { useCartStore } from "@/services/stores/use-cart-store";
import { formatMoney } from "@/components/storefront/format";

export default function CartPage() {
  const slug = String(useParams().slug);
  const { data: store } = useStore(slug);

  const storeSlug = useCartStore((s) => s.storeSlug);
  const allItems = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  const items = storeSlug === slug ? allItems : [];
  const currency = store?.currency;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Your cart</h1>
        <p className="text-sm text-gray-500">Your cart is empty.</p>
        <Link
          href={`/s/${slug}/products`}
          className="inline-block rounded-md bg-[var(--sf-brand,#111827)] px-4 py-2 text-sm text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Your cart</h1>

      <div className="divide-y rounded-lg border bg-white">
        {items.map((i) => (
          <div key={i.productId} className="flex items-center gap-3 p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
              {i.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{i.name}</p>
              <p className="text-sm text-gray-500">
                {formatMoney(i.price, currency)}
              </p>
            </div>
            <input
              type="number"
              min={1}
              max={i.maxQty > 0 ? i.maxQty : undefined}
              value={i.quantity}
              onChange={(e) => updateQty(i.productId, Number(e.target.value) || 1)}
              className="w-16 rounded-md border px-2 py-1 text-sm"
            />
            <span className="w-24 text-right text-sm font-semibold">
              {formatMoney(i.price * i.quantity, currency)}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i.productId)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <span className="text-sm text-gray-600">Subtotal</span>
        <span className="text-lg font-bold">{formatMoney(subtotal, currency)}</span>
      </div>

      <div className="flex justify-end">
        <Link
          href={`/s/${slug}/checkout`}
          className="rounded-md bg-[var(--sf-brand,#111827)] px-5 py-2 text-sm font-medium text-white"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
