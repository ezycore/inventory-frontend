"use client";
// coding-standard: maintained

import { useState } from "react";
import { ExternalLink, Eye, Info } from "lucide-react";
import {
  useGetClaritySettings,
  useUpdateClaritySettings,
} from "@/services/api";
import type { ClaritySettings } from "@/types/api";
import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import { Field, SaveBar, ToggleRow, useReportDirty } from "./settings-form-shared";

/**
 * Microsoft Clarity (backend `docs/plan/storefront-clarity.md`).
 *
 * Free session recordings and heatmaps for the merchant's own shop, in the merchant's own
 * Clarity account. **EzyCore renders none of that data** — there is no report behind this card
 * and there is not going to be one (Clarity's export API allows 10 calls a day over a 1–3 day
 * window), so the card's job is to take an id, explain the one real choice, and then get out of
 * the way by linking to the dashboard.
 *
 * Two things this card must say out loud, because a merchant who learns them from a customer
 * complaint learns them too late: Clarity **records what shoppers do on the screen**, and it
 * keeps those recordings for **30 days**. The merchant owns that project and is the one
 * answering for it.
 */

/** Where the merchant actually finds the id. The question this card exists to pre-empt. */
const CLARITY_URL = "https://clarity.microsoft.com/";

export function ClaritySettingsCard({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { data: settings, isLoading } = useGetClaritySettings();
  if (isLoading || !settings) {
    return <Skeleton className="h-80 w-full" />;
  }
  return <ClaritySettingsForm settings={settings} onDirtyChange={onDirtyChange} />;
}

function ClaritySettingsForm({
  settings,
  onDirtyChange,
}: {
  settings: ClaritySettings;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const update = useUpdateClaritySettings();

  const [enabled, setEnabled] = useState(settings.enabled);
  const [projectId, setProjectId] = useState(settings.projectId ?? "");
  useReportDirty(
    enabled !== settings.enabled || projectId.trim() !== (settings.projectId ?? ""),
    onDirtyChange,
  );

  // The cookie banner is store-level now (the Marketing tab's own card), so it is not sent here.
  const save = () => update.mutate({ enabled, projectId });

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          See how shoppers actually use your shop — where they tap, how far they scroll, and
          where they give up. Free, and it stays in your own Clarity account.
        </p>

        <ToggleRow
          label="Enable Clarity"
          desc="Off by default. Nothing is recorded until you turn this on and save a project ID."
          checked={enabled}
          onChange={setEnabled}
        />

        <Separator />

        <Field label="Project ID">
          <Input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="abcdefghij"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="pt-1 text-xs text-muted-foreground">
            Sign in at{" "}
            <a
              href={CLARITY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-medium underline"
            >
              clarity.microsoft.com <ExternalLink className="size-3" />
            </a>{" "}
            → create a project for your shop → <strong>Settings</strong> →{" "}
            <strong>Overview</strong>. The ID is the short code there.
          </p>
        </Field>

        {/* The card's whole delivery mechanism. Shown only once an id is saved, because a link
            built from an unsaved draft would 404 and read as our bug rather than a typo. */}
        {settings.dashboardUrl ? (
          <Button asChild variant="outline" size="sm" className="w-fit">
            <a href={settings.dashboardUrl} target="_blank" rel="noreferrer">
              Open your Clarity dashboard <ExternalLink className="ms-1 size-3.5" />
            </a>
          </Button>
        ) : null}

        {settings.ready ? (
          <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            Your first sessions appear in Clarity within a couple of hours of a real visitor —
            not instantly, and not for your own preview visits, which are never recorded.
          </p>
        ) : null}
      </div>

      <Alert>
        <Eye className="size-4" />
        <AlertTitle>What Clarity records</AlertTitle>
        <AlertDescription className="space-y-1">
          <span className="block">
            Clarity records a replay of what shoppers do on screen. Anything typed into a form —
            names, phone numbers, addresses — is hidden automatically, and your shop hides saved
            addresses and order details on top of that.
          </span>
          <span className="block">
            Recordings are kept for 30 days and heatmaps for 13 months, then deleted by Microsoft.
            The project is yours: whoever can sign into it can watch those replays.
          </span>
          <span className="block">
            <strong>Clarity sets cookies on your shop.</strong> That switch lives in Clarity, not
            here, and new projects have it on. To run without them, open Clarity &rarr; Settings
            &rarr; Setup &rarr; Advanced settings and turn <strong>Cookies</strong> off &mdash;
            visits then stop being linked into one session.
          </span>
        </AlertDescription>
      </Alert>

      <Alert>
        <Info className="size-4" />
        <AlertTitle>Looking for visitor numbers?</AlertTitle>
        <AlertDescription>
          Clarity answers <em>how</em> people use your shop, not how many came. It is a separate
          tool with its own dashboard — your orders and sales stay here.
        </AlertDescription>
      </Alert>

      <SaveBar onSave={save} pending={update.isPending} />
    </div>
  );
}
