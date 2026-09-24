"use client";
// coding-standard: maintained

import {
  useGetClaritySettings,
  useGetGa4Settings,
  useGetMetaSettings,
} from "@/services/api";
import { ClaritySettingsCard } from "./clarity-settings-tab";
import { CookieBannerCard } from "./cookie-banner-card";
import { Ga4SettingsCard } from "./ga4-settings-card";
import { MarketingToolRow, type ToolStatus } from "./marketing-tool-row";
import { MetaSettingsCard } from "./meta-settings-tab";

/**
 * Store Settings → Marketing (backend `docs/plan/storefront-ga4.md` §6).
 *
 * Replaces the separate "Meta pixel" and "Clarity" tabs: every measurement tool the merchant
 * pastes an id into, in one place. The shared cookie banner leads, because it governs all of
 * them; each tool is a row that starts collapsed and says whether it is on without being opened.
 */

const ON: ToolStatus = { label: "On", tone: "on" };
const OFF: ToolStatus = { label: "Off", tone: "off" };

export function MarketingSettingsTab() {
  // The badges read the same queries the forms use, so opening a row costs no second request.
  const { data: meta } = useGetMetaSettings();
  const { data: ga4 } = useGetGa4Settings();
  const { data: clarity } = useGetClaritySettings();

  const metaStatus: ToolStatus | undefined = !meta
    ? undefined
    : meta.enabled && meta.verifiedAt
      ? { label: "Connected", tone: "on" }
      : meta.enabled && meta.pixelId
        ? { label: "Set up", tone: "partial" }
        : OFF;

  return (
    <div className="space-y-4">
      <CookieBannerCard />
      <MarketingToolRow
        title="Meta Pixel"
        subtitle="Facebook & Instagram ads"
        status={metaStatus}
        renderBody={(onDirtyChange) => <MetaSettingsCard onDirtyChange={onDirtyChange} />}
      />
      <MarketingToolRow
        title="Google Analytics"
        subtitle="Visitors, traffic sources and Google Ads sales"
        status={ga4 ? (ga4.ready ? ON : OFF) : undefined}
        renderBody={(onDirtyChange) => <Ga4SettingsCard onDirtyChange={onDirtyChange} />}
      />
      <MarketingToolRow
        title="Microsoft Clarity"
        subtitle="Session recordings and heatmaps"
        status={clarity ? (clarity.ready ? ON : OFF) : undefined}
        renderBody={(onDirtyChange) => <ClaritySettingsCard onDirtyChange={onDirtyChange} />}
      />
    </div>
  );
}
