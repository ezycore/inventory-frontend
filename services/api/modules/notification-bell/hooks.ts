// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { queryKeys } from "@/services/api/query-keys";
import type { ApiResponse } from "@/types";
import { notificationBellApi, type MerchantAlertBell } from "./api";

/** How often the bell asks for new alerts (plan D5) — also in a background tab, for the pop-up. */
export const BELL_POLL_MS = 30_000;

export function useNotificationBell() {
  return useQuery({
    queryKey: queryKeys.notificationBell.all(),
    queryFn: () => notificationBellApi.get(),
    select: (res) => res.data,
    refetchInterval: BELL_POLL_MS,
    refetchIntervalInBackground: true,
  });
}

/** Both mark-read calls answer with the whole bell, so the cache takes it as-is. */
function useBellMutation<TVars>(mutationFn: (vars: TVars) => Promise<ApiResponse<MerchantAlertBell>>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => queryClient.setQueryData(queryKeys.notificationBell.all(), result),
    onError: handleMutationError,
  });
}

export const useMarkAlertRead = () => useBellMutation((id: string) => notificationBellApi.markRead(id));

export const useMarkAllAlertsRead = () => useBellMutation(() => notificationBellApi.markAllRead());
