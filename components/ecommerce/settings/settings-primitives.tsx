"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { useUpdateStorefrontSettings } from "@/services/api";
import type { UpdateStorefrontSettingsDto } from "@/types";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";

/**
 * The pieces every Store Settings tab is built from. Extracted when the settings
 * page was split (it had grown to 939 lines); each tab now owns a file and shares
 * these, rather than the page owning all seven tabs plus their primitives.
 */

export type Option = { label: string; value: string };

/** A labelled form row. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/** Label (+ optional description) on the left, a switch on the right. */
export function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span>
        <span className="text-sm font-medium">{label}</span>
        {desc && (
          <span className="block text-xs text-muted-foreground">{desc}</span>
        )}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function SaveBar({
  onSave,
  pending,
}: {
  onSave: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex justify-end">
      <Button onClick={onSave} disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

/**
 * The one mutation every tab saves through. Each tab sends only its own slice of
 * the settings document, so a partial DTO is the norm here, not an omission.
 */
export function useSave() {
  const m = useUpdateStorefrontSettings();
  return {
    save: (dto: UpdateStorefrontSettingsDto) => m.mutate(dto),
    pending: m.isPending,
  };
}
