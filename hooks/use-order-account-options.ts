// coding-standard: maintained
import {
  useAccountPaymentOptions,
  useGetStorefrontSettings,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { defaultAccountId } from "@/utils/default-account";

/**
 * The org's accounts as `{label,value}` options for the order money dialogs
 * (mark-paid, return refund, prepayment) — the ecommerce order screens,
 * gated by `storefront.orders.manage`, not `accounts.view`. Shared so the
 * same query isn't duplicated across the payment panel and the return
 * dialog.
 *
 * A thin wrapper over `useAccountPaymentOptions` (the same minimal,
 * multi-domain endpoint `seller-payment-section.tsx` and the sales Payment
 * Method field use) rather than its own query: this used to hit the full
 * `accounts.view`-gated list with a `fields=` projection, which trims what
 * comes back but not what permission is required to ask for it — a role
 * with only `storefront.orders.manage` got an empty/erroring picker here for
 * exactly the reason a sell-only role did on the sales side.
 *
 * `defaultAccountId` is the account a dialog starts on. For an order (pass its
 * `paymentMethod`) that is the account the store maps that method to
 * (Store Settings → Payments) — the same one the server would use when no
 * account is sent — else the org's default account. If the mapping cannot be
 * read (the settings need `storefront.view`), it stays empty, so the server
 * still applies the mapping rather than the org default overriding it.
 */
export function useOrderAccountOptions(paymentMethod?: string) {
  const accountsEnabled = useAuthStore(
    (s) => s.user?.organization?.features?.accounts,
  );

  const { data } = useAccountPaymentOptions(!!accountsEnabled);
  const settings = useGetStorefrontSettings(
    !!accountsEnabled && !!paymentMethod,
  );
  const mapped = paymentMethod
    ? (
        settings.data?.paymentAccountMap as Record<string, string> | undefined
      )?.[paymentMethod]
    : undefined;
  const mappingUnknown = !!paymentMethod && !settings.isSuccess;

  return {
    accountsEnabled: !!accountsEnabled,
    options: (data ?? []).map((a) => ({ label: a.name, value: a._id })),
    defaultAccountId: mapped
      ? String(mapped)
      : mappingUnknown
      ? ""
      : defaultAccountId(data),
  };
}
