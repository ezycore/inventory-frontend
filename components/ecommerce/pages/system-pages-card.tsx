"use client";
// coding-standard: maintained

import Link from "next/link";
import { PencilRuler } from "lucide-react";
import { useStorefrontPages } from "@/services/api";
import { Button } from "@/ui/components/button";

/** What each system page is, in the merchant's words. Keyed by `systemKey`. */
const BLURB: Record<string, string> = {
  cart: "What shoppers see when they open the full cart page.",
  checkout: "Where shoppers enter their details and place the order.",
  search: "What a shopper's search finds.",
  account: "Sign-in, and a shopper's own order history.",
  collection: "A category's products.",
  product: "One product's page.",
};

/**
 * The shop's built-in pages, once they have moved onto the builder — the cart,
 * the checkout, search and the account area.
 *
 * A card rather than a table: there are at most a handful, they are fixed, and
 * none of the table's columns says anything about them (they have no address of
 * their own, no ad attribution and no orders to count). Each can only be edited:
 * the page's core section cannot be removed, and the page itself cannot be
 * deleted or turned off, because the storefront serves its address regardless.
 *
 * The home page is deliberately absent — it has its own card above.
 */
export function SystemPagesCard() {
  const { data } = useStorefrontPages({ kind: "system", limit: 20 });
  const pages = (data?.items ?? []).filter((page) => page.systemKey && page.systemKey !== "home");
  if (pages.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Shop pages ({pages.length})</p>
        <p className="text-xs text-muted-foreground">
          Your shop&apos;s built-in pages. Add sections above and below what each one already shows.
        </p>
      </div>
      <ul className="divide-y">
        {pages.map((page) => (
          <li key={page._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{page.title}</p>
              <p className="text-xs text-muted-foreground">
                {BLURB[page.systemKey as string] ?? "A built-in page of your shop."}
                {page.hasDraft ? " It has unpublished changes." : null}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/ecommerce/pages/${page._id}`}>
                <PencilRuler className="mr-1.5 h-4 w-4" />
                Open editor
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
