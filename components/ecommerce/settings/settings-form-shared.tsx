"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
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
