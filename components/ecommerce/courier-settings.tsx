"use client";

import { useState } from "react";
import {
  useCouriers,
  useDeleteCourier,
  useUpsertCourier,
  type CourierConfigEntry,
  type CourierCredField,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";

const PROVIDER_LABELS: Record<string, string> = {
  pathao: "Pathao",
  steadfast: "Steadfast",
  ecourier: "eCourier",
};

export function CourierSettings() {
  const { data, isLoading } = useCouriers();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Couriers</CardTitle>
        <CardDescription>
          Connect a delivery partner. Credentials are encrypted and never shown
          again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          Object.keys(data.providers).map((provider) => {
            const entry = data.couriers.find((c) => c.provider === provider);
            return (
              <CourierProviderForm
                key={`${provider}-${entry?.configured ? "configured" : "new"}`}
                provider={provider}
                fields={data.providers[provider]}
                entry={entry}
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function CourierProviderForm({
  provider,
  fields,
  entry,
}: {
  provider: string;
  fields: CourierCredField[];
  entry?: CourierConfigEntry;
}) {
  const upsert = useUpsertCourier();
  const remove = useDeleteCourier();
  const configured = !!entry?.configured;

  const [creds, setCreds] = useState<Record<string, string>>({});
  const [mode, setMode] = useState(entry?.mode ?? "sandbox");
  const [enabled, setEnabled] = useState(entry?.enabled ?? false);

  const save = () => {
    const credentials = Object.fromEntries(
      Object.entries(creds).filter(([, v]) => v.trim() !== ""),
    );
    upsert.mutate({
      provider,
      credentials: Object.keys(credentials).length ? credentials : undefined,
      mode,
      enabled,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">{PROVIDER_LABELS[provider] ?? provider}</p>
        {configured && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            Configured
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {fields.map((f) => (
          <input
            key={f.key}
            type={f.secret ? "password" : "text"}
            placeholder={configured ? `${f.label} (unchanged)` : f.label}
            value={creds[f.key] ?? ""}
            onChange={(e) =>
              setCreds((c) => ({ ...c, [f.key]: e.target.value }))
            }
            className="rounded-md border px-2 py-1 text-sm"
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="rounded-md border px-2 py-1"
        >
          <option value="sandbox">Sandbox</option>
          <option value="live">Live</option>
        </select>
        <Button size="sm" onClick={save} disabled={upsert.isPending}>
          Save
        </Button>
        {configured && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => remove.mutate(provider)}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
