"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { Icon } from "@/components/storefront/sf-icons";
import {
  CHIP_SWATCHES,
  readableOn,
  soldChipText,
  stockLeftText,
  type SocialLook,
} from "@/lib/storefront-social-proof";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useSocialLook } from "@/services/storefront/use-social-look";

/**
 * The chip's colours. "accent" rides the theme's primary variables, so a theme change carries it;
 * a swatch or custom colour is a hex, and a solid fill picks black or white text by contrast — no
 * combination of settings can draw unreadable text.
 */
function chipColors(look: SocialLook, color: string): CSSProperties {
  const named = CHIP_SWATCHES[color as keyof typeof CHIP_SWATCHES];
  const hex = named ?? (color.startsWith("#") ? color : null);
  const main = hex ?? "var(--primary, #2563eb)";
  switch (look.chipStyle) {
    case "solid":
      return { background: main, color: hex ? readableOn(hex) : "var(--on-primary, #fff)" };
    case "outline":
      return { border: `1px solid ${main}`, color: main };
    case "text":
      return { color: main, padding: 0 };
    default:
      return {
        background: hex ? `${hex}1f` : "var(--primary-soft, #2563eb1f)",
        color: main,
      };
  }
}

/**
 * Font size / padding per place and size. On the product page "Small" is EXACTLY the "In stock"
 * badge it sits beside (`stockBadge` in product-part-view.tsx — 12px, 3px 9px); a chip a step
 * smaller than its neighbour read as a mistake. Cards are denser, so they get their own pair.
 */
// `lineHeight: 1` with the padding carrying the height: an inherited ~1.5 line box sat the text
// visibly off-centre from the icon beside it. Page Small is still 24px tall, like "In stock".
const SIZES = {
  page: { sm: { fontSize: 12, padding: "6px 9px", icon: 13 }, md: { fontSize: 13.5, padding: "7px 12px", icon: 15 } },
  card: { sm: { fontSize: 11, padding: "4px 7px", icon: 11 }, md: { fontSize: 12, padding: "5px 9px", icon: 13 } },
} as const;

/**
 * The chip as drawn — shared by the storefront and the Customize panel's own preview. `kind`
 * "stock" is the "Only 3 left" chip: the same style and size, its own colour and icon.
 */
export function SoldChipView({
  text,
  look,
  place = "page",
  kind = "sold",
}: {
  text: string;
  look: SocialLook;
  place?: "page" | "card";
  kind?: "sold" | "stock";
}) {
  const size = SIZES[place][look.chipSize];
  const icon = kind === "stock" ? look.stockIcon : look.chipIcon;
  return (
    <span
      {...(kind === "stock" ? { "data-stock-chip": "" } : { "data-sold-chip": "" })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        maxWidth: "100%",
        fontSize: size.fontSize,
        fontWeight: 600,
        lineHeight: 1,
        padding: size.padding,
        borderRadius: 999,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...chipColors(look, kind === "stock" ? look.stockColor : look.chipColor),
      }}
    >
      {icon !== "none" ? <Icon name={icon} size={size.icon} style={{ display: "block", flexShrink: 0 }} /> : null}
      {text}
    </span>
  );
}

/**
 * "120 sold" — rendered only when the backend sent a number, which it does only while the chip
 * is on and the count is past the store's minimum. `count` is already rounded when the store
 * rounds; the label adds the "+".
 */
export function SoldChip({ count, place = "page" }: { count: number | undefined; place?: "page" | "card" }) {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const { lang } = useStorefrontUI();
  const look = useSocialLook();
  const sold = store?.socialProof?.soldCount;
  if (count == null || !sold) return null;
  return <SoldChipView text={soldChipText(count, sold, lang)} look={look} place={place} />;
}

/** The stock chip's text for this product, or `null` — the hook behind `StockChip`. */
export function useStockLeftText(available: number | undefined, tracked: boolean | undefined): string | null {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const { lang } = useStorefrontUI();
  return stockLeftText(store?.socialProof?.stockLeft, available, tracked ?? store?.tracked, lang);
}

/**
 * "Only 3 left" — drawn only while the store has the chip on and stock is between 1 and the
 * threshold (`stockLeftText`). `place` "card" also needs the merchant's "Show on product cards".
 */
export function StockChip({
  available,
  tracked,
  place = "page",
}: {
  available: number | undefined;
  tracked: boolean | undefined;
  place?: "page" | "card";
}) {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const look = useSocialLook();
  const text = useStockLeftText(available, tracked);
  if (!text || (place === "card" && !store?.socialProof?.stockLeft?.showOnCards)) return null;
  return <SoldChipView text={text} look={look} place={place} kind="stock" />;
}
