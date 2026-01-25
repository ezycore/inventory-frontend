import { queryKeys } from "@/lib//query-keys-products";
import { organizationApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const useGetOrganizationApi = () => {
  return useQuery({
    queryKey: queryKeys.organization.get(),
    queryFn: () => organizationApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
