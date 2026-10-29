"use client";
// coding-standard: maintained

import { useId } from "react";
import { Checkbox } from "@ui/components/checkbox";
import type { ImportOptionOffer, ImportOptions } from "@/types/DataTable";

interface ImportOptionsPanelProps {
  offer: ImportOptionOffer;
  value: ImportOptions;
  onChange: (key: keyof ImportOptions, checked: boolean) => void;
  disabled?: boolean;
}

const SWITCHES: { key: keyof ImportOptions; label: string; hint: string }[] = [
  {
    key: "autoCreate",
    label: "Create missing categories, brands and tags",
    hint: "Otherwise a product whose category doesn't exist here yet is not imported. What will be created is listed below before you import.",
  },
  {
    key: "mirrorImages",
    label: "Copy product images into EzyCore",
    hint: "Recommended when moving from another store: the images keep working after the old site is closed. Copying runs in the background and uses your storage.",
  },
];

/**
 * The import dialog's opt-in switches (backend `docs/plan/data-migration.md`
 * D2 + D3). Rendered only for the switches the resource offers.
 */
export function ImportOptionsPanel({ offer, value, onChange, disabled }: ImportOptionsPanelProps) {
  const baseId = useId();
  const shown = SWITCHES.filter((option) => offer[option.key]);
  if (shown.length === 0) return null;

  return (
    <div className="space-y-3 rounded-md border p-3">
      {shown.map((option) => {
        const id = `${baseId}-${option.key}`;
        return (
          <div key={option.key} className="flex items-start gap-2">
            <Checkbox
              id={id}
              className="mt-0.5"
              checked={Boolean(value[option.key])}
              disabled={disabled}
              onCheckedChange={(checked) => onChange(option.key, checked === true)}
            />
            <label htmlFor={id} className="min-w-0 cursor-pointer text-sm">
              <span className="font-medium">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.hint}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
