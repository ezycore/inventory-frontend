"use client";
// coding-standard: maintained

import { useState } from "react";
import { ExternalLink, Eye, Info } from "lucide-react";
import {
  useGetClaritySettings,
  useUpdateClaritySettings,
} from "@/services/api";
import type { ClarityCookieConsent, ClaritySettings } from "@/types/api";
import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { SegmentedField } from "@/ui/components/segmented-field";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import { Field, SaveBar, ToggleRow } from "./settings-form-shared";

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

const CONSENT_OPTIONS: {
  value: ClarityCookieConsent;
  label: string;
  description: string;
}[] = [
  {
    value: "off",
    label: "No banner",
    description:
      "Recommended. No cookies and no banner — you still get recordings and heatmaps. A returning shopper is counted as a new one.",
  },
  {
    value: "eu",
    label: "Europe only",
    description:
      "Only shoppers on a European clock see the banner. Bangladeshi shoppers never do.",
  },
  {
    value: "always",
    label: "Everyone",
    description:
      "Every shopper sees a small bar at the bottom of your shop until they answer it.",
  },
];

export function ClaritySettingsTab() {
  const { data: settings, isLoading } = useGetClaritySettings();
  if (isLoading || !settings) {
    return <Skeleton className="h-80 w-full" />;
  }
  return <ClaritySettingsForm settings={settings} />;
}

function ClaritySettingsForm({ settings }: { settings: ClaritySettings }) {
  const update = useUpdateClaritySettings();

  const [enabled, setEnabled] = useState(settings.enabled);
  const [projectId, setProjectId] = useState(settings.projectId ?? "");
  const [consent, setConsent] = useState<ClarityCookieConsent>(
    settings.cookieConsent,
  );

  const save = () => update.mutate({ enabled, projectId, cookieConsent: consent });

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h2 className="text-base font-semibold">Microsoft Clarity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            See how shoppers actually use your shop — where they tap, how far they scroll, and
            where they give up. Free, and it stays in your own Clarity account.
          </p>
        </div>

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
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h2 className="text-base font-semibold">Cookie banner</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clarity stores nothing on a shopper&apos;s device unless they agree, so a banner is
            optional. Ask for it only if you need to recognise returning visitors.
          </p>
        </div>

        <SegmentedField
          label="When to show the cookie banner"
          value={consent}
          options={CONSENT_OPTIONS}
          onChange={(value) => setConsent(value as ClarityCookieConsent)}
        />

        <p className="text-xs text-muted-foreground">
          Wherever it shows, the banner is a small bar at the bottom of the page — never a
          pop-up, and never on the checkout page.
        </p>
      </Card>

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
