"use client";
// coding-standard: maintained

import type { ShopperProfile, StoreTemplates } from "@/lib/storefront-client";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { useAccountArea } from "@/components/storefront/account/use-account-area";
import { SidebarAccount } from "@/components/storefront/account/layouts/sidebar-account";
import { TabsAccount } from "@/components/storefront/account/layouts/tabs-account";
import { PanelAccount } from "@/components/storefront/account/layouts/panel-account";
import { EditorialAccount } from "@/components/storefront/account/layouts/editorial-account";

/**
 * The signed-in account area — **one of four whole layouts**, picked by
 * `templates.accountLayout`.
 *
 * This is the storefront's first per-layout PAGE rather than a per-layout
 * component, and the split it is built on is the important part:
 *
 * - **`useAccountArea` owns everything the area does** — the session refresh,
 *   the `?tab=&order=` deep link, logout-and-evict, scroll-into-view. One
 *   implementation, four consumers.
 * - **The layouts own only how it looks.** They may differ as much as they like,
 *   including in how many screens they have (`panel` drills in; the others do
 *   not), because none of them can get the behaviour wrong on their own.
 *
 * Keyed on a **layout id, never a theme id.** A theme stamps `accountLayout`
 * into the merchant's settings like any other template value, so the storefront
 * still renders purely from settings: the live preview works, the Customize
 * picker works, and a merchant can keep Muslin's shop with Classic's account
 * area if they want. Reading `appliedThemeId` here would break all three.
 */
export function AccountArea({
  shopper,
  layout: chosen,
}: {
  shopper: ShopperProfile;
  /**
   * The `account-area` core section's own choice, once this page is on the
   * builder — a raw `templates.accountLayout` id, so it resolves with the
   * store's own templates rather than beside them.
   */
  layout?: string;
}) {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const api = useAccountArea(shopper);

  const layout = useStoreTemplate(store, "accountLayout", chosen);
  const Layout = ACCOUNT_LAYOUTS[layout] ?? SidebarAccount;

  return <Layout api={api} shopper={shopper} />;
}

const ACCOUNT_LAYOUTS: Record<
  StoreTemplates["accountLayout"],
  typeof SidebarAccount
> = {
  sidebar: SidebarAccount,
  tabs: TabsAccount,
  panel: PanelAccount,
  editorial: EditorialAccount,
};
