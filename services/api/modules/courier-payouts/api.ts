// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  CourierBalances,
  CourierMoneySummary,
  CourierPayout,
  CourierWriteOff,
} from "@/types/api";

export type { CourierBalances, CourierMoneySummary, CourierPayout, CourierWriteOff };

/** One courier's "owes you" card. */
export type CourierBalance = CourierBalances["couriers"][number];
/** One open parcel on a courier's account. */
export type CourierParcel = CourierBalances["parcels"][number];

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
 * Body of `POST /api/ecommerce/payouts` — a payment received from a courier. One form for every
 * courier: what arrived, when, into which account, and the open parcels it covers. The server
 * compares what arrived with what those parcels should net and flags any difference; it never
 * refuses one (backend `docs/plan/courier-settlement-manual.md` D3).
 */
export interface RecordCourierPaymentInput {
  provider?: "pathao" | "steadfast" | "ecourier";
  customCourierId?: string;
  amount: number;
  /** `YYYY-MM-DD` on the org's calendar. Defaults to today server-side. */
  receivedAt?: string;
  /** Required with the accounts feature on. */
  accountId?: string;
  orderIds: string[];
  /** Courier statement id or bKash TrxID. The server generates `PAY-YYYYMMDD-NNN` otherwise. */
  reference?: string;
  /** Why a short payment is short: extra courier charges, or still owed (default). */
  shortReason?: "courier_charges" | "still_owed";
  note?: string;
  idempotencyKey?: string;
}

/** Body of `POST /api/ecommerce/payouts/write-off` — give up on a courier's shortfall. */
export interface WriteOffCourierShortfallInput {
  provider?: "pathao" | "steadfast" | "ecourier";
  customCourierId?: string;
  /** Defaults to the whole shortfall. */
  amount?: number;
  note?: string;
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
    data: RecordCourierPaymentInput,
  ): Promise<ApiResponse<CourierPayout>> => apiClient.post(base, data),

  writeOff: (
    data: WriteOffCourierShortfallInput,
  ): Promise<ApiResponse<CourierWriteOff>> => apiClient.post(`${base}/write-off`, data),

  getBalances: (): Promise<ApiResponse<CourierBalances>> =>
    apiClient.get(`${base}/balances`),

  getSummary: (
    filters: { startDate?: string; endDate?: string } = {},
  ): Promise<ApiResponse<CourierMoneySummary>> =>
    apiClient.get(`${base}/summary${queryString({ ...filters })}`),
};
