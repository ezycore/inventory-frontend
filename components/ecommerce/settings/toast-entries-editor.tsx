"use client";
// coding-standard: maintained

import { Plus, Trash2 } from "lucide-react";
import { selectOptions } from "@/services/api/select-options";
import { Button } from "@/ui/components/button";
import { FuseAdvancedSelect } from "@/ui/components/fuse-advanced-select";
import { Input } from "@/ui/components/input";
import { MAX_TOAST_ENTRIES, type ToastEntry } from "./social-proof-shared";

// A product picker over a whole catalogue must search (CLAUDE.md → "Product pickers").
const PRODUCTS = selectOptions("products", { fields: "_id,name" });

/**
 * The merchant's own toast lines. Each must name a product from the shop — a toast never names
 * something the shop does not sell, and one whose product is later unlisted simply stops showing.
 */
export function ToastEntriesEditor({
  entries,
  onChange,
}: {
  entries: ToastEntry[];
  onChange: (entries: ToastEntry[]) => void;
}) {
  const update = (index: number, patch: Partial<ToastEntry>) =>
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">My entries</p>
        <p className="text-xs text-muted-foreground">
          Entries are shown to shoppers as real purchases. You are responsible for what they say.
        </p>
      </div>
      {entries.map((entry, index) => (
        <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_1.4fr_1fr_auto]">
          <Input aria-label="Name" placeholder="Name, e.g. Karim" maxLength={40} value={entry.name ?? ""} onChange={(e) => update(index, { name: e.target.value })} />
          <Input aria-label="Area" placeholder="Area, e.g. Sylhet" maxLength={60} value={entry.area ?? ""} onChange={(e) => update(index, { area: e.target.value })} />
          <FuseAdvancedSelect
            optionsApi={PRODUCTS}
            mode="single"
            value={entry.productId || undefined}
            placeholder="Choose a product"
            onValueChange={(next) => update(index, { productId: typeof next === "string" ? next : "" })}
          />
          <Input aria-label="Time" placeholder="Time, e.g. 2 hours ago" maxLength={40} value={entry.timeLabel ?? ""} onChange={(e) => update(index, { timeLabel: e.target.value })} />
          <Button type="button" variant="ghost" size="icon" aria-label="Remove entry" onClick={() => onChange(entries.filter((_, i) => i !== index))}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={entries.length >= MAX_TOAST_ENTRIES}
        onClick={() => onChange([...entries, { productId: "" }])}
      >
        <Plus className="size-4" /> Add entry
      </Button>
    </div>
  );
}
