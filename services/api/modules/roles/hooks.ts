import { queryKeys } from "@/services/api/query-keys";
import { useQuery } from "@tanstack/react-query";
import { rolesApi } from "./api";

export function useRoles(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.roles.all(),
    queryFn: () => rolesApi.getAll(),
    enabled: options?.enabled ?? true,
  });
}
