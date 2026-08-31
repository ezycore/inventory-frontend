"use client";
// coding-standard: maintained

import { useState } from "react";
import { CheckCircle2, ExternalLink, Lock } from "lucide-react";
import {
  useClearMetaToken,
  useGetMetaSettings,
  useTestMetaConnection,
  useUpdateMetaSettings,
} from "@/services/api";
import type { MetaPurchaseTrigger, MetaSettings } from "@/types/api";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Password } from "@/ui/components/input-password";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import { NO_AUTOFILL } from "@/components/ecommerce/courier-no-autofill";
import { Field, SaveBar, ToggleRow } from "./settings-form-shared";
import { MetaPurchaseTriggerPicker } from "./meta-purchase-trigger";

/**
 * Meta Pixel & Conversions API (backend `docs/plan/meta-pixel-capi.md`).
 *
 * Two halves of one loop: the browser Pixel reports the shopper's journey, and the backend
 * reports the `Purchase` through the Conversions API at the trigger chosen below. `Purchase` is
 * **never** sent from the browser — see the plan's L1 — so nothing on this page can turn that on.
 *
 * The access token is write-only. The server has no path that returns it, so the field starts
 * empty on every load and an empty submit means "leave it alone" rather than "clear it" —
 * clearing is the separate Remove button, exactly as the courier credential form works.
 */

/** Where the merchant actually finds these two values. The single most-asked support question. */
const EVENTS_MANAGER_URL = "https://business.facebook.com/events_manager2";

export function MetaSettingsTab() {
  const { data: settings, isLoading } = useGetMetaSettings();
  if (isLoading || !settings) {
    return <Skeleton className="h-96 w-full" />;
  }
  // Keyed on the saved config so the local draft is rebuilt whenever the server view changes —
  // a test run stamps `verifiedAt`, and a stale draft would paint the card unverified again.
  return <MetaSettingsForm key={settings.verifiedAt ?? "unverified"} settings={settings} />;
}

function MetaSettingsForm({ settings }: { settings: MetaSettings }) {
  const update = useUpdateMetaSettings();
  const test = useTestMetaConnection();
  const clearToken = useClearMetaToken();

  const [enabled, setEnabled] = useState(settings.enabled);
  const [pixelId, setPixelId] = useState(settings.pixelId ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [testEventCode, setTestEventCode] = useState(settings.testEventCode ?? "");
  const [capiEnabled, setCapiEnabled] = useState(settings.capiEnabled);
  const [trigger, setTrigger] = useState<MetaPurchaseTrigger>(settings.purchaseTrigger);
  const [channels, setChannels] = useState(settings.channelReporting);
  const [events, setEvents] = useState(settings.browserEvents);

  const save = () =>
    update.mutate({
      enabled,
      pixelId,
      // Only sent when the merchant actually typed one. An empty string would still mean
      // "unchanged" server-side, but not sending it keeps that rule in one place.
      ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
      testEventCode,
      capiEnabled,
      purchaseTrigger: trigger,
      channelReporting: channels,
      browserEvents: events,
    });

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Meta Pixel &amp; Conversions API</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Report storefront activity and confirmed sales to Meta so your ads can be measured
              and optimised.
            </p>
          </div>
          {settings.verifiedAt ? (
            <Badge variant="secondary" className="gap-1 whitespace-nowrap">
              <CheckCircle2 className="size-3.5" /> Connected
            </Badge>
          ) : null}
        </div>

        <ToggleRow
          label="Enable Meta tracking"
          desc="Off by default — this sends customer activity to Meta."
          checked={enabled}
          onChange={setEnabled}
        />

        <Separator />

        <Field label="Pixel ID">
          <Input
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            placeholder="1234567890123456"
            inputMode="numeric"
          />
        </Field>

        <Field label="Conversions API access token">
          <Password
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            // The stored token can never be read back, so the placeholder is the only signal
            // that one exists — and typing nothing must leave it alone.
            placeholder={
              settings.tokenConfigured
                ? "Saved — leave blank to keep it"
                : "Paste your access token"
            }
            {...NO_AUTOFILL}
          />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" /> Stored encrypted. It is never shown again.
            </p>
            {settings.tokenConfigured ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-destructive"
                disabled={clearToken.isPending}
                onClick={() => clearToken.mutate()}
              >
                Remove saved token
              </Button>
            ) : null}
          </div>
        </Field>

        <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          Find both in{" "}
          <a
            href={EVENTS_MANAGER_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 font-medium underline"
          >
            Events Manager <ExternalLink className="size-3" />
          </a>{" "}
          → choose your Pixel → <strong>Settings</strong> → Conversions API →{" "}
          <em>Set up manually</em> → <strong>Generate access token</strong>. No Meta app or app
          review is needed. The button only appears for someone with developer access to the
          business.
        </p>

        <Field label="Test event code (optional)">
          <Input
            value={testEventCode}
            onChange={(e) => setTestEventCode(e.target.value)}
            placeholder="TEST12345"
          />
          <p className="pt-1 text-xs text-muted-foreground">
            While this is set, events go to the Test Events tab instead of your live dataset.
            Clear it when you are done testing.
          </p>
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={test.isPending || !settings.pixelId || !settings.tokenConfigured}
            onClick={() => test.mutate()}
          >
            {test.isPending ? "Sending…" : "Send test event"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {settings.pixelId && settings.tokenConfigured
              ? "Sends a real event to Meta so you can confirm the connection."
              : "Save a Pixel ID and access token first."}
          </p>
        </div>
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">When is a purchase counted?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Meta counts a purchase at the moment you pick here.{" "}
            <strong>Cancellations and returns after that point cannot be taken back from
            Meta&apos;s reporting.</strong>
          </p>
        </div>
        <MetaPurchaseTriggerPicker value={trigger} onChange={setTrigger} />
        <Separator />
        <ToggleRow
          label="Send purchases from this server"
          desc="Turn off to keep browser tracking but stop reporting sales."
          checked={capiEnabled}
          onChange={setCapiEnabled}
        />
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">Which orders are reported</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Website orders are always reported. These cover the orders you record yourself.
          </p>
        </div>
        <ToggleRow
          label="Messenger, WhatsApp, Instagram &amp; post comments"
          desc="Usually the result of an ad, so these are reported by default."
          checked={channels.socialChat}
          onChange={(socialChat) => setChannels({ ...channels, socialChat })}
        />
        <ToggleRow
          label="Phone orders"
          checked={channels.phone}
          onChange={(phone) => setChannels({ ...channels, phone })}
        />
        <ToggleRow
          label='Manually created ("Other")'
          desc="Orders you type in yourself are usually not from an ad."
          checked={channels.manual}
          onChange={(manual) => setChannels({ ...channels, manual })}
        />
      </Card>

      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">Browser events</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            What the Pixel reports as shoppers browse. Purchases are never sent from the browser —
            they come from this server instead, so no order is counted twice.
          </p>
        </div>
        <ToggleRow
          label="Page views"
          checked={events.pageView}
          onChange={(pageView) => setEvents({ ...events, pageView })}
        />
        <ToggleRow
          label="Product views"
          checked={events.viewContent}
          onChange={(viewContent) => setEvents({ ...events, viewContent })}
        />
        <ToggleRow
          label="Add to cart"
          checked={events.addToCart}
          onChange={(addToCart) => setEvents({ ...events, addToCart })}
        />
        <ToggleRow
          label="Checkout started"
          checked={events.initiateCheckout}
          onChange={(initiateCheckout) => setEvents({ ...events, initiateCheckout })}
        />
      </Card>

      <SaveBar onSave={save} pending={update.isPending} />
    </div>
  );
}
