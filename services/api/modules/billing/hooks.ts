import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/services/api/query-keys";

import { billingApi } from "./api";

export const useBillingSubscription = () =>
  useQuery({
    queryKey: queryKeys.billing.subscription(),
    queryFn: () => billingApi.getSubscription(),
    staleTime: 60 * 1000,
  });
