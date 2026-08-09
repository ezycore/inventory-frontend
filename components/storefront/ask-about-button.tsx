"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { usePublishContactContext } from "@/services/stores/use-sf-contact-store";
import { Icon } from "@/components/storefront/sf-icons";
import { useContactLink } from "@/components/storefront/use-contact-link";
import { money } from "@/components/storefront/format";

/**
 * The product page's inline "ask about this" button, sitting in the buy row.
 *
 * It exists alongside the floating launcher rather than instead of it because it
 * is the higher-intent path: a shopper who taps it is asking about THIS product,
 * and the message says so. It is also the only contact affordance that survives
 * on a mobile product page whose sticky buy bar is covering the corner the
 * launcher lives in.
 *
 * Rendering it is what publishes the product context, so the floating launcher
 * on the same page sends the same message — one component owns the sentence.
 */
export function AskAboutButton({
  productName,
  variantLabel,
  price,
  currency,
}: {
  productName: string;
  variantLabel?: string;
  price: number;
  currency?: string;
}) {
  const { slug, base } = useStoreContext();
  const { data: store } = useStore(slug);
  const { t } = useStorefrontUI();

  const title = variantLabel ? `${productName} — ${variantLabel}` : productName;
  // The URL is deliberately absent: `window.location.href` is not available
  // during SSR, and a message carrying the product name plus its price already
  // identifies the item to a merchant looking at their own catalogue.
  const context = t.ctxProduct.replace(
    "{product}",
    `${title} (${money(price, currency)})`,
  );

  usePublishContactContext(context);

  const link = useContactLink(store, base);
  if (!link) return null;

  // With several channels configured there is no single destination to link to,
  // so the inline button steps aside and the floating launcher — which can fan
  // them out — carries the page. It still published the context above.
  const single = link.channels.length === 1 ? link.channels[0] : null;
  if (!single) return null;

  return (
    <a
      href={link.hrefFor(single)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.chatAria
        .replace("{store}", link.storeName)
        .replace("{channel}", single.label)}
      title={t.askAboutThis}
      style={{ ...btn, color: single.spec.color, borderColor: single.spec.color }}
    >
      <Icon name={single.spec.icon} size={20} />
    </a>
  );
}

const btn: CSSProperties = {
  flex: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  // Matches the height of the Add-to-cart / Buy-now buttons beside it
  // (14px padding + 14.5px line box) so the row stays on one baseline.
  width: 50,
  alignSelf: "stretch",
  minHeight: 50,
  background: "transparent",
  border: "1px solid",
  borderRadius: 9,
};
