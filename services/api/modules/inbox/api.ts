// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  InboxAiCredit,
  InboxAiCreditDay,
  InboxAiCreditHistory,
  InboxAiFlagRow,
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
  InboxAiCreditDay,
  InboxAiCreditHistory,
  InboxAiFlagRow,
  InboxConnection,
  InboxConversation,
  InboxMessage,
  InboxOAuthPages,
  InboxOAuthStart,
  InboxSummary,
  InboxThread,
};

/** Why an AI reply was flagged — mirrors the backend's `INBOX_AI_FLAG_REASONS`. */
export const INBOX_AI_FLAG_REASONS = ["wrong_info", "wrong_language", "tone", "missed_handover", "other"] as const;
export type InboxAiFlagReason = (typeof INBOX_AI_FLAG_REASONS)[number];

/** Body of `POST /api/inbox/conversations/:id/messages/:messageId/flag`. "Other" needs a note. */
export interface FlagInboxReplyInput {
  reason: InboxAiFlagReason;
  note?: string;
}

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
  /** Orders the AI takes are confirmed straight away (stock held) instead of waiting as pending. */
  autoConfirmOrders?: boolean;
  /** The merchant's own instructions to the AI, up to 2,000 characters. */
  aiInstructions?: string;
  /** AI-off windows on the shop's clock. */
  aiOffHours?: { days: number[]; start: string; end: string }[];
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

  /** AI spend per day on the shop's calendar over the last `days`, and the credit that came in. */
  getAiCreditHistory: (days: number): Promise<ApiResponse<InboxAiCreditHistory>> =>
    apiClient.get(`${base}/ai-credit/history${queryString({ days })}`),

  /** One shop-calendar day (`YYYY-MM-DD`): each chat's replies and cost, dearest first. */
  getAiCreditDay: (date: string): Promise<ApiResponse<InboxAiCreditDay>> =>
    apiClient.get(`${base}/ai-credit/history/${date}`),

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

  /** Flag (or re-flag) an AI reply as wrong — "flag this reply". */
  flagReply: (conversationId: string, messageId: string, data: FlagInboxReplyInput): Promise<ApiResponse<InboxMessage>> =>
    apiClient.post(`${base}/conversations/${conversationId}/messages/${messageId}/flag`, data),

  unflagReply: (conversationId: string, messageId: string): Promise<ApiResponse<InboxMessage>> =>
    apiClient.delete(`${base}/conversations/${conversationId}/messages/${messageId}/flag`),

  /** The flagged AI replies, newest flag first. */
  getAiFlags: (params: { page?: number; limit?: number } = {}): Promise<ApiResponse<PaginatedResponse<InboxAiFlagRow>>> =>
    apiClient.get(`${base}/ai-flags${queryString({ ...params })}`),

  reply: (id: string, text: string): Promise<ApiResponse<InboxMessage>> =>
    apiClient.post(`${base}/conversations/${id}/reply`, { text }),
};
