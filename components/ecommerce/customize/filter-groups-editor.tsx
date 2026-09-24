"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp, Eye, EyeOff, PanelTopOpen } from "lucide-react";
import {
  groupKind,
  sortGroups,
  type FilterGroupKind,
  type FilterGroupSetting,
  type ResolvedFilterSettings,
} from "@/lib/storefront-filters";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { cn } from "@/ui/lib/utils";

export interface GroupCandidate {
  id: string;
  kind: FilterGroupKind;
  /** The built-in name the storefront shows when the merchant writes none. */
  label: string;
}

/**
 * Order, rename, hide and pre-open the filter groups (plan F8).
 *
 * Lists every group the shop COULD show — the fixed ones, one per variant
 * attribute, one per tag group — in the order the storefront would draw them.
 * A group with nothing to offer on a page still disappears there; this sets
 * where it goes when it does appear.
 *
 * Any edit writes the whole list, in order: a group's position is a setting
 * even when nothing else about it is.
 */
export function FilterGroupsEditor({
  candidates,
  value,
  onChange,
}: {
  candidates: GroupCandidate[];
  value: ResolvedFilterSettings["groups"];
  onChange: (groups: FilterGroupSetting[]) => void;
}) {
  const ordered = sortGroups(candidates, { groups: value });
  const own = new Map(value.map((g) => [g.id, g]));
  // Keep a saved group whose attribute or tag group is gone for now — it may
  // come back, and dropping it here would lose the merchant's rename.
  const orphans = value.filter((g) => !candidates.some((c) => c.id === g.id) && groupKind(g.id));

  const write = (rows: GroupCandidate[], patch?: { id: string; next: Partial<FilterGroupSetting> }) =>
    onChange([
      ...rows.map((c) => {
        const base: FilterGroupSetting = { ...(own.get(c.id) ?? {}), id: c.id };
        return patch?.id === c.id ? { ...base, ...patch.next } : base;
      }),
      ...orphans,
    ]);

  const move = (i: number, by: -1 | 1) => {
    const next = [...ordered];
    const [row] = next.splice(i, 1);
    next.splice(i + by, 0, row);
    write(next);
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      {ordered.map((c, i) => {
        const g = own.get(c.id);
        return (
          <div
            key={c.id}
            className={cn("flex items-center gap-1 border-b p-1.5 last:border-0", g?.hidden && "opacity-60")}
          >
            <Input
              value={g?.label ?? ""}
              placeholder={c.label}
              aria-label={`Name for ${c.label}`}
              maxLength={40}
              onChange={(e) => write(ordered, { id: c.id, next: { label: e.target.value || undefined } })}
              className="h-8 min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`Move ${c.label} up`}
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`Move ${c.label} down`}
              disabled={i === ordered.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", g?.open && "text-primary")}
              aria-label={`Open ${c.label} by default`}
              aria-pressed={!!g?.open}
              title="Open by default"
              onClick={() => write(ordered, { id: c.id, next: { open: !g?.open || undefined } })}
            >
              <PanelTopOpen className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={g?.hidden ? `Show ${c.label}` : `Hide ${c.label}`}
              aria-pressed={!!g?.hidden}
              title={g?.hidden ? "Hidden" : "Shown"}
              onClick={() => write(ordered, { id: c.id, next: { hidden: !g?.hidden || undefined } })}
            >
              {g?.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
