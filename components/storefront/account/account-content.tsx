"use client";
// coding-standard: maintained

import type { ShopperProfile } from "@/lib/storefront-client";
import { ProfileSection } from "@/components/storefront/account/profile-section";
import { OrdersSection } from "@/components/storefront/account/orders-section";
import { TrackingSection } from "@/components/storefront/account/tracking-section";
import { WishlistSection } from "@/components/storefront/account/wishlist-section";
import { AddressesSection } from "@/components/storefront/account/addresses-section";
import { PrefsSection } from "@/components/storefront/account/prefs-section";
import type { AccountAreaApi } from "@/components/storefront/account/use-account-area";

/**
 * Which section is on screen. Shared by every account layout on purpose.
 *
 * The layouts differ in the **shell** — where identity sits, whether the nav is
 * a column, a tab bar or a drilled-into menu. What a shopper's addresses or
 * notification switches look like is the same job in every shop, so the sections
 * stay one implementation. Adding a section means adding it here once.
 */
export function AccountContent({
  api,
  shopper,
}: {
  api: AccountAreaApi;
  shopper: ShopperProfile;
}) {
  const { tab, trackedOrder, setTab } = api;
  return (
    <>
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
    </>
  );
}
