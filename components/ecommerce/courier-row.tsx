"use client";
// coding-standard: maintained

import { useState } from "react";
import { Check, ChevronDown, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import {
  useDeleteCourier,
  useTestCourier,
  useUpsertCourier,
  type CourierConfigEntry,
  type CourierCredField,
} from "@/services/api";
import { InfoField } from "@/components/shared/info-field";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/components/collapsible";
import { Spinner } from "@/ui/components/spinner";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";
import { CourierCredForm } from "./courier-cred-form";

const PROVIDER_META: Record<
  string,
  { label: string; initial: string; tint: string }
> = {
  pathao: {
    label: "Pathao",
    initial: "P",
    tint: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  steadfast: {
    label: "Steadfast",
    initial: "S",
    tint: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
  ecourier: {
    label: "eCourier",
    initial: "e",
    tint: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  },
};

/**
 * One collapsible courier in the settings list. Collapsed, it shows status at a
 * glance and a quick enable/disable toggle; expanded, a configured courier shows
 * a summary + Test/Edit/Remove, while an unconfigured one shows the connect form.
 */
export function CourierRow({
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
  const test = useTestCourier();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const configured = !!entry?.configured;
  const enabled = !!entry?.enabled;
  const mode = entry?.mode ?? "live";
  const meta = PROVIDER_META[provider] ?? {
    label: provider,
    initial: provider.charAt(0).toUpperCase(),
    tint: "bg-muted text-muted-foreground",
  };

  const submit = (payload: {
    credentials?: Record<string, string>;
    mode: string;
    enabled: boolean;
  }) => {
    upsert.mutate(
      { provider, ...payload },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleRemove = () =>
    remove.mutate(provider, {
      onSuccess: () => {
        setEditing(false);
        setOpen(false);
      },
    });

  const sub = !configured
    ? "Not connected"
    : enabled
      ? "Connected · active"
      : "Connected · not enabled";

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "rounded-lg border bg-card transition-colors",
        open && "border-border/80 shadow-sm",
      )}
    >
      <div className="flex items-center gap-2 p-2.5">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold",
                meta.tint,
              )}
            >
              {meta.initial}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold leading-tight">
                {meta.label}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {sub}
              </span>
            </span>
            {/* The chips take their own line under the name on a phone: inline
                beside the switch and the chevron they need ~437px, so every
                `shrink-0` sibling overflowed the row and overlapped. The left
                pad lines them up with the label, past the 40px logo + gap. */}
            <span className="flex w-full shrink-0 items-center gap-1.5 pl-[3.25rem] sm:ml-auto sm:w-auto sm:pl-0">
              {configured && <ModeChip mode={mode} />}
              <StatusChip configured={configured} enabled={enabled} />
            </span>
          </button>
        </CollapsibleTrigger>

        <div className="flex shrink-0 items-center gap-1">
          {configured ? (
            <Switch
              checked={enabled}
              disabled={upsert.isPending}
              onCheckedChange={(next) => upsert.mutate({ provider, mode, enabled: next })}
              aria-label={`Enable ${meta.label}`}
            />
          ) : (
            !open && (
              <Button size="sm" onClick={() => setOpen(true)}>
                Connect
              </Button>
            )
          )}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Toggle details">
              <ChevronDown
                className={cn("transition-transform", open && "rotate-180")}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        <div className="px-3 pb-4 pt-1 sm:pl-16">
          {configured && !editing ? (
            <ConfiguredDetail
              mode={mode}
              enabled={enabled}
              testing={test.isPending}
              tested={test.isSuccess}
              failed={test.isError}
              removing={remove.isPending}
              onTest={() => test.mutate({ provider })}
              onEdit={() => setEditing(true)}
              onRemove={handleRemove}
            />
          ) : (
            <CourierCredForm
              provider={provider}
              providerLabel={meta.label}
              fields={fields}
              configured={configured}
              defaultMode={mode}
              defaultEnabled={enabled}
              saving={upsert.isPending}
              onSubmit={submit}
              onCancel={configured ? () => setEditing(false) : undefined}
            />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ModeChip({ mode }: { mode: string }) {
  const live = mode === "live";
  return (
    <Badge
      variant="outline"
      className={cn(
        live
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
          : "text-muted-foreground",
      )}
    >
      {live ? "Live" : "Sandbox"}
    </Badge>
  );
}

function StatusChip({
  configured,
  enabled,
}: {
  configured: boolean;
  enabled: boolean;
}) {
  if (!configured) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not connected
      </Badge>
    );
  }
  if (enabled) {
    return (
      <Badge className="gap-1.5 border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        <span className="size-1.5 rounded-full bg-current" />
        Active
      </Badge>
    );
  }
  return (
    <Badge className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
      <span className="size-1.5 rounded-full bg-current" />
      Configured · Off
    </Badge>
  );
}

function ConfiguredDetail({
  mode,
  enabled,
  testing,
  tested,
  failed,
  removing,
  onTest,
  onEdit,
  onRemove,
}: {
  mode: string;
  enabled: boolean;
  testing: boolean;
  tested: boolean;
  failed: boolean;
  removing: boolean;
  onTest: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <InfoField label="Environment" value={mode === "live" ? "Live" : "Sandbox"} />
        <InfoField label="Connection" value={enabled ? "Enabled" : "Disabled"} />
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" />
        Credentials are stored encrypted and can&apos;t be shown. Use Edit to
        replace them.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onTest} disabled={testing}>
          {testing ? <Spinner /> : <Check />}
          Test connection
        </Button>
        {!testing && tested && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <Check className="size-3.5" /> Connection OK
          </span>
        )}
        {!testing && failed && (
          <span className="text-xs font-medium text-destructive">
            Test failed — check credentials
          </span>
        )}
        <span className="flex-1" />
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil />
          Edit credentials
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={removing}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {removing ? <Spinner /> : <Trash2 />}
          Remove
        </Button>
      </div>
    </div>
  );
}
