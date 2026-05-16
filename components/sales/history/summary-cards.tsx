import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { Skeleton } from '@/ui/components/skeleton';
import type { SalesSummary } from '@/types';

interface SummaryCardsProps {
  summary: SalesSummary | undefined;
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
        value={formatCurrency(summary?.today?.totalSales ?? 0)}
        sub={`${summary?.today?.salesCount ?? 0} sale(s)`}
        isLoading={isLoading}
      />
      <StatCard
        label="This Month"
        value={formatCurrency(summary?.thisMonth?.totalSales ?? 0)}
        sub={`${summary?.thisMonth?.salesCount ?? 0} sale(s)`}
        isLoading={isLoading}
      />
      {isAccountsEnabled && (
        <StatCard
          label="Total Paid (All Time)"
          value={formatCurrency(summary?.allTime?.totalPaid ?? 0)}
          sub={`From ${summary?.allTime?.salesCount ?? 0} sale(s)`}
          valueClassName="text-green-600"
          isLoading={isLoading}
        />
      )}
      {isAccountsEnabled && (
        <StatCard
          label="Total Due (All Time)"
          value={formatCurrency(summary?.allTime?.totalDue ?? 0)}
          sub="Outstanding balance"
          valueClassName={
            (summary?.allTime?.totalDue ?? 0) > 0
              ? 'text-red-600'
              : 'text-green-600'
          }
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
  valueClassName = '',
  isLoading,
}: {
  label: string;
  value: string;
  sub: string;
  valueClassName?: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`text-2xl ${valueClassName}`}>
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
