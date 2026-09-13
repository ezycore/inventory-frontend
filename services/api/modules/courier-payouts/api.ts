// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  CourierMoneySummary,
  CourierPayout,
  CourierPayoutSync,
} from "@/types/api";

export type { CourierMoneySummary, CourierPayout, CourierPayoutSync };

/** One parcel inside a payout, derived from the parent so it cannot drift from it. */
export type CourierPayoutLine = CourierPayout["lines"][number];
/** What the courier kept, by kind. `delivery` and `paymentCharge` are never merged. */
export type CourierPayoutDeductions = CourierPayout["deductions"];

/** List filters. Everything is optional — the default view is every payout on file. */
export interface CourierPayoutListParams {
  provider?: string;
  status?: "pending" | "posted";
  /** `false` narrows to the payouts that did not add up — the ones worth opening. */
  reconciled?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Body of `POST /api/ecommerce/payouts` — a courier's statement as the courier states it.
 *
 * The figures are sent verbatim. The server re-derives the reconciliation against the clearing
 * accounts and refuses `gross − deductions ≠ net` with `PAYOUT_UNRECONCILED`, so a client that
 * "helpfully" substituted its own net would be filing a statement the courier never sent.
 */
export interface RecordCourierPayoutInput {
  provider?: "pathao" | "steadfast" | "ecourier";
  customCourierId?: string;
  statementRef: string;
  receivedAt?: string;
  gross: number;
  deductions?: Partial<CourierPayoutDeductions>;
  net: number;
  paymentMode?: string;
  lines?: {
    consignmentRef?: string;
    trackingCode?: string;
    orderNumber?: string;
    collected: number;
    legType?: "forward" | "return";
    deliveryFee?: number;
    codFee?: number;
    returnCharge?: number;
    otherCharge?: number;
    note?: string;
  }[];
  /** Where the net landed. Required when `post` is true — the transfer needs a destination. */
  accountId?: string;
  idempotencyKey?: string;
  /** Record and post in one request. The UI posts from its own dialog instead (D6). */
  post?: boolean;
}

const base = "/ecommerce/payouts";

/** `apiClient.get` takes a URL only, so every list builds its own query string. */
const queryString = (params: Record<string, string | number | boolean | undefined>) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    // `reconciled=false` is a real filter, so test for undefined rather than falsiness.
    if (value !== undefined && value !== "") qs.append(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
};

export const courierPayoutsApi = {
  getAll: (
    filters: CourierPayoutListParams = {},
  ): Promise<ApiResponse<PaginatedResponse<CourierPayout>>> =>
    apiClient.get(`${base}${queryString({ ...filters })}`),

  getById: (id: string): Promise<ApiResponse<CourierPayout>> =>
    apiClient.get(`${base}/${id}`),

  create: (
    data: RecordCourierPayoutInput,
  ): Promise<ApiResponse<CourierPayout>> => apiClient.post(base, data),

  /**
   * Book the statement into the ledger: net out of clearing into `accountId`, each deduction
   * expensed out of clearing. Together they are exactly gross, so a payout that reconciles
   * leaves the clearing account at zero.
   */
  post: (
    id: string,
    data: { accountId: string },
  ): Promise<ApiResponse<CourierPayout>> =>
    apiClient.post(`${base}/${id}/post`, data),

  /**
   * Ask each configured courier for its remittances. Records what they report and **posts
   * nothing** — only Steadfast publishes a payout feed; Pathao and eCourier are assembled from
   * the parcels themselves.
   */
  sync: (data?: {
    provider?: string;
    since?: string;
  }): Promise<ApiResponse<CourierPayoutSync>> =>
    apiClient.post(`${base}/sync`, data ?? {}),

  getSummary: (
    filters: { startDate?: string; endDate?: string } = {},
  ): Promise<ApiResponse<CourierMoneySummary>> =>
    apiClient.get(`${base}/summary${queryString({ ...filters })}`),
};
