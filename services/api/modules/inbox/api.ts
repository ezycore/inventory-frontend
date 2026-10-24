// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  InboxAiCredit,
  InboxConnection,
  InboxConversation,
  InboxMessage,
  InboxOAuthPages,
  InboxOAuthStart,
  InboxSummary,
  InboxThread,
} from "@/types/api";

export type {
  InboxAiCredit,
  InboxConnection,
  InboxConversation,
  InboxMessage,
  InboxOAuthPages,
  InboxOAuthStart,
  InboxSummary,
  InboxThread,
};

export interface InboxConversationListParams {
  search?: string;
  /** `"true"` = only chats with unread customer messages. */
  unread?: "true";
  page?: number;
  limit?: number;
}

/**
 * Body of `PUT /api/inbox/connection` — what the merchant pastes from their Meta app.
 * Both secrets are required on the first connect; leaving one out later keeps the stored one.
 */
export interface SaveInboxConnectionInput {
  pageId: string;
  pageAccessToken?: string;
  appSecret?: string;
  holdingMessage?: string;
}

/** Body of `PUT /api/inbox/ai-settings`. Omitted = unchanged. */
export interface SaveInboxAiSettingsInput {
  aiEnabled?: boolean;
  holdingMessage?: string;
  handoverIdleMinutes?: number;
}

const base = "/inbox";

/** `apiClient.get` takes a URL only, so every list builds its own query string. */
const queryString = (params: Record<string, string | number | undefined>) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.append(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
};

/** Inbox — Facebook Messenger chats (backend `docs/features/inbox.md`). */
export const inboxApi = {
  getConnection: (): Promise<ApiResponse<InboxConnection>> => apiClient.get(`${base}/connection`),

  saveConnection: (data: SaveInboxConnectionInput): Promise<ApiResponse<InboxConnection>> =>
    apiClient.put(`${base}/connection`, data),

  testConnection: (): Promise<ApiResponse<InboxConnection>> =>
    apiClient.post(`${base}/connection/test`, {}),

  disconnect: (): Promise<ApiResponse<InboxConnection>> => apiClient.delete(`${base}/connection`),

  saveAiSettings: (data: SaveInboxAiSettingsInput): Promise<ApiResponse<InboxConnection>> =>
    apiClient.put(`${base}/ai-settings`, data),

  /** The AI-credit balance, ≈ replies left, the price and the terms. */
  getAiCredit: (): Promise<ApiResponse<InboxAiCredit>> => apiClient.get(`${base}/ai-credit`),

  /** Take over (`staff`) or Give back to AI (`ai`). */
  setOwner: (id: string, owner: "ai" | "staff"): Promise<ApiResponse<InboxConversation>> =>
    apiClient.post(`${base}/conversations/${id}/owner`, { owner }),

  /** "Connect with Facebook": where to send the browser (Facebook Login for Business). */
  startOAuth: (): Promise<ApiResponse<InboxOAuthStart>> => apiClient.post(`${base}/oauth/start`, {}),

  /** The Pages a finished sign-in can connect. `grant` is the opaque blob from the URL fragment. */
  getOAuthPages: (grant: string): Promise<ApiResponse<InboxOAuthPages>> =>
    apiClient.post(`${base}/oauth/pages`, { grant }),

  connectOAuthPage: (grant: string, pageId: string): Promise<ApiResponse<InboxConnection>> =>
    apiClient.post(`${base}/oauth/connect`, { grant, pageId }),

  summary: (): Promise<ApiResponse<InboxSummary>> => apiClient.get(`${base}/summary`),

  getConversations: (
    params: InboxConversationListParams = {},
  ): Promise<ApiResponse<PaginatedResponse<InboxConversation>>> =>
    apiClient.get(`${base}/conversations${queryString({ ...params })}`),

  /** Opening a thread marks it read on the server. `before` pages back through older messages. */
  getThread: (id: string, before?: string): Promise<ApiResponse<InboxThread>> =>
    apiClient.get(`${base}/conversations/${id}${queryString({ before })}`),

  reply: (id: string, text: string): Promise<ApiResponse<InboxMessage>> =>
    apiClient.post(`${base}/conversations/${id}/reply`, { text }),
};
