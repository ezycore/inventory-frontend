import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";

interface SummaryCardsProps {
  isAccountsEnabled: boolean;
  isSummaryLoading: boolean;
  summary?: {
    totalOrders?: number;
    receivedOrders?: number;
    orderedOrders?: number;
    totalAmount?: number;
    totalPaid?: number;
    totalDue?: number;
  };
  formatCurrency: (n: number) => string;
}

export function SummaryCards({
  isAccountsEnabled,
  isSummaryLoading,
  summary,
  formatCurrency,
}: SummaryCardsProps) {
  return (
    <div
      className={`grid gap-4 ${
        isAccountsEnabled ? "md:grid-cols-4" : "md:grid-cols-2"
      }`}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Orders</CardDescription>
          <CardTitle className="text-2xl">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              (summary?.totalOrders ?? 0)
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {isSummaryLoading
              ? "..."
              : `${summary?.receivedOrders ?? 0} received, ${summary?.orderedOrders ?? 0} pending`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Amount</CardDescription>
          <CardTitle className="text-2xl">
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              formatCurrency(summary?.totalAmount ?? 0)
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">All time purchases</p>
        </CardContent>
      </Card>

      {isAccountsEnabled && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Paid</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(summary?.totalPaid ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Amount paid to suppliers
            </p>
          </CardContent>
        </Card>
      )}

      {isAccountsEnabled && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Due</CardDescription>
            <CardTitle
              className={`text-2xl ${
                (summary?.totalDue ?? 0) > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(summary?.totalDue ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
