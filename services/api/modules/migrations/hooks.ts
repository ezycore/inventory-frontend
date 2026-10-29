// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import type { MigrationRun } from "@/types/api";

import { migrationsApi, type StartWooMigrationInput } from "./api";

/** A run the backend worker is still moving. */
export const isMigrationActive = (run: Pick<MigrationRun, "status"> | undefined) =>
  run?.status === "queued" || run?.status === "processing";

/** The workspace's migrations, newest first. */
/** `enabled: false` for a user who may not move a shop — the list is `products.import`-gated and would 403. */
export function useMigrations({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.migrations.list(),
    queryFn: () => migrationsApi.list(),
    select: (data) => data.data ?? [],
    enabled,
  });
}

/**
 * One migration, polled every 3 s while the worker is moving it. The work
 * happens in the background, so this poll is the only way the screen learns a
 * preview is ready or an import has finished.
 */
export function useMigration(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.migrations.detail(id ?? ""),
    queryFn: () => migrationsApi.get(id as string),
    enabled: Boolean(id),
    select: (data) => data.data,
    refetchInterval: (query) => (isMigrationActive(query.state.data?.data) ? 3_000 : false),
  });
}

export function useStartWooMigration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartWooMigrationInput) => migrationsApi.startWooCommerce(input),
    onSuccess: () => invalidate(qc, "migration.changed"),
  });
}

export function useCommitMigration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => migrationsApi.commit(id),
    onSuccess: () => invalidate(qc, "migration.changed"),
  });
}

export function useCancelMigration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => migrationsApi.cancel(id),
    onSuccess: () => invalidate(qc, "migration.changed"),
  });
}

/** A customer's orders from the old store. Empty for a workspace that never migrated. */
export function useLegacyOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.migrations.legacyOrders(customerId ?? ""),
    queryFn: () => migrationsApi.legacyOrders(customerId as string),
    enabled: Boolean(customerId),
    select: (data) => data.data ?? [],
  });
}
