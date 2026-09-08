"use client";
// coding-standard: maintained

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Info, Lock } from "lucide-react";
import {
  useClearMetaToken,
  useGetMetaSettings,
  useTestMetaConnection,
  useUpdateMetaSettings,
} from "@/services/api";
import type { MetaPurchaseTrigger, MetaSettings } from "@/types/api";
import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
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
 * reports the `Purchase` through the Conversions API at the trigger chosen below. The server
 * half is always the purchase path; the browser half is an opt-in extra (Browser events →
 * "Purchase"), and both carry one shared `event_id` so Meta counts one sale.
 *
 * The one thing this card must say out loud is the 48-hour deduplication window — it is the
 * only reason the browser toggle can be the wrong choice, it is invisible until a merchant
 * reconciles their own dashboard, and by then the duplicate conversions cannot be deleted.
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
            What the Pixel reports from the shopper&apos;s browser as they shop.
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

        <Separator />

        <ToggleRow
          label="Purchase (from the browser)"
          desc="Off by default. Sales are always reported from this server; turn this on to send the purchase from the shopper's browser as well."
          checked={events.purchase}
          onChange={(purchase) => setEvents({ ...events, purchase })}
        />
        {events.purchase ? <BrowserPurchaseNotice trigger={trigger} /> : null}
      </Card>

      <SaveBar onSave={save} pending={update.isPending} />
    </div>
  );
}

/**
 * What the merchant is actually choosing when they switch the browser `Purchase` on.
 *
 * Both halves send the same `event_id`, so Meta merges them — **but only when it receives them
 * within 48 hours of each other.** The browser half fires the moment the shopper places the
 * order; the server half fires at the trigger above. So the safety of the pair is entirely a
 * property of the trigger, and the merchant is the only one who knows how fast they work.
 *
 * Stated here, beside the switch, rather than in the help guide: this is the moment the decision
 * is made, and the failure it prevents (double-counted revenue) cannot be undone afterwards —
 * Meta has no purchase-deletion. Deliberately a warning and not a block; a store that confirms
 * within the day is fine on `confirmed`, and only the merchant knows that.
 */
function BrowserPurchaseNotice({ trigger }: { trigger: MetaPurchaseTrigger }) {
  if (trigger === "pending") {
    return (
      <Alert>
        <Info />
        <AlertTitle>Both purchases will be counted as one</AlertTitle>
        <AlertDescription>
          The browser and the server send the same order at the same moment, with the same event
          ID, so Meta merges them into a single purchase. This is the safest pairing.
        </AlertDescription>
      </Alert>
    );
  }
  const gap =
    trigger === "confirmed"
      ? "You confirm orders more than 2 days after they are placed"
      : "Delivery takes more than 2 days";
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>Check this against how fast you work</AlertTitle>
      <AlertDescription>
        The browser sends the purchase when the order is placed, and this server sends it{" "}
        {trigger === "confirmed" ? "when you confirm" : "on delivery"}. Meta merges the two into
        one purchase only if it receives them <strong>within 48 hours of each other</strong>.{" "}
        {gap}, so the sale will be counted twice — and that cannot be removed from Meta
        afterwards. To be certain, either report purchases when the order is placed, or leave
        this switch off.
      </AlertDescription>
    </Alert>
  );
}
