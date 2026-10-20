"use client";
// coding-standard: maintained

import Link from "next/link";
import { useEffect, useState } from "react";
import { PurchaseToastView } from "@/components/storefront/social-proof/purchase-toast-view";
import { storeHref } from "@/lib/storefront-links";
import { isPreviewSession } from "@/lib/storefront-preview";
import {
  storefrontApi,
  type StorefrontStore,
} from "@/lib/storefront-client";
import {
  timeAgoText,
  toastText,
  type RecentPurchase,
} from "@/lib/storefront-social-proof";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { useSocialLook } from "@/services/storefront/use-social-look";
import { useCartUI } from "@/services/stores/use-cart-ui-store";

/** Per-visit memory: how many toasts this tab has shown, and whether the shopper closed them. */
const SESSION_KEY = "ezy-sf-purchase-toast";

/**
 * Pages a popup would cost orders on — the shopper is already buying, or reading their own
 * account. Matched as path prefixes of the store-relative pathname.
 */
const QUIET_PATHS = ["/cart", "/checkout", "/account", "/orders", "/t/"];

const readSession = (): { shown: number; closed: boolean } => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "{}") as { shown?: number; closed?: boolean };
    return { shown: raw.shown ?? 0, closed: raw.closed === true };
  } catch {
    return { shown: 0, closed: false };
  }
};

const writeSession = (value: { shown: number; closed: boolean }) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
  } catch {
    // Storage blocked: the cap then holds for this page view only, which is the safe direction.
  }
};

/**
 * The recent-purchase popup (docs/plan/social-proof.md §4.4). Mounted once in the shell; renders
 * nothing unless the merchant switched it on and the feed has entries.
 *
 * One clock per visit: `firstDelay → show(stay) → gap → next`, stopping at `maxPerVisit`
 * (counted across pages in `sessionStorage`) or for good once the shopper closes one. It waits
 * while the tab is hidden and never runs on the cart, checkout or account pages.
 */
export function PurchaseToast({ slug, base, store }: { slug: string; base: string; store: StorefrontStore }) {
  const cfg = store.socialProof?.purchaseToast;
  const { lang, t } = useStorefrontUI();
  const look = useSocialLook();
  const pathname = useStorePathname();
  const cartOpen = useCartUI((s) => s.open);
  const [entries, setEntries] = useState<RecentPurchase[] | null>(null);
  const [current, setCurrent] = useState<RecentPurchase | null>(null);
  const [closed, setClosed] = useState(false);
  // The address carries the store's base — `/shop/checkout` on a subdomain, `/checkout` on a
  // custom domain — so it is stripped before matching, or every subdomain checkout got popups.
  const relative = base && pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
  const quiet = QUIET_PATHS.some((path) => relative.startsWith(path));
  // The store query hands back a NEW object on every refetch. Keyed on the object, the feed was
  // fetched again and the clock restarted mid-visit each time; keyed on its content, neither moves
  // until the merchant actually changes a setting.
  const cfgKey = cfg ? JSON.stringify(cfg) : "";

  useEffect(() => {
    if (!cfgKey) return;
    let alive = true;
    storefrontApi
      .recentPurchases(slug)
      .then((res) => alive && setEntries(res.entries))
      .catch(() => alive && setEntries([]));
    return () => {
      alive = false;
    };
  }, [cfgKey, slug]);

  useEffect(() => {
    // `closed` stops the clock, not just the drawing: a clock left running wrote `closed: false`
    // back on its next toast, so the shopper's close was forgotten by the next page.
    if (!cfgKey || !entries?.length || quiet || closed) return;
    const clock = JSON.parse(cfgKey) as NonNullable<typeof cfg>;
    const preview = isPreviewSession();
    const session = readSession();
    // The editor preview must show the toast within a moment of opening the part, and
    // repeatedly, or the merchant cannot see what they are styling.
    if (!preview && (session.closed || session.shown >= clock.maxPerVisit)) return;
    let index = session.shown % entries.length;
    let shown = session.shown;
    let timer = 0;
    const wait = (seconds: number, next: () => void) => {
      timer = window.setTimeout(next, seconds * 1000);
    };
    const show = () => {
      if (document.hidden) return wait(2, show);
      setCurrent(entries[index % entries.length]);
      index += 1;
      shown += 1;
      if (!preview) writeSession({ shown, closed: false });
      wait(clock.staySeconds, hide);
    };
    const hide = () => {
      setCurrent(null);
      if (!preview && shown >= clock.maxPerVisit) return;
      wait(preview ? 2 : clock.gapSeconds, show);
    };
    wait(preview ? Math.min(clock.firstDelaySeconds, 1) : clock.firstDelaySeconds, show);
    return () => {
      window.clearTimeout(timer);
      setCurrent(null);
    };
  }, [cfgKey, entries, quiet, closed]);

  if (!cfg || !current || closed || quiet || cartOpen) return null;

  const close = () => {
    setClosed(true);
    if (!isPreviewSession()) writeSession({ shown: readSession().shown, closed: true });
  };
  const timeText =
    current.minutesAgo != null ? timeAgoText(current.minutesAgo, lang) : current.timeLabel;
  const side = cfg.position === "bottom-right" ? "right" : "left";
  // Above the floating chat button when it shares this corner — two fixed boxes on one spot
  // read as a broken page. On a phone the toast spans the width, so it always clears it.
  const launcherBelow = !!store.contactButton?.channels?.length;

  return (
    <div
      className="sf-noprint"
      style={{
        position: "fixed",
        zIndex: 44,
        left: side === "left" ? 16 : undefined,
        right: side === "right" ? 16 : undefined,
        bottom: `calc(var(--sf-bottom-nav-h, 0px) + var(--sf-ownerbar-h, 0px) + var(--sf-buybar-h, 0px) + var(--sf-consent-h, 0px) + ${launcherBelow ? 82 : 16}px)`,
        animation: "sf-toast-in 220ms ease-out",
      }}
    >
      <style>{`@keyframes sf-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[data-purchase-toast]{animation:none!important}}`}</style>
      <PurchaseToastView
        look={look}
        text={toastText(current, cfg.template[lang] || cfg.template.en, lang)}
        timeText={timeText}
        imageUrl={current.imageUrl}
        closeLabel={t.dismiss}
        onClose={close}
        wrap={(body) => (
          <Link href={storeHref(base, `/products/${current.productSlug}`)} style={{ color: "inherit", textDecoration: "none" }}>
            {body}
          </Link>
        )}
      />
    </div>
  );
}
