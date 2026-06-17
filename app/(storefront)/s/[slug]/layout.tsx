"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingCart, User } from "lucide-react";
import { useStore, useStorePages } from "@/services/storefront/hooks";
import { resolveThemeColors } from "@/lib/storefront-theme";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useShopperStore } from "@/services/stores/use-shopper-store";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const slug = String(useParams().slug);
  const { data: store, isError } = useStore(slug);
  const { data: footerPages } = useStorePages(slug);
  const cartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0),
  );
  const shopper = useShopperStore((s) => s.shopper);

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-xl font-semibold">Store unavailable</h1>
        <p className="text-sm text-gray-500">
          This store doesn&apos;t exist or isn&apos;t published yet.
        </p>
      </div>
    );
  }

  const base = `/s/${slug}`;
  const { brandColor, accentColor } = resolveThemeColors(store?.theme);
  // Expose theme colors as CSS variables so every storefront page/component
  // (buttons via bg-[var(--sf-brand)], links via text-[var(--sf-accent)]) themes
  // off the merchant's preset/overrides without prop-drilling.
  const themeVars = {
    "--sf-brand": brandColor,
    "--sf-accent": accentColor,
  } as React.CSSProperties;

  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50 text-gray-900"
      style={themeVars}
    >
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href={base}
            className="text-lg font-bold text-[var(--sf-brand,#111827)]"
          >
            {store?.name ?? "Store"}
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href={`${base}/products`} className="hover:underline">
              Products
            </Link>
            <Link href={`${base}/account`} className="flex items-center gap-1 hover:underline">
              <User className="h-4 w-4" />
              {shopper ? shopper.name.split(" ")[0] : "Account"}
            </Link>
            <Link href={`${base}/cart`} className="relative flex items-center gap-1 hover:underline">
              <ShoppingCart className="h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <span className="ml-1 rounded-full bg-[var(--sf-brand,#111827)] px-1.5 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
          {footerPages && footerPages.length > 0 && (
            <nav className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
              {footerPages.map((p) => (
                <Link
                  key={p._id}
                  href={`${base}/pages/${p.slug}`}
                  className="text-[var(--sf-accent,#2563eb)] hover:underline"
                >
                  {p.title}
                </Link>
              ))}
            </nav>
          )}
          <p>{store?.name}</p>
          {store?.contact?.phone && <p>Call: {store.contact.phone}</p>}
          {store?.contact?.email && <p>Email: {store.contact.email}</p>}
          {store?.theme?.footerText && (
            <p className="mt-2">{store.theme.footerText}</p>
          )}
          <p className="mt-2 text-xs">Powered by EasyStock</p>
        </div>
      </footer>
    </div>
  );
}
