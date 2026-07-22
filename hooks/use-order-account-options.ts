// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import { queryKeys } from "@/services/api/query-keys";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * The org's accounts as `{label,value}` options for the order money dialogs
 * (mark-paid, return refund). Gated on the `accounts` feature; cached 5 min.
 * Shared so the same query isn't duplicated across the payment panel and the
 * return dialog.
 */
export function useOrderAccountOptions() {
  const accountsEnabled = useAuthStore(
    (s) => s.user?.organization?.features?.accounts,
  );

  const { data } = useQuery({
    queryKey: queryKeys.accounts.orderOptions(),
    queryFn: () =>
      apiClient.get<{ data: { items: { _id: string; name: string }[] } }>(
        selectOptions("accounts", { fields: "_id,name" }),
      ),
    enabled: !!accountsEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const accounts = data?.data?.items ?? [];
  return {
    accountsEnabled: !!accountsEnabled,
    options: accounts.map((a) => ({ label: a.name, value: a._id })),
  };
}
