// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { MerchantAlert, MerchantAlertBell } from "@/types/api";

export type { MerchantAlert, MerchantAlertBell };

const base = "/organization/notifications/bell";

/**
 * The top-bar bell (backend `docs/plan/notification-bell.md`). Every signed-in user has one; the
 * backend shows each only the alerts their permissions cover, with their own read state. Both
 * mark-read calls answer with the fresh bell.
 */
export const notificationBellApi = {
  get: (): Promise<ApiResponse<MerchantAlertBell>> => apiClient.get(base),
  markRead: (id: string): Promise<ApiResponse<MerchantAlertBell>> => apiClient.post(`${base}/${id}/read`, {}),
  markAllRead: (): Promise<ApiResponse<MerchantAlertBell>> => apiClient.post(`${base}/read-all`, {}),
};
