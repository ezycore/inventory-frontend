import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { domainsApi } from "./api";

const DOMAINS_KEY = ["domains"] as const;

export function useDomains() {
  return useQuery({
    queryKey: DOMAINS_KEY,
    queryFn: () => domainsApi.list(),
    select: (data) => data.data?.domains ?? [],
  });
}

export function useAddDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) => domainsApi.add(domain),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOMAINS_KEY }),
  });
}

export function useVerifyDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) => domainsApi.verify(domain),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOMAINS_KEY }),
  });
}

export function useRemoveDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) => domainsApi.remove(domain),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOMAINS_KEY }),
  });
}
