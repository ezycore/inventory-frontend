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
  return (
    <div
      className={`grid gap-4 ${
        isAccountsEnabled ? 'md:grid-cols-4' : 'md:grid-cols-2'
      }`}
    >
      <StatCard
        label="Today"
        value={formatCurrency(summary?.today?.totalRefunds ?? 0)}
        sub={`${summary?.today?.returnsCount ?? 0} return(s)`}
        color="text-orange-600"
        isLoading={isLoading}
      />
      <StatCard
        label="This Month"
        value={formatCurrency(summary?.thisMonth?.totalRefunds ?? 0)}
        sub={`${summary?.thisMonth?.returnsCount ?? 0} return(s)`}
        color="text-orange-600"
        isLoading={isLoading}
      />
      {isAccountsEnabled && (
        <StatCard
          label="Cash Refunded (All Time)"
          value={formatCurrency(summary?.allTime?.totalCashRefunded ?? 0)}
          sub={`From ${summary?.allTime?.returnsCount ?? 0} return(s)`}
          color="text-red-600"
          isLoading={isLoading}
        />
      )}
      {isAccountsEnabled && (
        <StatCard
          label="Due Adjusted (All Time)"
          value={formatCurrency(summary?.allTime?.totalDueAdjusted ?? 0)}
          sub="Applied to outstanding dues"
          color="text-blue-600"
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
  color,
  isLoading,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`text-2xl ${color}`}>
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
