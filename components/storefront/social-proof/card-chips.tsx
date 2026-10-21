"use client";
// coding-standard: maintained

import type { CatalogProduct } from "@/lib/storefront-client";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { SoldChip, StockChip, useStockLeftText } from "./sold-chip";

/**
 * A product card's chip line: "120 sold" and "Only 3 left", side by side. The line itself is drawn
 * only when one of them shows, so a card without chips keeps its spacing. A card has no selected
 * variant, so the stock chip reads the product's total.
 */
export function CardChips({
  product,
  centered,
}: {
  product: Pick<CatalogProduct, "soldCount" | "availableQuantity" | "tracked">;
  centered?: boolean;
}) {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const stockText = useStockLeftText(product.availableQuantity, product.tracked);
  const stock = !!stockText && !!store?.socialProof?.stockLeft?.showOnCards;
  if (product.soldCount == null && !stock) return null;
  return (
    <span
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 5,
        justifyContent: centered ? "center" : undefined,
        margin: "0 0 7px",
      }}
    >
      {product.soldCount != null ? <SoldChip count={product.soldCount} place="card" /> : null}
      {stock ? <StockChip available={product.availableQuantity} tracked={product.tracked} place="card" /> : null}
    </span>
  );
}
