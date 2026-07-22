import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/api/query-keys";
import { domainsApi } from "./api";

export function useDomains() {
  return useQuery({
    queryKey: queryKeys.domains.list(),
    queryFn: () => domainsApi.list(),
    select: (data) => data.data?.domains ?? [],
  });
}

export function useAddDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) => domainsApi.add(domain),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.domains.all() }),
  });
}

export function useVerifyDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) => domainsApi.verify(domain),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.domains.all() }),
  });
}

export function useRemoveDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) => domainsApi.remove(domain),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.domains.all() }),
  });
}
