"use client";
// coding-standard: maintained

import { useCouriers } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Spinner } from "@/ui/components/spinner";
import { CourierRow } from "./courier-row";
import { CourierWebhookCard } from "./courier-webhook-card";
import { CustomCourierCard } from "./custom-courier-card";

/**
 * Storefront courier integrations. One collapsible row per integrated provider —
 * the per-row state (configured vs. connect form) lives in `CourierRow` — plus
 * the merchant's own manual couriers, which carry no credentials at all.
 */
export function CourierSettings() {
  const { data, isLoading } = useCouriers();

  return (
    <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Couriers</CardTitle>
        <CardDescription>
          Connect a delivery partner. Credentials are encrypted at rest and never
          shown again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading || !data ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Loading couriers…
          </p>
        ) : (
          Object.keys(data.providers).map((provider) => (
            <CourierRow
              key={provider}
              provider={provider}
              fields={data.providers[provider]}
              entry={data.couriers.find((c) => c.provider === provider)}
            />
          ))
        )}
      </CardContent>
    </Card>
    <CustomCourierCard couriers={data?.customCouriers ?? []} />
    <CourierWebhookCard />
    </div>
  );
}
