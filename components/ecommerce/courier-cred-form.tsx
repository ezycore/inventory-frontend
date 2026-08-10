"use client";
// coding-standard: maintained

import { useState, type ChangeEvent } from "react";
import { Lock, Package, Store } from "lucide-react";
import {
  useCourierPackages,
  useCourierStores,
  type CourierCredField,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Password } from "@/ui/components/input-password";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Spinner } from "@/ui/components/spinner";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";
import { CourierRemoteField } from "./courier-remote-field";

const MODE_OPTIONS = [
  { label: "Sandbox", value: "sandbox" },
  { label: "Live", value: "live" },
];

interface CourierCredFormProps {
  provider: string;
  providerLabel: string;
  fields: CourierCredField[];
  /** True when editing an already-configured courier (drives the "unchanged" hints). */
  configured: boolean;
  defaultMode: string;
  defaultEnabled: boolean;
  saving: boolean;
  onSubmit: (payload: {
    credentials?: Record<string, string>;
    mode: string;
    enabled: boolean;
  }) => void;
  /** Present only when editing — a fresh connect has nothing to cancel back to. */
  onCancel?: () => void;
}

/**
 * The credential entry form for a single courier. Only non-empty fields are sent,
 * so editing a configured courier can change one field without wiping the rest
 * (the backend merges partial credentials over the stored blob).
 */
export function CourierCredForm({
  provider,
  providerLabel,
  fields,
  configured,
  defaultMode,
  defaultEnabled,
  saving,
  onSubmit,
  onCancel,
}: CourierCredFormProps) {
  const stores = useCourierStores();
  const packages = useCourierPackages();
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [mode, setMode] = useState(defaultMode);
  const [enabled, setEnabled] = useState(defaultEnabled);

  const setField = (key: string, value: string) =>
    setCreds((c) => ({ ...c, [key]: value }));

  // A credential field the provider can populate from a list (Pathao pickup
  // stores, eCourier packages) — rendered as a load-then-pick dropdown.
  const remoteFieldFor = (key: string) => {
    if (provider === "pathao" && key === "storeId") {
      return {
        onLoad: () => stores.mutate(provider),
        loading: stores.isPending,
        placeholder: configured ? "Store ID (unchanged)" : "Select a pickup store",
        loadLabel: "Load stores",
        icon: <Store />,
        options: (stores.data?.data ?? []).map((s) => ({
          label: `${s.name} · ${s.id}`,
          value: String(s.id),
        })),
      };
    }
    if (provider === "ecourier" && key === "packageCode") {
      return {
        onLoad: () => packages.mutate(provider),
        loading: packages.isPending,
        placeholder: configured ? "Package (unchanged)" : "Select a package",
        loadLabel: "Load packages",
        icon: <Package />,
        options: (packages.data?.data ?? []).map((p) => ({
          label: p.charge != null ? `${p.name} · ${p.charge}` : p.name,
          value: p.code,
        })),
      };
    }
    return null;
  };

  const save = () => {
    const credentials = Object.fromEntries(
      Object.entries(creds).filter(([, v]) => v.trim() !== ""),
    );
    onSubmit({
      credentials: Object.keys(credentials).length ? credentials : undefined,
      mode,
      enabled,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {configured
          ? "Update only the fields you want to change. Leave a field blank to keep its current value."
          : `Enter your ${providerLabel} API credentials. You can test the connection before enabling it.`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const remote = remoteFieldFor(f.key);
          const id = `${provider}-${f.key}`;
          // Shared by both branches below — a secret only differs by masking.
          const fieldProps = {
            id,
            value: creds[f.key] ?? "",
            placeholder: configured
              ? f.secret
                ? "•••••••• (unchanged)"
                : `${f.label} (unchanged)`
              : f.label,
            onChange: (e: ChangeEvent<HTMLInputElement>) =>
              setField(f.key, e.target.value),
          };
          return (
            <div
              key={f.key}
              className={cn("flex flex-col gap-1.5", remote && "sm:col-span-2")}
            >
              <Label htmlFor={id} className="text-xs text-muted-foreground">
                {f.label}
                {f.secret && <Lock className="size-3 text-muted-foreground/70" />}
              </Label>

              {remote ? (
                <CourierRemoteField
                  id={id}
                  value={creds[f.key] ?? ""}
                  onChange={(v) => setField(f.key, v)}
                  onLoad={remote.onLoad}
                  loading={remote.loading}
                  options={remote.options}
                  placeholder={remote.placeholder}
                  loadLabel={remote.loadLabel}
                  icon={remote.icon}
                />
              ) : f.secret ? (
                <Password {...fieldProps} autoComplete="off" />
              ) : (
                <Input {...fieldProps} type="text" />
              )}
            </div>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5 shrink-0" />
        Encrypted with AES-256 at rest. Secrets are never displayed again after
        saving.
      </p>

      <div className="flex flex-wrap items-center gap-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${provider}-mode`} className="text-xs text-muted-foreground">
            Environment
          </Label>
          <SimpleSelect
            id={`${provider}-mode`}
            value={mode}
            onValueChange={setMode}
            options={MODE_OPTIONS}
            className="w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`${provider}-enable`}
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <Label htmlFor={`${provider}-enable`} className="text-xs text-muted-foreground">
            Enable now
          </Label>
        </div>
        <span className="flex-1" />
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button size="sm" onClick={save} disabled={saving}>
          {saving && <Spinner />}
          {configured ? "Save changes" : "Save & connect"}
        </Button>
      </div>
    </div>
  );
}
