"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import type {
  StoreFooterPaymentMethods,
  StoreFooterStyle,
  StorefrontStore,
} from "@/lib/storefront-client";
import { footerBottomAlign, footerFrame } from "@/lib/storefront-footer/style";
import type { FooterBottomAlign } from "@/lib/storefront-footer/types";
import { stripVisibilityClass } from "@/lib/storefront-strip-display";
import { storefrontPaymentMethodLabel } from "@/lib/storefront-payment-methods";
import type { FooterT } from "@/components/storefront/footer/footer-model";

export function PaymentBadges({
  store,
  t,
  compact,
  className,
}: {
  store?: StorefrontStore;
  t: FooterT;
  /** Bottom-bar sizing — the badges sit beside 12px text there, not on their own. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={className} style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
      {(store?.allowedPaymentMethods ?? ["cod", "bank"]).map((m) => (
        <span
          key={m}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontSize: compact ? 11 : 11.5,
            fontWeight: 600,
            padding: compact ? "4px 9px" : "6px 10px",
            borderRadius: 7,
          }}
        >
          {storefrontPaymentMethodLabel(m, t, store?.paymentMethods)}
        </span>
      ))}
    </div>
  );
}

/**
 * The footer element and its centred measure.
 *
 * The merchant's frame (`nav.footerStyle`) arrives as `data-*` switches and
 * custom properties — see `footerFrame`. A dark, brand or custom ground re-points
 * the theme's own ink tokens (`--text`, `--muted`, `--border`…) inside the
 * footer, so every layout and block below is recoloured without knowing it.
 * `pad` is the layout's own padding, which `regular` spacing keeps.
 */
export function FooterShell({
  children,
  footerStyle,
  pad = { top: 36, bottom: 28 },
}: {
  children: ReactNode;
  footerStyle?: StoreFooterStyle;
  pad?: { top: number; bottom: number };
}) {
  const frame = footerFrame(footerStyle, pad);
  return (
    <footer className="sf-footer" style={frame.style} {...frame.attrs}>
      <div className="sf-footer-in">{children}</div>
    </footer>
  );
}

/**
 * The closing line: copyright, the platform credit, the accepted payment
 * methods, and the merchant's own note.
 *
 * **Payments live here, not in a link column.** They are a reassurance, not
 * navigation — and putting them in the columns region is what forced the extra
 * track that left the gap `FooterColumns` describes.
 *
 * The right-hand side is `copy.footerNote`. It used to be the hardcoded string
 * `"Bangladesh · <currency>"`, which is a claim about the merchant's business
 * that the platform has no standing to make; unset, it now prints the store's
 * currency and nothing more.
 *
 * The credit is the merchant's to hide (`footerStyle.showPoweredBy`, owner
 * decision 2026-09-25) and shown until they do.
 */
export function BottomBar({
  name,
  currency,
  note,
  store,
  t,
  footerPaymentMethods,
  footerStyle,
  center,
}: {
  name: string;
  currency?: string;
  note?: string;
  store?: StorefrontStore;
  t: FooterT;
  footerPaymentMethods?: StoreFooterPaymentMethods;
  footerStyle?: StoreFooterStyle;
  /** The layout's own arrangement — centred layouts stack this instead of spreading it. */
  center?: boolean;
}) {
  const layoutAlign: FooterBottomAlign = center ? "center" : "spread";
  const align = footerBottomAlign(footerStyle, layoutAlign);
  const showCredit = footerStyle?.showPoweredBy !== false;
  return (
    <div className="sf-footer-bottom" data-align={align.desktop} data-align-m={align.phone}>
      <span>
        © {new Date().getFullYear()} {name}
        {showCredit ? (
          <>
            {" "}· {t.poweredBy}{" "}
            {/* ⚠ **A new tab, deliberately.** This is the one link in the shop that
                leads away from the merchant's own storefront, and a shopper who
                follows it in the same tab is a sale they have lost to our marketing
                site. `rel="noopener"` and nothing more: the referrer is how the
                visit is attributed, and this is our own domain, not a third
                party's. */}
            <a
              href="https://ezycore.com/"
              target="_blank"
              rel="noopener"
              className="sf-powered-link"
            >
              EzyCore
            </a>
          </>
        ) : null}
      </span>
      <PaymentBadges
        store={store}
        t={t}
        compact
        className={stripVisibilityClass(
          footerPaymentMethods?.showOnDesktop,
          footerPaymentMethods?.showOnMobile,
        )}
      />
      <span>{note?.trim() || currency || ""}</span>
    </div>
  );
}
