import { format } from "date-fns";

import type {
  YocoreSubscriptionSnapshot,
  YocoreSubscriptionStatus,
} from "@/services/api";
import { Badge } from "@ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";

interface SubscriptionCardProps {
  subscription: YocoreSubscriptionSnapshot;
}

const STATUS_LABEL: Record<YocoreSubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  paused: "Paused",
  canceled: "Canceled",
  expired: "Expired",
  grace: "Grace period",
};

const STATUS_VARIANT: Record<
  YocoreSubscriptionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  trialing: "secondary",
  active: "default",
  past_due: "destructive",
  paused: "outline",
  canceled: "destructive",
  expired: "destructive",
  grace: "secondary",
};

function fmt(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "PPP");
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const status = subscription.status as YocoreSubscriptionStatus;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="capitalize">
            {subscription.planSlug || subscription.planId}
          </CardTitle>
          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Plan ID</dt>
          <dd className="font-mono text-xs">{subscription.planId}</dd>

          <dt className="text-muted-foreground">Subscription ID</dt>
          <dd className="font-mono text-xs">{subscription.subscriptionId}</dd>

          <dt className="text-muted-foreground">Current period</dt>
          <dd>
            {fmt(subscription.currentPeriodStart)} —{" "}
            {fmt(subscription.currentPeriodEnd)}
          </dd>

          {subscription.trialEndsAt && (
            <>
              <dt className="text-muted-foreground">Trial ends</dt>
              <dd>{fmt(subscription.trialEndsAt)}</dd>
            </>
          )}

          <dt className="text-muted-foreground">Auto-renew</dt>
          <dd>{subscription.cancelAtPeriodEnd ? "Off" : "On"}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
