// coding-standard: maintained
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('sales.returns.summary');
  return (
    <div
      className={`grid gap-4 ${
        isAccountsEnabled ? 'md:grid-cols-4' : 'md:grid-cols-3'
      }`}
    >
      <StatCard
        label={t('totalReturns')}
        value={String(summary?.allTime?.returnsCount ?? 0)}
        sub={t('allTime')}
        isLoading={isLoading}
      />
      <StatCard
        label={t('returnAmount')}
        value={formatCurrency(summary?.thisMonth?.totalRefunds ?? 0)}
        sub={t('totalRefunded')}
        isLoading={isLoading}
      />
      <StatCard
        label={t('pending')}
        value={String(summary?.pending?.returnsCount ?? 0)}
        sub={t('awaitingReview')}
        isLoading={isLoading}
      />
      {isAccountsEnabled && (
        <StatCard
          label={t('cashRefunded')}
          value={formatCurrency(summary?.allTime?.totalCashRefunded ?? 0)}
          sub={t('allTime')}
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
    <Card className="gap-2">
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
