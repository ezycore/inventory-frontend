"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/lib/error-handling";
import { Button } from "@/ui/components/button";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Input } from "@/ui/components/input";
import { couriersApi } from "@/services/api/modules/storefront-orders/api";
import { useResolveLocation } from "@/services/api/modules/storefront-orders/hooks";
import type { AdminStorefrontOrder, CourierLocation } from "@/types/api";

/**
 * One level of a provider's dispatch-location cascade. Mirrors the backend
 * `COURIER_LOCATION_SCHEMAS` (only two location providers exist); the resolver
 * maps an order's courier-neutral district/area to these provider codes.
 */
interface Level {
  key: string;
  label: string;
  input: "select" | "text";
  valueType: "id" | "name";
  dependsOn?: string;
  optional?: boolean;
}

const LEVELS: Record<string, Level[]> = {
  pathao: [
    { key: "city", label: "City", input: "select", valueType: "id" },
    { key: "zone", label: "Zone", input: "select", valueType: "id", dependsOn: "city" },
    { key: "area", label: "Area (optional)", input: "select", valueType: "id", dependsOn: "zone", optional: true },
  ],
  ecourier: [
    { key: "city", label: "City", input: "select", valueType: "name" },
    { key: "thana", label: "Thana", input: "select", valueType: "name", dependsOn: "city" },
    { key: "area", label: "Area", input: "text", valueType: "name" },
  ],
};

const norm = (s?: string) => (s ?? "").trim().toLowerCase();
const matchByName = (opts: CourierLocation[], name?: string) =>
  name ? opts.find((o) => norm(o.name) === norm(name)) : undefined;

/**
 * The ADMIN dispatch-location resolver: maps an order's canonical district/area
 * to a courier's own codes before a consignment can be created. It prefills the
 * cascade by name-matching the canonical address against the provider's live
 * lists, so the common case is one click. Only shown for location providers
 * (Pathao/eCourier) with no saved resolution yet.
 */
export function CourierLocationResolver({
  order,
  provider,
  onResolved,
}: {
  order: AdminStorefrontOrder;
  provider: string;
  onResolved: () => void;
}) {
  const levels = LEVELS[provider] ?? [];
  const resolve = useResolveLocation();
  const district = order.shippingAddress.district;
  const area = order.shippingAddress.area;

  const [values, setValues] = useState<Record<string, string | number>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, CourierLocation[]>>({});
  const [busy, setBusy] = useState(false);
  // Why the top level is empty, when it is empty for a reason. Without this an
  // unreachable courier renders exactly like "this provider has no cities": a
  // dead dropdown, a disabled button and nothing to act on.
  const [loadError, setLoadError] = useState<string | null>(null);
  // Bumped by Retry to re-run the prefill effect. A courier outage is usually
  // transient, so the fix is one click rather than a page reload.
  const [reloadKey, setReloadKey] = useState(0);

  const fetchLevel = async (key: string, parent?: string | number) => {
    try {
      const res = await couriersApi.locations(provider, key, parent);
      const opts = res.data ?? [];
      setOptions((o) => ({ ...o, [key]: opts }));
      return opts;
    } catch (e) {
      setOptions((o) => ({ ...o, [key]: [] }));
      // The api client throws a plain `ApiError` object, not an Error instance —
      // `getErrorMessage` is the helper that unwraps both.
      setLoadError(getErrorMessage(e));
      return [];
    }
  };

  // Load the top level and best-effort prefill the cascade from the canonical
  // district/area whenever the provider (or order) changes.
  useEffect(() => {
    let alive = true;
    setValues({});
    setNames({});
    setOptions({});
    setLoadError(null);
    (async () => {
      setBusy(true);
      const v: Record<string, string | number> = {};
      const n: Record<string, string> = {};
      const cityOpts = await fetchLevel(levels[0]?.key ?? "city");
      const cityMatch = matchByName(cityOpts, district);
      if (cityMatch && levels[1]) {
        v[levels[0].key] = cityMatch.id;
        n[levels[0].key] = cityMatch.name;
        const l2 = levels[1];
        if (l2.input === "select") {
          const l2Opts = await fetchLevel(l2.key, cityMatch.id);
          const m2 = matchByName(l2Opts, area);
          if (m2) {
            v[l2.key] = m2.id;
            n[l2.key] = m2.name;
          }
        }
      }
      // eCourier's area is free text — seed it from the canonical area.
      const textLevel = levels.find((l) => l.input === "text");
      if (textLevel && area) v[textLevel.key] = area;
      if (!alive) return;
      setValues(v);
      setNames(n);
      setBusy(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, order._id, reloadKey]);

  const clearBelow = (
    key: string,
    v: Record<string, string | number>,
    n: Record<string, string>,
  ) => {
    const idx = levels.findIndex((l) => l.key === key);
    for (const l of levels.slice(idx + 1)) {
      delete v[l.key];
      delete n[l.key];
    }
  };

  const pickSelect = async (lvl: Level, rawId: string) => {
    const opt = (options[lvl.key] ?? []).find((o) => String(o.id) === rawId);
    const v = { ...values };
    const n = { ...names };
    v[lvl.key] = lvl.valueType === "id" ? Number(opt?.id ?? rawId) : String(opt?.id ?? rawId);
    n[lvl.key] = opt?.name ?? rawId;
    clearBelow(lvl.key, v, n);
    setValues(v);
    setNames(n);
    // Load the immediate child level's options for the new parent.
    const child = levels.find((l) => l.dependsOn === lvl.key);
    if (child && child.input === "select") await fetchLevel(child.key, v[lvl.key]);
  };

  const requiredMissing = levels
    .filter((l) => !l.optional)
    .some((l) => values[l.key] === undefined || values[l.key] === "");

  const save = () => {
    resolve.mutate(
      { id: order._id, provider, location: values },
      { onSuccess: onResolved },
    );
  };

  return (
    <div className="space-y-2.5 rounded-lg border bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Match{" "}
        <span className="font-semibold text-foreground">
          {[area, district].filter(Boolean).join(", ") || "the address"}
        </span>{" "}
        to {provider === "pathao" ? "Pathao" : "eCourier"} — pre-filled, confirm or adjust.
      </p>
      {loadError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="font-medium underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {levels.map((lvl) => {
        const parentReady = !lvl.dependsOn || !!values[lvl.dependsOn];
        if (lvl.input === "text") {
          return (
            <Input
              key={lvl.key}
              placeholder={lvl.label}
              value={String(values[lvl.key] ?? "")}
              onChange={(e) =>
                setValues((v) => ({ ...v, [lvl.key]: e.target.value }))
              }
            />
          );
        }
        return (
          <SimpleSelect
            key={lvl.key}
            disabled={!parentReady || busy}
            value={values[lvl.key] !== undefined ? String(values[lvl.key]) : ""}
            onValueChange={(val) => pickSelect(lvl, val)}
            options={(options[lvl.key] ?? []).map((o) => ({
              label: o.name,
              value: String(o.id),
            }))}
            placeholder={busy ? "Loading…" : lvl.label}
          />
        );
      })}
      <Button
        size="sm"
        className="w-full"
        disabled={requiredMissing || resolve.isPending}
        onClick={save}
      >
        {resolve.isPending ? "Saving…" : "Save delivery location"}
      </Button>
    </div>
  );
}
