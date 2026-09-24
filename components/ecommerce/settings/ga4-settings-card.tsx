"use client";
// coding-standard: maintained

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useGetGa4Settings, useUpdateGa4Settings } from "@/services/api";
import type { Ga4Settings } from "@/types/api";
import { Input } from "@/ui/components/input";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import { Field, SaveBar, ToggleRow, useReportDirty } from "./settings-form-shared";

/**
 * Google Analytics 4 (backend `docs/plan/storefront-ga4.md`).
 *
 * Takes one public id and a switch. EzyCore renders no GA4 data — the merchant reads their own
 * property — so the card's job is to take the id, catch the two ways merchants get it wrong
 * (an old `UA-` id, a pasted label), and say plainly what GA4 revenue means.
 */

const GA4_URL = "https://analytics.google.com/";

/** Mirrors the backend's `measurementIdProblem` so the merchant hears it before pressing Save.
 *  The server re-checks; this is only the early answer. */
const measurementIdHint = (id: string): string | undefined => {
  if (!id) return undefined;
  if (id.startsWith("UA-")) {
    return "That is a Universal Analytics id, which no longer collects data. Use the G- Measurement ID from your GA4 web stream.";
  }
  if (!/^G-[A-Z0-9]+$/.test(id)) {
    return "A Measurement ID looks like G-XXXXXXXXXX.";
  }
  return undefined;
};

export function Ga4SettingsCard({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { data: settings, isLoading } = useGetGa4Settings();
  if (isLoading || !settings) return <Skeleton className="h-64 w-full" />;
  return <Ga4SettingsForm settings={settings} onDirtyChange={onDirtyChange} />;
}

function Ga4SettingsForm({
  settings,
  onDirtyChange,
}: {
  settings: Ga4Settings;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const update = useUpdateGa4Settings();
  const [enabled, setEnabled] = useState(settings.enabled);
  // Upper-cased as typed: a transform of the keystroke, never a re-parse of the field's own value,
  // so every character stays typeable.
  const [measurementId, setMeasurementId] = useState(settings.measurementId ?? "");

  const trimmed = measurementId.trim();
  const hint = measurementIdHint(trimmed);
  useReportDirty(
    enabled !== settings.enabled || trimmed !== (settings.measurementId ?? ""),
    onDirtyChange,
  );

  const save = () => update.mutate({ enabled, measurementId: trimmed });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Count visitors, see where they came from, and measure sales from Google Ads — in your own
        Google Analytics account.
      </p>

      <ToggleRow
        label="Enable Google Analytics"
        desc="Off by default. Nothing is sent until you turn this on and save a Measurement ID."
        checked={enabled}
        onChange={setEnabled}
      />

      <Separator />

      <Field label="Measurement ID">
        <Input
          value={measurementId}
          onChange={(e) => setMeasurementId(e.target.value.toUpperCase())}
          placeholder="G-XXXXXXXXXX"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!hint}
        />
        {hint ? (
          <p className="pt-1 text-xs text-destructive">{hint}</p>
        ) : (
          <p className="pt-1 text-xs text-muted-foreground">
            In{" "}
            <a
              href={GA4_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-medium underline"
            >
              Google Analytics <ExternalLink className="size-3" />
            </a>
            : <strong>Admin</strong> → <strong>Data streams</strong> → your web stream. The ID
            starts with G-.
          </p>
        )}
      </Field>

      {settings.ready ? (
        <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          Visits show in GA4&apos;s <strong>Realtime</strong> report within minutes; the other
          reports can take a day or two. Revenue in GA4 is what shoppers paid for products —
          delivery charges are reported separately as shipping, so GA4 revenue is lower than your
          order totals by the delivery charge.
        </p>
      ) : null}

      <SaveBar onSave={save} pending={update.isPending} />
    </div>
  );
}
