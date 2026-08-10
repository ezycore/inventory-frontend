"use client";
// coding-standard: maintained

import { useState } from "react";
import {
  useGetStorefrontSettings,
  useUpdateStorefrontSettings,
} from "@/services/api";
import {
  DEFAULT_ORDER_STATUS_LABELS,
  RENAMEABLE_ORDER_STATUSES,
} from "@/lib/order-status";
import type { AdminOrderStatusLabels } from "@/types";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Skeleton } from "@/ui/components/skeleton";

const MAX_LABEL = 24;

/**
 * Rename the order pipeline steps for this organization.
 *
 * Each row shows the built-in step name and **what the system actually does at
 * that step**, because the name is the only thing being changed — a merchant who
 * renames "Shipped" without knowing it books the Sale will attach their word to
 * the wrong moment in their own process.
 *
 * Admin-panel only, and the copy says so plainly: shoppers keep seeing the
 * built-in wording on the tracking page and in their order emails and SMS, which
 * are written per language and per event and cannot take a single merchant string.
 */
export function OrderStepLabelsSettings() {
  const { data: settings, isLoading } = useGetStorefrontSettings();
  const update = useUpdateStorefrontSettings();

  if (isLoading || !settings) return <Skeleton className="h-96 w-full" />;

  return (
    <OrderStepLabelsForm
      initial={settings.adminStatusLabels ?? {}}
      pending={update.isPending}
      onSave={(adminStatusLabels) => update.mutate({ adminStatusLabels })}
    />
  );
}

function OrderStepLabelsForm({
  initial,
  pending,
  onSave,
}: {
  initial: AdminOrderStatusLabels;
  pending: boolean;
  onSave: (labels: AdminOrderStatusLabels) => void;
}) {
  const [labels, setLabels] = useState<AdminOrderStatusLabels>(initial);

  const setLabel = (status: keyof AdminOrderStatusLabels, value: string) =>
    setLabels((prev) => ({ ...prev, [status]: value }));

  // The whole block is replaced on save (PATCH semantics), so send every key and
  // let a blank one mean "back to the built-in label".
  const save = () =>
    onSave(
      Object.fromEntries(
        RENAMEABLE_ORDER_STATUSES.map(({ status }) => [
          status,
          labels[status]?.trim() ?? "",
        ]),
      ),
    );

  const reset = () => setLabels({});

  return (
    <div className="space-y-5">
      <Card className="space-y-1 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Order step names</h3>
        <p className="text-xs text-muted-foreground">
          Rename the pipeline steps to match how your team talks about an order.
          This changes the admin panel only — your customers keep seeing the
          standard wording on their tracking page and in their order emails and
          SMS. Leave a field blank to use the default.
        </p>
      </Card>

      <Card className="divide-y p-0 shadow-none">
        {RENAMEABLE_ORDER_STATUSES.map(({ status, effect }) => {
          const fallback = DEFAULT_ORDER_STATUS_LABELS[status];
          return (
            <div
              key={status}
              className="grid gap-3 p-5 sm:grid-cols-[1fr_16rem] sm:items-start"
            >
              <div className="space-y-1">
                <Label className="text-sm font-medium">{fallback}</Label>
                <p className="text-xs text-muted-foreground">{effect}</p>
              </div>
              <div className="space-y-1.5">
                <Input
                  value={labels[status] ?? ""}
                  maxLength={MAX_LABEL}
                  placeholder={fallback}
                  onChange={(e) => setLabel(status, e.target.value)}
                />
                <p className="text-right text-[11px] text-muted-foreground">
                  {(labels[status] ?? "").length}/{MAX_LABEL}
                </p>
              </div>
            </div>
          );
        })}
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={reset} disabled={pending}>
          Reset to defaults
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
