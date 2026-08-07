"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/ui/components/input";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";

/**
 * One editable collection row — reorder arrows, source name/slug, display-name
 * override, and the Listed toggle.
 *
 * Presentational on purpose: it is shared by Catalog → Collections (which saves
 * each field as you touch it) and the Customize collections panel (which drafts
 * everything behind its own Save), so the save policy stays with the caller.
 * `compact` narrows it for the 380px Customize rail.
 */
export interface CollectionRowValue {
  _id: string;
  name: string;
  slug?: string;
  /** Addressable path. Carried so the Customize preview can link the row. */
  slugPath?: string;
  /** Set on a sub-collection — lets the preview rebuild the two-level tree. */
  parentId?: string | null;
  displayName: string;
  isListed: boolean;
}

export function CollectionRow({
  value,
  isFirst,
  isLast,
  disabled,
  compact,
  onMoveUp,
  onMoveDown,
  onDisplayNameChange,
  onDisplayNameBlur,
  onToggleListed,
}: {
  value: CollectionRowValue;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  compact?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDisplayNameChange: (v: string) => void;
  onDisplayNameBlur?: () => void;
  onToggleListed: (isListed: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        compact
          ? "rounded-lg border p-2 pl-2.5"
          : "border-b p-3 last:border-0",
        compact && !value.isListed && "bg-muted/40",
      )}
    >
      <div className="flex flex-none flex-col">
        <button
          type="button"
          disabled={isFirst || disabled}
          onClick={onMoveUp}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
          aria-label={`Move ${value.name} up`}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={isLast || disabled}
          onClick={onMoveDown}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
          aria-label={`Move ${value.name} down`}
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate font-medium",
            compact && "text-[13px]",
            compact && !value.isListed && "text-muted-foreground",
          )}
        >
          {value.name}
        </div>
        <div className="text-xs text-muted-foreground">/{value.slug}</div>
      </div>

      <Input
        value={value.displayName}
        onChange={(e) => onDisplayNameChange(e.target.value)}
        onBlur={onDisplayNameBlur}
        placeholder={value.name}
        className={cn("h-9 flex-none", compact ? "w-28" : "w-48")}
        aria-label={`Display name for ${value.name}`}
      />

      {compact ? (
        <Switch
          checked={value.isListed}
          disabled={disabled}
          onCheckedChange={onToggleListed}
          aria-label={`List ${value.name} on the store`}
        />
      ) : (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch
            checked={value.isListed}
            disabled={disabled}
            onCheckedChange={onToggleListed}
          />
          Listed
        </label>
      )}
    </div>
  );
}

/** Normalize the API shape into the row's flat, always-defined value. */
export function toRowValue(c: {
  _id: string;
  name: string;
  slug?: string;
  slugPath?: string;
  parentId?: string | null;
  storefront?: { isListed?: boolean; displayName?: string };
}): CollectionRowValue {
  return {
    _id: c._id,
    name: c.name,
    slug: c.slug,
    slugPath: c.slugPath,
    parentId: c.parentId ?? null,
    displayName: c.storefront?.displayName ?? "",
    isListed: c.storefront?.isListed !== false,
  };
}
