// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/api/query-keys";
import { useAuthStore } from "@/services/stores/use-auth-store";

import { supportSessionsApi } from "./api";

/**
 * Every support session this workspace has ever had, newest first.
 *
 * Polls while one is live. Not decoration: the banner has to disappear when the
 * operator leaves or the session times out, and without a poll a merchant who
 * left the tab open would keep being told they are being watched when they are
 * not — which is worse than not showing a banner at all.
 */
export function useSupportSessions() {
  return useQuery({
    queryKey: queryKeys.supportSessions.list(),
    queryFn: () => supportSessionsApi.list(),
    select: (data) => data.data ?? [],
    refetchInterval: (query) => {
      const rows = query.state.data?.data ?? [];
      return rows.some((s) => s.status === "active") ? 30_000 : false;
    },
  });
}

/** The merchant cutting an operator off. */
export function useEndSupportSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supportSessionsApi.end(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.supportSessions.all() }),
  });
}

/**
 * The operator closing their own session.
 *
 * Clears the local session too — the token is dead the moment the request
 * returns, so leaving the app "logged in" would just produce a wall of 401s.
 */
export function useEndOwnSupportSession() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  return useMutation({
    mutationFn: () => supportSessionsApi.endOwn(),
    onSuccess: () => clearAuth(),
  });
}
