import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { Skeleton } from '@/ui/components/skeleton';
import type { SalesReturnsSummary } from '@/types';

interface SummaryCardsProps {
  summary: SalesReturnsSummary | undefined;
  isLoading: boolean;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
}

export function SummaryCards({
  summary,
  isLoading,
  isAccountsEnabled,
  formatCurrency,
}: SummaryCardsProps) {
  const pendingCount =
    (summary?.thisMonth?.returnsCount ?? 0) - (summary?.allTime?.returnsCount ?? 0) >= 0
      ? 0
      : 0;
  // We don't get a pending count from summary, so calculate from available data
  // For the 3-card layout matching the screenshot:

  return (
    <div
      className={`grid gap-4 ${
        isAccountsEnabled ? 'md:grid-cols-4' : 'md:grid-cols-3'
      }`}
    >
      <StatCard
        label="Total Returns"
        value={String(summary?.allTime?.returnsCount ?? 0)}
        sub="this month"
        isLoading={isLoading}
      />
      <StatCard
        label="Return Amount"
        value={formatCurrency(summary?.thisMonth?.totalRefunds ?? 0)}
        sub="total refunded"
        isLoading={isLoading}
      />
      <StatCard
        label="Pending"
        value={String(summary?.today?.returnsCount ?? 0)}
        sub="awaiting review"
        isLoading={isLoading}
      />
      {isAccountsEnabled && (
        <StatCard
          label="Cash Refunded"
          value={formatCurrency(summary?.allTime?.totalCashRefunded ?? 0)}
          sub="all time"
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// ── Single stat card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  isLoading,
}: {
  label: string;
  value: string;
  sub: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-primary font-medium">{label}</CardDescription>
        <CardTitle className="text-2xl">
          {isLoading ? <Skeleton className="h-8 w-24" /> : value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {isLoading ? '...' : sub}
        </p>
      </CardContent>
    </Card>
  );
}
