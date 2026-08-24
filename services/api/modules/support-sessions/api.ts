// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

/**
 * Support sessions — when someone at EzyCore opens this workspace read-only, and
 * the merchant's ability to stop them (`mission-control/plan/support-session.md`).
 *
 * Verb endpoints rather than CRUD, so no generic resource helpers. Note there is
 * deliberately **no create** here: a session can only be opened from Mission
 * Control, never from inside the workspace.
 */

export interface SupportSession {
  _id: string;
  organizationId: string;
  /** Who at EzyCore. The merchant is shown a person, not an internal id. */
  mcUserEmail: string;
  /** Why — typed by the operator in Mission Control before the session existed. */
  reason: string;
  mode: "read";
  status: "active" | "ended" | "expired";
  endedBy?: "mc" | "merchant" | "expiry";
  startedAt: string;
  expiresAt: string;
  endedAt?: string;
  lastSeenAt?: string;
  requestCount: number;
}

export const supportSessionsApi = {
  list: (): Promise<ApiResponse<SupportSession[]>> =>
    apiClient.get("/support-sessions"),

  /** The merchant's kill switch. Takes effect on the operator's next request. */
  end: (id: string): Promise<ApiResponse<SupportSession>> =>
    apiClient.post(`/support-sessions/${id}/end`, {}),

  /** The operator closing their own session from inside the workspace. */
  endOwn: (): Promise<ApiResponse<null>> =>
    apiClient.post("/auth/support/end", {}),
};
