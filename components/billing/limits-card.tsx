import type { YocoreSubscriptionSnapshot } from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";

interface LimitsCardProps {
  limits?: YocoreSubscriptionSnapshot["limits"];
}

function fmtLimit(value?: number | null) {
  if (value == null) return "Unlimited";
  return value.toLocaleString();
}

export function LimitsCard({ limits }: LimitsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan limits</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Locations</dt>
          <dd>{fmtLimit(limits?.maxLocations)}</dd>

          <dt className="text-muted-foreground">Users</dt>
          <dd>{fmtLimit(limits?.maxUsers)}</dd>

          <dt className="text-muted-foreground">Plan features</dt>
          <dd>
            {limits?.features && limits.features.length > 0
              ? limits.features.join(", ")
              : "—"}
          </dd>
        </dl>
      </CardContent>
    </Card>
  );
}
