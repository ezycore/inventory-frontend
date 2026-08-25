"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  getFeatureDescriptions,
  getFeatureDisplayNames,
  FEATURE_ICONS,
} from "@/lib/feature-utils";
import { useAuthStore } from "@/services/stores";
import { FeatureName } from "@/types";
import {
  useFeatureImpact,
  useGetFeatures,
  useGetStorefrontSettings,
  useUpdateFeatures,
} from "@/services/api";
import {
  DisableFeatureDialog,
  disableConsequence,
} from "@/components/settings/disable-feature-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";
import { Switch } from "@/ui/components/switch";
import { Loader2, Lock } from "lucide-react";
import { NavIcon } from "@/components/shared/nav-icon";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define feature order for display
// `smsNotifications` is deliberately absent: it costs real money per message and
// is configured (with its credit balance) under Notifications, so a bare switch
// here would be a second, weaker control over the same thing.
const FEATURE_ORDER: FeatureName[] = [
  "sales",
  "accounts",
  "returns",
  "expiryTracking",
  "barcodeSystem",
  "invoicePrinting",
  "uomConversion",
  "storefront",
  "multiLocation",
  "tax",
  "combo"
];

export default function FeatureSettingsPage() {
  const t = useTranslations("settings.features");
  const tShell = useTranslations("settings.shell");
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateFeaturesStore = useAuthStore((state) => state.updateFeatures);

  const { data: featuresData, isLoading } = useGetFeatures();
  const { mutate: updateFeatures } = useUpdateFeatures();

  // Track only the feature currently being toggled so we disable just that one
  // switch — disabling them all (via the shared mutation isPending) makes every
  // switch blink on each toggle.
  const [pendingFeature, setPendingFeature] = useState<FeatureName | null>(null);
  const [confirming, setConfirming] = useState<{
    feature: FeatureName;
    consequence: string;
  } | null>(null);

  const { data: impactData } = useFeatureImpact();

  // Effective (enforced) set drives the toggle state; plan ceiling decides which
  // toggles are available vs. locked behind an upgrade.
  const features =
    featuresData?.data?.features ?? user?.organization?.features;
  const planFeatures = featuresData?.data?.planFeatures;

  const canManageSettings =
    user?.permissions?.includes("organization.edit") ?? false;

  // The `storefront` flag is the platform gate; publishing is a separate,
  // merchant-owned switch on /ecommerce/settings that this page never touches
  // — so turning storefront on here does not make the shop reachable by
  // itself. A merchant who stops at this toggle hits "This store is
  // currently unavailable" with no clue why, since nothing else points them
  // at the publish step. Fetch the settings doc only once the feature is on
  // (the endpoint 403s while it's off) and nudge toward it when unpublished.
  const isStorefrontEnabled = features?.storefront === true;
  const { data: storefrontSettings } = useGetStorefrontSettings(isStorefrontEnabled);
  const needsStorefrontPublish =
    isStorefrontEnabled && storefrontSettings && !storefrontSettings.published;

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (user && !canManageSettings) {
      toast.error(tShell("noPermission"));
      router.push("/");
    }
  }, [user, canManageSettings, router, tShell]);

  // Keep the auth store in sync with the fetched effective features.
  useEffect(() => {
    if (featuresData?.data?.features) {
      updateFeaturesStore(featuresData.data.features);
    }
  }, [featuresData, updateFeaturesStore]);

  // Don't render if no permission
  if (!canManageSettings) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const applyToggle = (feature: FeatureName, next: boolean) => {
    setPendingFeature(feature);
    updateFeatures(
      { [feature]: next },
      { onSettled: () => setPendingFeature(null) },
    );
  };

  // Turning something ON is always cheap, so it goes straight through. Turning
  // it OFF once data exists is the direction worth a beat — but only where
  // there is something concrete to say. A confirm on every switch trains people
  // to click through the one that matters.
  const handleToggle = (feature: FeatureName, next: boolean) => {
    if (next) {
      applyToggle(feature, true);
      return;
    }
    const consequence = disableConsequence(feature, impactData?.data, t);
    if (!consequence) {
      applyToggle(feature, false);
      return;
    }
    setConfirming({ feature, consequence });
  };

  const featureNames = getFeatureDisplayNames(t);
  const featureDescriptions = getFeatureDescriptions(t);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />

      {needsStorefrontPublish && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <span>{t("storefrontNotPublished")}</span>
          <Link
            href="/ecommerce/settings"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("storefrontPublishLink")}
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURE_ORDER.map((feature) => {
          // A feature is available only when the plan grants it. While
          // planFeatures is loading we fall back to the effective set.
          const inPlan = planFeatures
            ? planFeatures[feature] === true
            : (features?.[feature] ?? false);
          const isEnabled = features?.[feature] ?? false;

          return (
            <Card
              key={feature}
              className={`transition-colors ${
                !inPlan
                  ? "border-dashed opacity-75"
                  : isEnabled
                    ? "border-primary/50 bg-primary/5"
                    : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        inPlan && isEnabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <NavIcon
                        name={FEATURE_ICONS[feature]}
                        className="h-5 w-5"
                      />
                    </div>
                    <CardTitle className="text-base">
                      {featureNames[feature]}
                    </CardTitle>
                  </div>
                  {inPlan ? (
                    <Switch
                      id={`feature-${feature}`}
                      checked={isEnabled}
                      disabled={pendingFeature === feature}
                      onCheckedChange={(next) => handleToggle(feature, next)}
                    />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {featureDescriptions[feature]}
                </CardDescription>
                {!inPlan && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("notIncluded")}{" "}
                    <Link
                      href="/dashboard/billing"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {t("upgrade")}
                    </Link>{" "}
                    {t("toEnable")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DisableFeatureDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        featureName={confirming ? featureNames[confirming.feature] : ""}
        consequence={confirming?.consequence ?? null}
        onConfirm={() => {
          if (confirming) applyToggle(confirming.feature, false);
          setConfirming(null);
        }}
      />

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("planManaged")}</p>
            <p className="text-sm text-muted-foreground">
              {t.rich("planManagedBody", {
                link: (chunks) => (
                  <Link
                    href="/dashboard/billing"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
