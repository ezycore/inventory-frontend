"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useOrgCalendar } from "@/hooks/use-org-calendar";
import { campaignPickerOptions } from "@/lib/storefront-builder/campaign-options";
import { useCampaigns } from "@/services/api/modules/campaigns/hooks";
import { FuseAdvancedSelect } from "@/ui/components/fuse-advanced-select";

/**
 * A `ref` setting that points at one campaign (the hero's "Which offer").
 *
 * Its own component, not an `optionsApi` source in `RefField`: which options
 * are listed depends on the offer already PICKED (kept, labelled "ended …") and
 * on the clock, and a select-options query is cached by URL alone — the list
 * computed for one value would be served to the next.
 */
export function CampaignRefField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { timezone } = useOrgCalendar();
  const pickedId = typeof value === "string" ? value : undefined;
  // Read once per open inspector: an offer crossing its start or end while the
  // panel is open is not worth a re-render clock.
  const [now] = useState(() => Date.now());
  const options = useMemo(
    () => campaignPickerOptions(campaigns, { now, timezone, pickedId }),
    [campaigns, now, timezone, pickedId],
  );

  return (
    <FuseAdvancedSelect
      id={id}
      options={options}
      mode="single"
      value={pickedId}
      disabled={isLoading}
      placeholder={options.length ? "Choose one" : "No running or upcoming offers"}
      onValueChange={(next) => onChange(typeof next === "string" && next ? next : undefined)}
    />
  );
}
