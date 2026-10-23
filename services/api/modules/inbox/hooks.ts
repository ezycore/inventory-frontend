// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import { inboxApi, type InboxConversationListParams, type SaveInboxConnectionInput } from "./api";

/**
 * Inbox hooks — Facebook Messenger chats (backend `docs/features/inbox.md`).
 *
 * There is no push channel, so the open screens POLL (plan §12a): the list every 10 s, an
 * open thread every 5 s, the sidebar badge every 30 s. TanStack pauses an interval while
 * the tab is hidden (`refetchIntervalInBackground` is false by default), so a backgrounded
 * tab costs nothing.
 */
const LIST_POLL_MS = 10_000;
const THREAD_POLL_MS = 5_000;
const BADGE_POLL_MS = 30_000;

export function useInboxConnection(enabled = true) {
  return useQuery({
    queryKey: queryKeys.inbox.connection(),
    queryFn: () => inboxApi.getConnection(),
    select: (data) => data.data,
    enabled,
  });
}

/** Unread chats for the sidebar badge. Off unless the caller can read the inbox. */
export function useInboxSummary(enabled = true) {
  return useQuery({
    queryKey: queryKeys.inbox.summary(),
    queryFn: () => inboxApi.summary(),
    select: (data) => data.data,
    enabled,
    refetchInterval: BADGE_POLL_MS,
  });
}

export function useInboxConversations(params: InboxConversationListParams = {}) {
  return useQuery({
    queryKey: queryKeys.inbox.list(params as Record<string, unknown>),
    queryFn: () => inboxApi.getConversations(params),
    select: (data) => data.data,
    refetchInterval: LIST_POLL_MS,
  });
}

/**
 * One thread. The server marks it read on every fetch, so once it lands the list and the
 * badge are stale — they are refreshed from here rather than waiting for their own poll.
 */
export function useInboxThread(id: string | undefined) {
  const qc = useQueryClient();
  const key = queryKeys.inbox.detail(id ?? "");
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      // Only the first load can have reset an unread count; the 5 s polls after it must not
      // refetch the list every time they run.
      const firstLoad = qc.getQueryData(key) === undefined;
      const result = await inboxApi.getThread(id!);
      if (firstLoad) invalidate(qc, "inbox.threadRead");
      return result;
    },
    select: (data) => data.data,
    enabled: Boolean(id),
    refetchInterval: THREAD_POLL_MS,
  });
}

export function useSaveInboxConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveInboxConnectionInput) => inboxApi.saveConnection(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Facebook Page connected");
      invalidate(qc, "inbox.connectionChanged");
    },
    onError: handleMutationError,
  });
}

export function useTestInboxConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => inboxApi.testConnection(),
    onSuccess: () => invalidate(qc, "inbox.connectionChanged"),
    onError: handleMutationError,
  });
}

export function useDisconnectInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => inboxApi.disconnect(),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Facebook Page disconnected");
      invalidate(qc, "inbox.connectionChanged");
    },
    onError: handleMutationError,
  });
}

/** No success toast: the message appearing in the thread is the confirmation. */
export function useReplyInbox(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => inboxApi.reply(conversationId, text),
    onSuccess: () => invalidate(qc, "inbox.replied"),
    onError: handleMutationError,
  });
}
