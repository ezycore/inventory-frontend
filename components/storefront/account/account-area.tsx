"use client";
// coding-standard: maintained

import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/storefront-toast";
import type { ShopperProfile } from "@/lib/storefront-client";
import { storefrontApi } from "@/lib/storefront-client";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useShopperLogout } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { ProfileSection } from "@/components/storefront/account/profile-section";
import { VerifyEmailBanner } from "@/components/storefront/account/verify-email-banner";
import { OrdersSection } from "@/components/storefront/account/orders-section";
import { TrackingSection } from "@/components/storefront/account/tracking-section";
import { WishlistSection } from "@/components/storefront/account/wishlist-section";
import { AddressesSection } from "@/components/storefront/account/addresses-section";
import { PrefsSection } from "@/components/storefront/account/prefs-section";

export type AccountTab =
  | "profile"
  | "orders"
  | "tracking"
  | "wishlist"
  | "addresses"
  | "prefs";

const TABS: { key: AccountTab; icon: IconName; label: keyof Dict; desc: keyof Dict }[] = [
  { key: "profile", icon: "user", label: "tabProfile", desc: "navProfileDesc" },
  { key: "orders", icon: "box", label: "tabOrders", desc: "navOrdersDesc" },
  { key: "wishlist", icon: "heart", label: "tabWishlist", desc: "navWishDesc" },
  { key: "addresses", icon: "mapPin", label: "tabAddresses", desc: "navAddrDesc" },
  { key: "prefs", icon: "bell", label: "tabPrefs", desc: "navPrefsDesc" },
];

type Dict = ReturnType<typeof useStorefrontUI>["t"];

/**
 * Signed-in account area — persistent sidebar (identity, section nav, logout)
 * plus one switchable content section, per the Rashid's Mart account design.
 * Tab + tracked order live in the URL query (?tab=&order=) so deep links from
 * checkout ("Track this order") land directly on the tracking sub-view.
 */
export function AccountArea({ shopper }: { shopper: ShopperProfile }) {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const token = useShopperStore((s) => s.token);
  const setShopper = useShopperStore((s) => s.setShopper);
  // Clears the session AND evicts this shopper's cached orders — see useShopperLogout.
  const logout = useShopperLogout(slug);

  const [tab, setTabState] = useState<AccountTab>("profile");
  const [trackedOrder, setTrackedOrder] = useState<string | null>(null);
  const tabsRef = useRef<HTMLElement>(null);

  // Adopt the URL's ?tab=&order= once on mount (client-only page state).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const urlTab = q.get("tab") as AccountTab | null;
    if (urlTab && TABS.some((x) => x.key === urlTab)) setTabState(urlTab);
    const order = q.get("order");
    if (order) {
      setTrackedOrder(order);
      setTabState("tracking");
    }
  }, []);

  // Refresh the persisted profile once — older sessions predate the account
  // fields (gender/dob/prefs/addresses/createdAt).
  useEffect(() => {
    if (!token) return;
    storefrontApi
      .me(slug, token)
      .then(setShopper)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);

  const setTab = (next: AccountTab, order?: string | null) => {
    setTabState(next);
    setTrackedOrder(order ?? null);
    const q = new URLSearchParams();
    q.set("tab", next === "tracking" ? "tracking" : next);
    if (next === "tracking" && order) q.set("order", order);
    window.history.replaceState(null, "", `?${q.toString()}`);
    window.scrollTo(0, 0);
  };

  const activeKey = tab === "tracking" ? "orders" : tab;
  const memberYear = shopper.createdAt
    ? new Date(shopper.createdAt).getFullYear()
    : new Date().getFullYear();

  // Keep the active chip in view in the mobile strip — a deep link (?tab=prefs)
  // can land on a section that starts scrolled off the right. The overflow check
  // makes this a no-op on desktop, where the nav is a column and never scrolls.
  useEffect(() => {
    const nav = tabsRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const chip = nav.querySelector<HTMLElement>(`[data-tab="${activeKey}"]`);
    if (!chip) return;
    const left = chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollTo({ left: Math.max(0, left), behavior: reduced ? "auto" : "smooth" });
  }, [activeKey]);

  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", width: "100%", padding: "22px var(--pad) 40px" }}>
      <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
        {t.myAccount}
      </h1>
      {!shopper.emailVerified ? <VerifyEmailBanner /> : null}
      <div style={{ display: "grid", gridTemplateColumns: "var(--acctgrid)", gap: "var(--gap)", alignItems: "start" }}>
        {/* ===== Section nav =====
            Layout lives in storefront.css (.sf-account-nav / .sf-acct-*): a
            sticky 260px sidebar on desktop, a compact identity row plus a
            scrolling section strip below 680px, where --acctgrid collapses and
            this stacks above the content. Grid areas move the logout button
            between the two positions, so there is only one copy of the nav. */}
        <aside className="sf-account-nav">
          <div className="sf-acct-identity">
            <div className="sf-acct-avatar">
              {(shopper.name || "A").trim().charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="sf-acct-name">{shopper.name}</div>
              <div className="sf-acct-since">
                {t.memberSince} {memberYear}
              </div>
            </div>
          </div>

          <nav ref={tabsRef} className="sf-acct-tabs" aria-label={t.myAccount}>
            {TABS.map((item) => {
              const on = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  data-tab={item.key}
                  aria-current={on ? "page" : undefined}
                  onClick={() => setTab(item.key)}
                  className={`sf-acct-tab${on ? " is-on" : ""}`}
                >
                  <span className="sf-acct-tab-icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="sf-acct-tab-label">{t[item.label] as string}</span>
                    <span className="sf-acct-tab-desc">{t[item.desc] as string}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="sf-acct-logout">
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success(t.logout);
              }}
              className="sf-acct-logout-btn"
            >
              <span style={{ display: "flex", flex: "none" }}>
                <Icon name="logOut" size={16} />
              </span>
              {t.logout}
            </button>
          </div>
        </aside>

        {/* ===== Content ===== */}
        <div style={{ minWidth: 0 }}>
          {tab === "profile" ? <ProfileSection shopper={shopper} /> : null}
          {tab === "orders" ? (
            <OrdersSection onTrack={(orderNumber) => setTab("tracking", orderNumber)} />
          ) : null}
          {tab === "tracking" && trackedOrder ? (
            <TrackingSection orderNumber={trackedOrder} onBack={() => setTab("orders")} />
          ) : null}
          {tab === "wishlist" ? <WishlistSection /> : null}
          {tab === "addresses" ? <AddressesSection shopper={shopper} /> : null}
          {tab === "prefs" ? <PrefsSection shopper={shopper} /> : null}
        </div>
      </div>
    </div>
  );
}
