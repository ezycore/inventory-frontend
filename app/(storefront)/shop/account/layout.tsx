// coding-standard: maintained
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore } from "@/lib/storefront-server";
import { storePages } from "@/lib/storefront-page-controls";

/**
 * The account area, which the merchant may switch off (§6 page controls).
 *
 * A layout rather than a check per page: the area is seven routes deep — the
 * hub, the order list, an order, its invoice, the OAuth landing, verify-email
 * and reset-password — and a page added later must not be able to forget the
 * switch. Every one of them is already request-scoped (they read a shopper
 * session), so nothing cacheable is made dynamic by resolving the store here.
 *
 * A real 404, not a redirect: with accounts off this store has no account area,
 * and the backend answers the matching routes the same way
 * (`requireStoreAccounts`). Order tracking is NOT here — `/t/:token` and
 * `/orders/track` keep working, because links already sent by SMS must.
 */
export default async function AccountAreaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { slug } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;
  // No store on this host is the shop layout's business, not ours — it renders
  // its own bare state. Only an explicit "accounts off" 404s here.
  if (store && !storePages(store).accounts) notFound();
  return <>{children}</>;
}
