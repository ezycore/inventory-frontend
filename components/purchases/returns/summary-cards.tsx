"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import type { PurchaseReturnsSummary } from "@/types";

interface SummaryCardsProps {
  isSummaryLoading: boolean;
  summary: PurchaseReturnsSummary | undefined;
  formatCurrency: (n: number) => string;
}

export function SummaryCards({
  isSummaryLoading,
  summary,
  formatCurrency,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Returns</CardDescription>
          <CardTitle className="text-2xl">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.totalReturns ?? 0)
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Refund Amount</CardDescription>
          <CardTitle className="text-2xl text-orange-600">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              formatCurrency(summary?.totalRefundAmount ?? 0)
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Value returned</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Pending Returns</CardDescription>
          <CardTitle className="text-2xl">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.pendingReturns ?? 0)
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Awaiting processing
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
