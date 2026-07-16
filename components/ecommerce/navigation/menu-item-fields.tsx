"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { NavLinkType, StorefrontMenuItem } from "@/types";
import { Input } from "@/ui/components/input";
import { SimpleSelect } from "@/ui/components/simple-select";

export type NavOption = { label: string; value: string };

export const newMenuItem = (): StorefrontMenuItem => ({
  label: "New link",
  type: "url",
  value: "",
});

const TYPE_OPTIONS: NavOption[] = [
  { label: "Category", value: "category" },
  { label: "Page", value: "page" },
  { label: "URL", value: "url" },
];

/** Label + target-type + target-value fields for one header menu link. */
export function LinkFields({
  item,
  categoryOptions,
  pageOptions,
  onChange,
}: {
  item: StorefrontMenuItem;
  categoryOptions: NavOption[];
  pageOptions: NavOption[];
  onChange: (patch: Partial<StorefrontMenuItem>) => void;
}) {
  // Label spans its own row: this lives in the 380px Customize rail, where a
  // three-across grid squeezes every field under ~70px ("New link 1" → "New li").
  return (
    <div className="grid flex-1 grid-cols-[110px_minmax(0,1fr)] gap-2">
      <Input
        value={item.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Label"
        className="col-span-2 h-8"
        aria-label="Link label"
      />
      <SimpleSelect
        value={item.type}
        onValueChange={(v) => onChange({ type: v as NavLinkType, value: "" })}
        options={TYPE_OPTIONS}
        className="h-8"
      />
      {item.type === "url" ? (
        <Input
          value={item.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="/path or https://…"
          className="h-8"
          aria-label="Link URL"
        />
      ) : (
        <SimpleSelect
          value={item.value}
          onValueChange={(v) => onChange({ value: v })}
          options={item.type === "category" ? categoryOptions : pageOptions}
          placeholder={`Select ${item.type}`}
          className="h-8"
        />
      )}
    </div>
  );
}

/** One top-level menu link plus its single level of sub-items. */
export function MenuItemRow({
  item,
  index,
  count,
  categoryOptions,
  pageOptions,
  onPatch,
  onRemove,
  onMove,
  onAddChild,
  onPatchChild,
  onRemoveChild,
}: {
  item: StorefrontMenuItem;
  index: number;
  count: number;
  categoryOptions: NavOption[];
  pageOptions: NavOption[];
  onPatch: (patch: Partial<StorefrontMenuItem>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onAddChild: () => void;
  onPatchChild: (ci: number, patch: Partial<StorefrontMenuItem>) => void;
  onRemoveChild: (ci: number) => void;
}) {
  const children = item.children ?? [];
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-none flex-col pt-1.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="text-muted-foreground disabled:opacity-30"
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
            className="text-muted-foreground disabled:opacity-30"
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
        <LinkFields
          item={item}
          categoryOptions={categoryOptions}
          pageOptions={pageOptions}
          onChange={onPatch}
        />
        <button
          type="button"
          onClick={onRemove}
          className="flex-none pt-1.5 text-muted-foreground hover:text-red-600"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {children.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 pl-4">
          {children.map((child, ci) => (
            <div key={ci} className="flex items-start gap-2">
              <LinkFields
                item={child}
                categoryOptions={categoryOptions}
                pageOptions={pageOptions}
                onChange={(patch) => onPatchChild(ci, patch)}
              />
              <button
                type="button"
                onClick={() => onRemoveChild(ci)}
                className="flex-none pt-1.5 text-muted-foreground hover:text-red-600"
                aria-label="Remove sub-item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onAddChild}
        className="mt-2 text-xs font-semibold text-primary"
      >
        + Add sub-item
      </button>
    </div>
  );
}
