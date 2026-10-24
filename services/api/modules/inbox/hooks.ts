// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import {
  inboxApi,
  type InboxConversationListParams,
  type SaveInboxAiSettingsInput,
  type SaveInboxConnectionInput,
} from "./api";

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

/** AI credit for Inbox → Settings. Refreshed by any inbox change (its key sits under the root). */
export function useInboxAiCredit(enabled = true) {
  return useQuery({
    queryKey: queryKeys.inbox.aiCredit(),
    queryFn: () => inboxApi.getAiCredit(),
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

/**
 * Send the browser to Facebook. No success toast and no invalidation: the page is about to
 * be left, and the round trip ends back on Inbox settings with the result in the URL fragment.
 */
export function useStartInboxOAuth() {
  return useMutation({
    mutationFn: () => inboxApi.startOAuth(),
    onSuccess: (result) => window.location.assign(result.data.url),
    onError: handleMutationError,
  });
}

/**
 * The Page picker after a Facebook sign-in. A POST (the grant must not sit in a URL), read as a
 * query so a re-render does not ask Facebook again. No retry: an expired grant stays expired.
 */
export function useInboxOAuthPages(grant: string | null) {
  return useQuery({
    queryKey: queryKeys.inbox.oauthPages(grant ?? ""),
    queryFn: () => inboxApi.getOAuthPages(grant!),
    select: (data) => data.data.pages,
    enabled: Boolean(grant),
    retry: false,
    staleTime: Infinity,
  });
}

export function useConnectInboxOAuthPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ grant, pageId }: { grant: string; pageId: string }) => inboxApi.connectOAuthPage(grant, pageId),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Facebook Page connected");
      invalidate(qc, "inbox.connectionChanged");
    },
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

export function useSaveInboxAiSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveInboxAiSettingsInput) => inboxApi.saveAiSettings(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "AI settings saved");
      invalidate(qc, "inbox.connectionChanged");
    },
    onError: handleMutationError,
  });
}

/** Take over / Give back to AI. The banner changing in the thread is the confirmation. */
export function useSetInboxOwner(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (owner: "ai" | "staff") => inboxApi.setOwner(conversationId, owner),
    onSuccess: () => invalidate(qc, "inbox.replied"),
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
