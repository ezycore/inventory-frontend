// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { rolesApi, type RoleWriteInput } from "./api";

export function useRoles(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.roles.all(),
    queryFn: () => rolesApi.getAll(),
    enabled: options?.enabled ?? true,
  });
}

/**
 * The permission catalog. Plan-dependent but effectively static within a
 * session, so it is fetched only when the builder actually opens.
 */
export function usePermissionCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.roles.catalog(),
    queryFn: () => rolesApi.getCatalog(),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Holder count for one role. The delete dialog reads it live rather than
 * counting the users list, because a stale count here is the difference between
 * offering a one-click delete and a 409.
 */
export function useRoleUsage(slug: string | null) {
  return useQuery({
    queryKey: queryKeys.roles.usage(slug ?? ""),
    queryFn: () => rolesApi.getUsage(slug as string),
    enabled: !!slug,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RoleWriteInput) => rolesApi.create(data),
    onSuccess: () => invalidate(qc, "role.changed"),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: RoleWriteInput }) =>
      rolesApi.update(slug, data),
    onSuccess: () => invalidate(qc, "role.changed"),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, reassignTo }: { slug: string; reassignTo?: string }) =>
      rolesApi.remove(slug, reassignTo),
    onSuccess: () => invalidate(qc, "role.changed"),
  });
}
