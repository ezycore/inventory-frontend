// coding-standard: maintained
import type { ProductTag, StoreTemplates } from "@/lib/storefront-client";
import { discountPct, money } from "@/components/storefront/format";

/**
 * What a product CARD draws over its photo — the merchant's controls over the
 * two badges (docs/plan/product-card-badges.md). Pure, so the rules are pinned
 * by `card-badges.test.ts` rather than by a screenshot.
 *
 * Only the card filters. The product page renders every tag through
 * `ProductTagChips` directly: its chips are the facet links, and it has room.
 */

/**
 * The tags that get a chip on the card, best first.
 *
 * `showOnCard: false` never takes a slot. The rest sort by `cardPriority`
 * (lower first, unset after every set one) and keep the product's own attach
 * order on a tie — `Array.prototype.sort` is stable. With nothing set this is
 * exactly the first `max` tags, which is what every card showed before the
 * controls existed.
 */
export function cardBadgeTags(
  tags: ProductTag[] | undefined,
  max: number,
): ProductTag[] {
  if (!tags?.length || max <= 0) return [];
  return tags
    .filter((tag) => tag.showOnCard !== false)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, max);
}

const rank = (tag: ProductTag) => tag.cardPriority ?? Number.POSITIVE_INFINITY;

/**
 * The discount badge's text, or `null` for no badge.
 *
 * A campaign's own label ("Eid Sale") wins over the store's format, but only
 * while there is a real saving behind it and the store has not switched the
 * badge off. The struck compare-at price is NOT decided here — it stays in the
 * price row whatever this returns, so the shopper can always check the saving.
 */
export function discountBadgeText({
  price,
  compareAt,
  currency,
  mode,
  label,
}: {
  price: number | null | undefined;
  compareAt: number | null | undefined;
  currency?: string;
  mode: StoreTemplates["discountBadge"];
  label?: string | null;
}): string | null {
  const pct = discountPct(price, compareAt);
  if (pct <= 0 || mode === "off") return null;
  const custom = label?.trim();
  if (custom) return custom;
  if (mode === "amount") return `-${money((compareAt ?? 0) - (price ?? 0), currency)}`;
  return `-${pct}%`;
}
