"use client";
// coding-standard: maintained

import { useEffect, type ReactNode } from "react";
import { useUpdateStorefrontSettings } from "@/services/api";
import type { UpdateStorefrontSettingsDto } from "@/types";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";

export function SaveBar({ onSave, pending }: { onSave: () => void; pending: boolean }) {
  return (
    <div className="flex justify-end">
      <Button onClick={onSave} disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

export function useStoreSettingsSave() {
  const mutation = useUpdateStorefrontSettings();
  return {
    save: (dto: UpdateStorefrontSettingsDto, onSuccess?: () => void) =>
      mutation.mutate(dto, onSuccess ? { onSuccess } : undefined),
    pending: mutation.isPending,
  };
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function ToggleRow({ label, desc, checked, onChange }: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span>
        <span className="text-sm font-medium">{label}</span>
        {desc ? <span className="block text-xs text-muted-foreground">{desc}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/**
 * Tell a collapsible parent whether this form holds unsaved edits — the Marketing tab shows an
 * "Unsaved" dot on a collapsed row so typing is never silently left behind. A no-op when the form
 * is rendered on its own.
 */
export function useReportDirty(
  dirty: boolean,
  onDirtyChange?: (dirty: boolean) => void,
) {
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
}
