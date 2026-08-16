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
import type { IconName } from "@/components/storefront/sf-icons";

type AccountTab =
  | "profile"
  | "orders"
  | "tracking"
  | "wishlist"
  | "addresses"
  | "prefs";

type Dict = ReturnType<typeof useStorefrontUI>["t"];

interface AccountNavItem {
  key: AccountTab;
  icon: IconName;
  label: keyof Dict;
  desc: keyof Dict;
}

/** The sections, in the order every layout lists them. */
export const ACCOUNT_TABS: AccountNavItem[] = [
  { key: "profile", icon: "user", label: "tabProfile", desc: "navProfileDesc" },
  { key: "orders", icon: "box", label: "tabOrders", desc: "navOrdersDesc" },
  { key: "wishlist", icon: "heart", label: "tabWishlist", desc: "navWishDesc" },
  { key: "addresses", icon: "mapPin", label: "tabAddresses", desc: "navAddrDesc" },
  { key: "prefs", icon: "bell", label: "tabPrefs", desc: "navPrefsDesc" },
];

/**
 * Everything the account area DOES, with nothing about how it looks.
 *
 * **This is the split that makes per-theme account layouts affordable.** Four
 * layouts render four different account areas, but they all call this one hook,
 * so the session refresh, the `?tab=&order=` deep link, the logout-and-evict and
 * the scroll-into-view live in exactly one place. A bug in any of them is fixed
 * once, not four times — which is the failure mode a theme engine invites and
 * the reason the logic was pulled out before the layouts were written.
 *
 * Layouts own: the shell, the nav's shape, where identity and logout sit.
 * They own nothing about state.
 */
export function useAccountArea(shopper: ShopperProfile) {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const token = useShopperStore((s) => s.token);
  const setShopper = useShopperStore((s) => s.setShopper);
  // Clears the session AND evicts this shopper's cached orders — see useShopperLogout.
  const logout = useShopperLogout(slug);

  const [tab, setTabState] = useState<AccountTab>("profile");
  const [trackedOrder, setTrackedOrder] = useState<string | null>(null);
  const [deepLinked, setDeepLinked] = useState(false);
  const tabsRef = useRef<HTMLElement>(null);

  // Adopt the URL's ?tab=&order= once on mount (client-only page state).
  //
  // `deepLinked` is recorded here rather than read from `location` by whoever
  // needs it: the drill-in layout has to know whether the shopper arrived on a
  // section link or on the menu, and reading `window` during ITS render would
  // make the server and client HTML disagree. Set in an effect, so the first
  // client render still matches the server's.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const urlTab = q.get("tab") as AccountTab | null;
    const order = q.get("order");
    if (urlTab && ACCOUNT_TABS.some((x) => x.key === urlTab)) {
      setTabState(urlTab);
      setDeepLinked(true);
    }
    if (order) {
      setTrackedOrder(order);
      setTabState("tracking");
      setDeepLinked(true);
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

  // Tracking is a sub-view of Orders, so the nav highlights Orders while it is open.
  const activeKey = tab === "tracking" ? "orders" : tab;

  const memberYear = shopper.createdAt
    ? new Date(shopper.createdAt).getFullYear()
    : new Date().getFullYear();

  // Keep the active chip in view in a horizontal nav — a deep link (?tab=prefs)
  // can land on a section that starts scrolled off the right. The overflow check
  // makes this a no-op wherever the nav is a column and never scrolls, so every
  // layout can attach `tabsRef` regardless of its own orientation.
  useEffect(() => {
    const nav = tabsRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const chip = nav.querySelector<HTMLElement>(`[data-tab="${activeKey}"]`);
    if (!chip) return;
    const left = chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollTo({ left: Math.max(0, left), behavior: reduced ? "auto" : "smooth" });
  }, [activeKey]);

  const signOut = () => {
    logout();
    toast.success(t.logout);
  };

  return {
    t,
    tab,
    setTab,
    activeKey,
    trackedOrder,
    /** True when the shopper landed via `?tab=`/`?order=` rather than on the menu. */
    deepLinked,
    tabsRef,
    memberYear,
    signOut,
    initial: (shopper.name || "A").trim().charAt(0).toUpperCase(),
  };
}

export type AccountAreaApi = ReturnType<typeof useAccountArea>;
