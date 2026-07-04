"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ShopperProfile } from "@/lib/storefront-client";
import { storefrontApi } from "@/lib/storefront-client";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { ProfileSection } from "@/components/storefront/account/profile-section";
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
  const logout = useShopperStore((s) => s.logout);

  const [tab, setTabState] = useState<AccountTab>("profile");
  const [trackedOrder, setTrackedOrder] = useState<string | null>(null);

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

  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", width: "100%", padding: "22px var(--pad) 40px" }}>
      <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
        {t.myAccount}
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "var(--acctgrid)", gap: "var(--gap)", alignItems: "start" }}>
        {/* ===== Sidebar ===== */}
        <aside style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, position: "sticky", top: 88 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 6px 16px", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--primary)", color: "var(--on-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 700, flex: "none" }}>
              {(shopper.name || "A").trim().charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {shopper.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {t.memberSince} {memberYear}
              </div>
            </div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {TABS.map((item) => {
              const on = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: "none",
                    textAlign: "start",
                    fontFamily: "inherit",
                    background: on ? "var(--primary-soft)" : "transparent",
                    width: "100%",
                  }}
                >
                  <span style={{ display: "flex", flex: "none", color: on ? "var(--primary)" : "var(--muted)" }}>
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: on ? "var(--primary)" : "var(--text)" }}>
                      {t[item.label] as string}
                    </span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                      {t[item.desc] as string}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 12 }}>
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success(t.logout);
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", color: "var(--discount)", background: "transparent", border: "none", fontFamily: "inherit", width: "100%" }}
            >
              <span style={{ display: "flex" }}>
                <Icon name="logOut" size={16} />
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{t.logout}</span>
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
