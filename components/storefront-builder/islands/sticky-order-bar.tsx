"use client";
// coding-standard: maintained

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { CatalogProduct } from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { money } from "@/components/storefront/format";
import { listingSoldOut } from "@/components/storefront/product-choice";
import { useBuybarHeight } from "@/components/storefront/use-buybar-height";
import { useOrdersPaused } from "@/services/storefront/use-orders-paused";
import { ORDER_FORM_SELECTOR } from "@/components/storefront-builder/order-form-anchor";
import { brandButton } from "@/lib/storefront-button";

/** How close to the end of the page counts as the end — the bar would cover the last of it. */
const END_SLACK = 96;

/**
 * A landing page's sticky order bar: the product's name and price, and a button
 * to the page's order form, pinned to the bottom of a phone screen (hidden past
 * the storefront's one breakpoint by `.sfb-orderbar`).
 *
 * It gets out of the way rather than covering what it points at: hidden while
 * any order form is on screen, at the very end of the page, and for a sold-out
 * product. With no order form on the page the button opens the product page —
 * or, standing on that page already (`onProductPage`), goes back up to its buy
 * buttons. There it also stays away when the product page's own "sticky bar"
 * layout already pins a bar, so a phone never shows two.
 *
 * Publishes its height as `--sf-buybar-h`, like the product page's sticky bar,
 * so the floating contact button stacks above it instead of on its button.
 * Loaded only through the island map.
 */
export function StickyOrderBarIsland({
  product,
  currency,
  buttonLabel,
  onProductPage = false,
}: {
  product: CatalogProduct;
  currency?: string;
  buttonLabel?: string;
  /** Drawn on the product page itself, for the page's own product. */
  onProductPage?: boolean;
}) {
  const { base, slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const productLayout = useStoreTemplate(store, "product");
  const { t } = useStorefrontUI();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [formInView, setFormInView] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const forms = document.querySelectorAll(ORDER_FORM_SELECTOR);
    if (forms.length === 0) return;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setFormInView(visible.size > 0);
    });
    forms.forEach((form) => observer.observe(form));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const end = document.documentElement.scrollHeight - END_SLACK;
      setAtEnd(window.scrollY + window.innerHeight >= end);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const paused = useOrdersPaused();
  const pinnedByPage = onProductPage && productLayout === "sticky";
  const show = !paused && !pinnedByPage && !listingSoldOut(product) && !formInView && !atEnd;
  // Before the early return, so `--sf-buybar-h` is reset whenever the bar hides.
  useBuybarHeight(ref, show);
  if (!show) return null;

  const go = () => {
    const form = document.querySelector<HTMLElement>(ORDER_FORM_SELECTOR);
    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (onProductPage) window.scrollTo({ top: 0, behavior: "smooth" });
    else router.push(storeHref(base, `/products/${product.slug}`));
  };

  return (
    <div ref={ref} className="sfb-orderbar" style={bar}>
      <div style={{ minWidth: 0 }}>
        <div style={title}>{product.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          {product.productType === "variable" ? (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{t.fromPrice}</span>
          ) : null}
          <span style={{ fontSize: 16, fontWeight: 700 }}>{money(product.price, currency)}</span>
        </div>
      </div>
      <button type="button" onClick={go} style={cta}>
        {buttonLabel || t.buyNow}
      </button>
    </div>
  );
}

const bar: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: "calc(var(--sf-bottom-nav-h, 0px) + var(--sf-ownerbar-h, 0px))",
  zIndex: 44,
  background: "var(--card)",
  color: "var(--text)",
  borderTop: "1px solid var(--border)",
  paddingTop: 10,
  paddingInline: "var(--pad)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  textAlign: "left",
  boxShadow: "0 -8px 24px -16px rgba(0,0,0,0.3)",
};

const title: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cta: CSSProperties = {
  ...brandButton({ radius: 9, padding: "13px 24px", fontSize: 14 }),
  flex: "none",
  border: "none",
  fontFamily: "inherit",
  fontWeight: 700,
  cursor: "pointer",
};
