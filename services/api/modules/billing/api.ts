import { apiClient } from "@/lib/api-client";
import type { ApiResponse, OrganizationFeatures } from "@/types";

export type YocoreSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired"
  | "grace";

export interface YocoreSubscriptionSnapshot {
  subscriptionId: string;
  planId: string;
  planSlug: string;
  status: YocoreSubscriptionStatus;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  limits?: {
    maxLocations?: number | null;
    maxUsers?: number | null;
    features?: string[];
  };
  updatedAt: string;
}

export interface BillingSubscriptionResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
    status: "active" | "inactive" | "read_only";
    deletionScheduledAt: string | null;
  };
  features: OrganizationFeatures;
  subscription: YocoreSubscriptionSnapshot | null;
  yocoreWorkspaceId: string | null;
}

export const billingApi = {
  getSubscription: (): Promise<ApiResponse<BillingSubscriptionResponse>> =>
    apiClient.get("/billing/subscription"),
};
