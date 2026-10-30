"use client";
// coding-standard: maintained

import { Heart } from "lucide-react";
import type { WishedProduct } from "@/types/api";
import { formatMoney } from "@/components/storefront/format";
import { Badge } from "@/ui/components/badge";
import { Card } from "@/ui/components/card";

/**
 * A ranked list of wished products — the Wishlists page draws two of them (most
 * wished, and wished but sold out). "Wished by" counts shoppers and guest
 * browsers, one each, however many times they tapped the heart.
 */
export function WishedProductsCard({
  title,
  hint,
  empty,
  products,
  currency,
  isLoading,
}: {
  title: string;
  hint: string;
  empty: string;
  products: WishedProduct[];
  currency?: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {products.map((p) => (
            <li key={p.productId} className="flex items-center gap-3 text-sm">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- an R2 thumbnail, already sized
                <img
                  src={p.image}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-md border object-cover"
                />
              ) : (
                <span className="h-10 w-10 shrink-0 rounded-md border bg-muted" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {p.price === null ? "Priced per option" : formatMoney(p.price, currency)}
                  {p.purchased > 0 ? ` · ${p.purchased} bought after saving` : ""}
                </span>
              </span>
              {p.soldOut ? (
                <Badge variant="outline" className="shrink-0 border-destructive/40 text-destructive">
                  Sold out
                </Badge>
              ) : null}
              <span
                className="flex shrink-0 items-center gap-1 tabular-nums"
                title={`Saved by ${p.wishedBy} shopper${p.wishedBy === 1 ? "" : "s"}`}
              >
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                {p.wishedBy}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
