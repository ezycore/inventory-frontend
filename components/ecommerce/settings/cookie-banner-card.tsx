"use client";
// coding-standard: maintained

import { useState } from "react";
import { useGetMarketingSettings, useUpdateMarketingSettings } from "@/services/api";
import type { CookieBannerMode } from "@/types/api";
import { Card } from "@/ui/components/card";
import { SegmentedField } from "@/ui/components/segmented-field";
import { Skeleton } from "@/ui/components/skeleton";
import { SaveBar } from "./settings-form-shared";

/**
 * The store-level cookie banner (backend `docs/plan/storefront-ga4.md` §5). It moved here off
 * the Clarity card when GA4 became a second tool that sets cookies: one banner, one shopper
 * answer, every tool.
 *
 * The card makes no claim about what any law requires. The merchant picks the mode and is
 * responsible for picking it — and it says so.
 */

const OPTIONS: { value: CookieBannerMode; label: string; description: string }[] = [
  {
    value: "off",
    label: "No banner",
    description:
      "Shoppers are never asked. Google Analytics measures every visit; Clarity is told they did not agree.",
  },
  {
    value: "eu",
    label: "Europe only",
    description:
      "Only shoppers on a European clock see the banner, and are measured only if they accept.",
  },
  {
    value: "always",
    label: "Everyone",
    description:
      "Every shopper sees a small bar at the bottom of your shop, and is measured only if they accept.",
  },
];

export function CookieBannerCard() {
  const { data: settings, isLoading } = useGetMarketingSettings();
  if (isLoading || !settings) return <Skeleton className="h-40 w-full" />;
  return <CookieBannerForm initial={settings.cookieBanner} />;
}

function CookieBannerForm({ initial }: { initial: CookieBannerMode }) {
  const update = useUpdateMarketingSettings();
  const [mode, setMode] = useState<CookieBannerMode>(initial);

  return (
    <Card className="gap-4 p-4 shadow-none">
      <div>
        <h2 className="text-base font-semibold">Cookie banner</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose whether shoppers are asked before Google Analytics and Clarity use cookies. One
          answer covers both.
        </p>
      </div>

      <SegmentedField
        label="When to show the cookie banner"
        value={mode}
        options={OPTIONS}
        onChange={(value) => setMode(value as CookieBannerMode)}
      />

      <p className="text-xs text-muted-foreground">
        The banner is a small bar at the bottom of the page — never a pop-up, and never on the
        checkout page. <strong>You are responsible for choosing the setting that is right for
        where you sell;</strong> your shop follows it.
      </p>

      <SaveBar onSave={() => update.mutate({ cookieBanner: mode })} pending={update.isPending} />
    </Card>
  );
}
