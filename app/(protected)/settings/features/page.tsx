"use client";

import { organizationApi } from "@/lib/api";
import {
  FEATURE_DESCRIPTIONS,
  FEATURE_DISPLAY_NAMES,
  FEATURE_ICONS,
} from "@/lib/feature-utils";
import { useAuthStore } from "@/stores";
import { FeatureName } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";
import { Switch } from "@/ui/components/switch";
import { Loader2 } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define feature order for display
const FEATURE_ORDER: FeatureName[] = [
  "sales",
  "accounts",
  "returns",
  "expiryTracking",
  "barcodeSystem",
  "invoicePrinting",
];

export default function FeatureSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateFeatures = useAuthStore((state) => state.updateFeatures);
  const { features } = user?.organization || {};

  const [isLoading, setIsLoading] = useState(false);
  const [savingFeature, setSavingFeature] = useState<FeatureName | null>(null);

  const canManageSettings =
    user?.permissions?.includes("organization.edit") ?? false;

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (user && !canManageSettings) {
      toast.error("You don't have permission to access this page");
      router.push("/");
    }
  }, [user, canManageSettings, router]);

  // Fetch current features on mount
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setIsLoading(true);
        const response = await organizationApi.getFeatures();
        if (response.data?.features) {
          updateFeatures(response.data.features);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load feature settings");
      } finally {
        setIsLoading(false);
      }
    };

    if (canManageSettings) {
      fetchFeatures();
    }
  }, [canManageSettings, updateFeatures]);

  // Don't render if no permission
  if (!canManageSettings) {
    return null;
  }

  const handleToggleFeature = async (
    feature: FeatureName,
    enabled: boolean,
  ) => {
    try {
      setSavingFeature(feature);

      // Optimistically update UI
      updateFeatures({ ...features, [feature]: enabled });

      // Save to server
      await organizationApi.updateFeatures({ [feature]: enabled });

      toast.success(
        `${FEATURE_DISPLAY_NAMES[feature]} ${enabled ? "enabled" : "disabled"}`,
      );
    } catch (error: any) {
      // Revert on error
      updateFeatures({ ...features, [feature]: !enabled });
      toast.error(error.message || "Failed to update feature setting");
    } finally {
      setSavingFeature(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Feature Settings"
        subTitle="Enable or disable features for your organization. Disabled features will be hidden from the navigation and cannot be accessed."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURE_ORDER.map((feature) => {
          const isEnabled = features[feature];
          const isSaving = savingFeature === feature;

          return (
            <Card
              key={feature}
              className={`transition-colors ${
                isEnabled ? "border-primary/50 bg-primary/5" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isEnabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <DynamicIcon
                        name={FEATURE_ICONS[feature] as any}
                        className="h-5 w-5"
                      />
                    </div>
                    <CardTitle className="text-base">
                      {FEATURE_DISPLAY_NAMES[feature]}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      id={`feature-${feature}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        handleToggleFeature(feature, checked)
                      }
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {FEATURE_DESCRIPTIONS[feature]}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Feature Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Sales Management:</strong> When enabled, allows creating
            sales orders, managing customers, and tracking sales history.
          </p>
          <p>
            • <strong>Account Management:</strong> Enables financial tracking
            with multiple accounts (cash, bank, mobile wallets), payment
            recording, and account transfers.
          </p>
          <p>
            • <strong>Returns Management:</strong> Allows processing sales
            returns and purchase returns with proper tracking.
          </p>
          <p>
            • <strong>Expiry Tracking:</strong> Track product expiry dates with
            batch management and get alerts for expiring items.
          </p>
          <p>
            • <strong>Barcode System:</strong> Enable barcode/SKU fields on
            products and use barcode scanning for quick product lookup.
          </p>
          <p>
            • <strong>Invoice Printing:</strong> Generate and print invoices for
            sales and purchases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
