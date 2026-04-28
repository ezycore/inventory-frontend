import { Check, X } from "lucide-react";

import type { OrganizationFeatures } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { cn } from "@/lib/utils";

interface FeaturesGridProps {
  features: OrganizationFeatures;
}

const FEATURE_LABELS: Record<keyof OrganizationFeatures, string> = {
  sales: "Sales",
  accounts: "Accounts",
  expiryTracking: "Expiry tracking",
  barcodeSystem: "Barcode system",
  invoicePrinting: "Invoice printing",
  returns: "Returns",
  uomConversion: "Unit conversion",
};

export function FeaturesGrid({ features }: FeaturesGridProps) {
  const entries = (
    Object.keys(FEATURE_LABELS) as (keyof OrganizationFeatures)[]
  ).map((key) => ({ key, label: FEATURE_LABELS[key], enabled: !!features[key] }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active features</CardTitle>
        <CardDescription>
          Effective feature flags derived from your plan and lifecycle status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {entries.map((f) => (
            <li
              key={f.key}
              className={cn(
                "flex items-center gap-2 rounded-md border p-3 text-sm",
                f.enabled
                  ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                  : "border-muted bg-muted/30 text-muted-foreground",
              )}
            >
              {f.enabled ? (
                <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <X className="size-4" />
              )}
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
