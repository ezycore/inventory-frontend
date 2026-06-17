"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePlaceOrder, useStore } from "@/services/storefront/hooks";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { formatMoney } from "@/components/storefront/format";
import { storefrontApi } from "@/lib/storefront-client";

type ShippingRule = {
  mode: "flat" | "free_over_threshold" | "none";
  flatFee?: number;
  freeThreshold?: number;
};

function computeShipping(rule: ShippingRule | undefined, subtotal: number): number {
  if (!rule) return 0;
  if (rule.mode === "flat") return rule.flatFee || 0;
  if (rule.mode === "free_over_threshold") {
    return subtotal >= (rule.freeThreshold || 0) ? 0 : rule.flatFee || 0;
  }
  return 0;
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  bank: "Bank / Manual transfer",
};

export default function CheckoutPage() {
  const slug = String(useParams().slug);
  const router = useRouter();
  const { data: store } = useStore(slug);
  const shopper = useShopperStore((s) => s.shopper);

  const storeSlug = useCartStore((s) => s.storeSlug);
  const allItems = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const token = useShopperStore((s) => s.token);
  const placeOrder = usePlaceOrder(slug);

  const items = storeSlug === slug ? allItems : [];
  const currency = store?.currency;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = computeShipping(store?.shippingRule, subtotal);

  const methods = store?.allowedPaymentMethods ?? ["cod"];
  const [payment, setPayment] = useState<"cod" | "bank">("cod");
  const effectivePayment = methods.includes(payment) ? payment : methods[0];

  const [addr, setAddr] = useState({
    name: shopper?.name ?? "",
    phone: shopper?.phone ?? "",
    address: "",
    city: "",
    notes: "",
  });
  const set = (k: keyof typeof addr, v: string) =>
    setAddr((a) => ({ ...a, [k]: v }));

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCoupon = async () => {
    if (!couponInput.trim() || !token) return;
    setApplyingCoupon(true);
    try {
      const res = await storefrontApi.validateCoupon(slug, token, {
        code: couponInput.trim(),
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      setAppliedCoupon(res);
      toast.success(`Coupon ${res.code} applied`);
    } catch (e) {
      setAppliedCoupon(null);
      toast.error((e as Error).message);
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (!shopper) {
    return (
      <div className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold">Sign in to check out</h1>
        <Link
          href={`/s/${slug}/account`}
          className="inline-block rounded-md bg-[var(--sf-brand,#111827)] px-4 py-2 text-sm text-white"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <p className="text-sm text-gray-500">Your cart is empty.</p>
        <Link href={`/s/${slug}/products`} className="text-sm underline">
          Browse products
        </Link>
      </div>
    );
  }

  const canSubmit =
    addr.name.trim() && addr.phone.trim() && addr.address.trim();

  const submit = () => {
    placeOrder.mutate(
      {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: {
          name: addr.name,
          phone: addr.phone,
          address: addr.address,
          city: addr.city || undefined,
          notes: addr.notes || undefined,
        },
        paymentMethod: effectivePayment,
        couponCode: appliedCoupon?.code,
      },
      {
        onSuccess: (order) => {
          clear();
          toast.success("Order placed!");
          router.push(`/s/${slug}/account/orders/${order.orderNumber}`);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Address + payment */}
      <div className="space-y-4 md:col-span-2">
        <h1 className="text-xl font-semibold">Checkout</h1>

        <div className="space-y-3 rounded-lg border bg-white p-4">
          <h2 className="font-medium">Delivery address</h2>
          <input
            value={addr.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            value={addr.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="Phone"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            value={addr.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Address"
            rows={2}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            value={addr.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="City / area (optional)"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            value={addr.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Order notes (optional)"
            rows={2}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 rounded-lg border bg-white p-4">
          <h2 className="font-medium">Payment</h2>
          {methods.map((m) => (
            <label key={m} className="flex items-center gap-3 text-sm">
              <input
                type="radio"
                name="payment"
                checked={effectivePayment === m}
                onChange={() => setPayment(m as "cod" | "bank")}
              />
              {PAYMENT_LABELS[m] ?? m}
            </label>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Order summary</h2>
        <div className="space-y-1 text-sm">
          {items.map((i) => (
            <div key={i.productId} className="flex justify-between">
              <span className="truncate pr-2">
                {i.name} × {i.quantity}
              </span>
              <span>{formatMoney(i.price * i.quantity, currency)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Coupon code"
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
          <button
            type="button"
            disabled={applyingCoupon || !couponInput.trim()}
            onClick={applyCoupon}
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        <div className="border-t pt-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatMoney(subtotal, currency)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({appliedCoupon?.code})</span>
              <span>-{formatMoney(discount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Shipping</span>
            <span>{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</span>
          </div>
          <div className="mt-1 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(total, currency)}</span>
          </div>
        </div>
        <button
          type="button"
          disabled={!canSubmit || placeOrder.isPending}
          onClick={submit}
          className="w-full rounded-md bg-[var(--sf-brand,#111827)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {placeOrder.isPending ? "Placing order…" : "Place order"}
        </button>
        <p className="text-center text-xs text-gray-400">
          Stock &amp; prices are re-checked when you place the order.
        </p>
      </div>
    </div>
  );
}
