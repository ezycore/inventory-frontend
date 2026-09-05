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
import { Button } from "@/ui/components/button";
import { Switch } from "@/ui/components/switch";
import { Loader2, Lock, RotateCcw } from "lucide-react";
import { NavIcon } from "@/components/shared/nav-icon";
import { useRouter } from "next/navigation";
import { useApplyOnboardingStep } from "@/services/api";
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
  "combo",
  "purchases",
  "inventoryTracking",
];

export default function FeatureSettingsPage() {
  const t = useTranslations("settings.features");
  const tShell = useTranslations("settings.shell");
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateFeaturesStore = useAuthStore((state) => state.updateFeatures);

  const { data: featuresData, isLoading } = useGetFeatures();
  const { mutate: updateFeatures } = useUpdateFeatures();
  const { mutate: applyOnboardingStep, isPending: restarting } =
    useApplyOnboardingStep();

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
  // `{ child: [parents] }`, straight from the backend's own `FEATURE_REQUIRES`
  // rather than a second copy here — the two must never disagree about what
  // depends on what, and a duplicated table drifts on the first dependency
  // anyone adds. Empty until the stock key lands, which is why every switch
  // still reads two-state today.
  const featureRequires: Record<string, string[]> =
    featuresData?.data?.featureRequires ?? {};

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

  // Keep the auth store in sync with the fetched features — BOTH maps. The
  // ceiling is what lets a lock screen elsewhere say "not in your plan" rather
  // than "switched off", so syncing only the effective half leaves every other
  // screen guessing until the next full reload.
  useEffect(() => {
    if (featuresData?.data?.features) {
      updateFeaturesStore(
        featuresData.data.features,
        featuresData.data.planFeatures,
      );
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

  // Declared above the toggle handler, which names cascaded features in its
  // confirm copy.
  const featureNames = getFeatureDisplayNames(t);

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
    // Which OTHER capabilities go with this one. Derived from the same
    // `featureRequires` table the backend enforces, so the warning cannot
    // promise something the cascade does not do — and read against the CURRENT
    // effective map, so a dependant the merchant had already switched off is
    // not listed as something they are about to lose.
    const cascaded = Object.entries(featureRequires)
      .filter(
        ([child, parents]) =>
          parents.includes(feature) &&
          features?.[child as FeatureName] === true,
      )
      .map(([child]) => featureNames[child as FeatureName]);
    const consequence = disableConsequence(
      feature,
      impactData?.data,
      t,
      cascaded,
    );
    if (!consequence) {
      applyToggle(feature, false);
      return;
    }
    setConfirming({ feature, consequence });
  };

  const featureDescriptions = getFeatureDescriptions(t);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
        // The way back into setup. Customize workspace is the canonical control
        // and the wizard is a guided front-end onto the same write, so a
        // merchant whose business has changed shape — started stocking, opened a
        // counter, taken on suppliers — should not have to reconstruct the
        // equivalent state by hand across a list of switches with no
        // recommendation and no order.
        //
        // `restart` rather than a plain navigation: the resume point only ever
        // advances, so `/onboarding` would render the review screen of a run
        // that already finished.
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={restarting}
            onClick={() =>
              applyOnboardingStep(
                { restart: true },
                { onSuccess: () => router.push("/onboarding") },
              )
            }
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("setUpAgain")}
          </Button>
        }
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
          // The THIRD state, and the reason it needs its own branch: a
          // dependant whose parent is off resolves to `false` in the effective
          // map, so it renders identically to a capability the merchant
          // deliberately declined — and the fix is completely different. This
          // one costs nothing and needs no upgrade; it needs the named parent
          // switched back on. The table comes from the backend so the two
          // cannot disagree about what depends on what.
          const blockedBy = (featureRequires[feature] ?? []).filter(
            (parent) => features?.[parent as FeatureName] !== true,
          ) as FeatureName[];
          const unavailable = inPlan && blockedBy.length > 0;

          return (
            <Card
              key={feature}
              className={`transition-colors ${
                !inPlan || unavailable
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
                    <div>
                      <CardTitle className="text-base">
                        {featureNames[feature]}
                      </CardTitle>
                      {unavailable && (
                        <span className="text-xs text-muted-foreground">
                          {t("needsParent", {
                            parent: featureNames[blockedBy[0]],
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {!inPlan || unavailable ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Switch
                      id={`feature-${feature}`}
                      checked={isEnabled}
                      disabled={pendingFeature === feature}
                      onCheckedChange={(next) => handleToggle(feature, next)}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {featureDescriptions[feature]}
                </CardDescription>
                {unavailable && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("needsParentHint", {
                      parent: featureNames[blockedBy[0]],
                    })}
                  </p>
                )}
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
