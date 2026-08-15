"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
import type { StorefrontHomeRow, StorefrontHomeRowSource } from "@/types";
import { MAX_HOME_ROWS, MAX_ROW_LIMIT } from "@/lib/storefront-home-rows";
import { newLocalId } from "@/utils/local-id";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { OptionChip } from "@/ui/components/option-card";
import { SimpleSelect } from "@/ui/components/simple-select";
import { PartLabel } from "@/components/ecommerce/customize/part-group";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import {
  homeRowSummary,
  homeRowDefaultTitle,
} from "@/components/ecommerce/customize/home-row-labels";

const SOURCES: { value: StorefrontHomeRowSource; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "New arrivals" },
  { value: "category", label: "A collection" },
];

/** Even counts only: an odd one leaves a hole in every grid width the shop uses. */
const LIMITS = [4, 6, 8, 10, 12];

const LAYOUTS: { value: NonNullable<StorefrontHomeRow["layout"]>; label: string }[] = [
  { value: "full", label: "Large cards" },
  { value: "compact", label: "Compact cards" },
];

const newRow = (): StorefrontHomeRow => ({
  id: newLocalId("row"),
  source: "category",
  limit: 8,
  layout: "full",
});

/**
 * Edit-in-place panel for the homepage's product rows. Like the slides and
 * collections panels it takes over the Customize rail rather than opening a
 * modal, so the live preview stays visible and repaints as the merchant works —
 * which matters more here than anywhere else in the editor, because a row is
 * only meaningful once you can see which products land in it.
 *
 * It owns no persistence: these rows are the page's draft, so "Done" returns to
 * the rail and the page's one Save ships them.
 */
export function HomeRowsPanel({
  rows,
  setRows,
  collections,
  onClose,
}: {
  rows: StorefrontHomeRow[];
  setRows: (v: StorefrontHomeRow[]) => void;
  /** The store's categories, for the collection picker (both levels). */
  collections: CollectionRowValue[];
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(
    rows.length === 0 ? null : 0,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patch = (i: number, p: Partial<StorefrontHomeRow>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  const remove = (i: number) => {
    setRows(rows.filter((_, idx) => idx !== i));
    setExpanded(null);
  };
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= rows.length) return;
    const next = [...rows];
    [next[i], next[t]] = [next[t], next[i]];
    setRows(next);
    if (expanded === i) setExpanded(t);
    else if (expanded === t) setExpanded(i);
  };
  const add = () => {
    setRows([...rows, newRow()]);
    setExpanded(rows.length);
  };

  // Both levels, the child indented under its parent — a row may point at a
  // sub-collection, and the storefront filters on the right field for it.
  const collectionOptions = collections
    .filter((c) => !c.parentId)
    .flatMap((parent) => [
      { value: parent._id, label: parent.displayName || parent.name },
      ...collections
        .filter((c) => c.parentId === parent._id)
        .map((child) => ({
          value: child._id,
          label: `— ${child.displayName || child.name}`,
        })),
    ]);

  return (
    <Card className="animate-in fade-in slide-in-from-left-6 flex h-full min-h-0 flex-col gap-0 p-0 shadow-none duration-200">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to store parts"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold">Product rows</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {rows.length} / {MAX_HOME_ROWS}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          disabled={rows.length >= MAX_HOME_ROWS}
          onClick={add}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add row
        </Button>
      </div>

      {/* Rows — fills the fixed-height rail; header and footer stay pinned. */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {rows.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-muted-foreground">
            No product rows — your homepage shows the hero and collections only.
          </p>
        ) : (
          rows.map((row, i) => (
            <div key={row.id} className="rounded-lg border">
              <button
                type="button"
                onClick={() => setExpanded(expanded === i ? null : i)}
                aria-expanded={expanded === i}
                className="flex w-full items-center gap-2.5 p-2.5 text-left"
              >
                <span className="w-3 flex-none text-xs tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {row.title?.trim() || homeRowDefaultTitle(row, collections)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {homeRowSummary(row, collections)}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 flex-none text-muted-foreground transition-transform",
                    expanded === i && "rotate-180",
                  )}
                />
              </button>

              {expanded === i && (
                <div className="space-y-3 border-t border-dashed p-2.5">
                  <div className="space-y-1.5">
                    <PartLabel>Show</PartLabel>
                    <div className="flex flex-wrap gap-2">
                      {SOURCES.map((s) => (
                        <OptionChip
                          key={s.value}
                          selected={row.source === s.value}
                          // Clearing `categoryId` off the other two sources keeps
                          // a re-pointed row from carrying a stale collection —
                          // the same rule the save path applies (`trimHomeRows`).
                          onSelect={() =>
                            patch(i, {
                              source: s.value,
                              categoryId:
                                s.value === "category" ? row.categoryId : undefined,
                            })
                          }
                        >
                          {s.label}
                        </OptionChip>
                      ))}
                    </div>
                  </div>

                  {row.source === "category" ? (
                    <div className="space-y-1.5">
                      <PartLabel>Collection</PartLabel>
                      <SimpleSelect
                        size="sm"
                        value={row.categoryId ?? ""}
                        onValueChange={(categoryId) => patch(i, { categoryId })}
                        options={collectionOptions}
                        placeholder="Pick a collection"
                        emptyMessage="No categories yet — create them under Products → Categories"
                      />
                      {!row.categoryId ? (
                        // Said here rather than only at Save: an unfinished row is
                        // dropped on the way out, and a merchant who never sees why
                        // reads that as the row silently not saving.
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                          Pick a collection — this row won&apos;t be saved without one.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <PartLabel>Heading</PartLabel>
                    <Input
                      className="h-8"
                      value={row.title ?? ""}
                      onChange={(e) => patch(i, { title: e.target.value })}
                      placeholder={homeRowDefaultTitle(row, collections)}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank and the shop uses its own wording, translated for
                      each shopper.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <PartLabel>Products</PartLabel>
                    <div className="flex flex-wrap gap-2">
                      {LIMITS.map((n) => (
                        <OptionChip
                          key={n}
                          selected={(row.limit ?? 8) === n}
                          onSelect={() => patch(i, { limit: n })}
                        >
                          {n}
                        </OptionChip>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Up to {MAX_ROW_LIMIT}. Out-of-stock products are never shown
                      here.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <PartLabel>Card size</PartLabel>
                    <div className="flex flex-wrap gap-2">
                      {LAYOUTS.map((l) => (
                        <OptionChip
                          key={l.value}
                          selected={(row.layout ?? "full") === l.value}
                          onSelect={() => patch(i, { layout: l.value })}
                        >
                          {l.label}
                        </OptionChip>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 border-t border-dashed pt-2.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove row
                    </Button>
                    <span className="ml-auto flex items-center text-muted-foreground">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                        className="rounded p-1 hover:text-foreground disabled:opacity-30"
                        aria-label="Move row up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={i === rows.length - 1}
                        onClick={() => move(i, 1)}
                        className="rounded p-1 hover:text-foreground disabled:opacity-30"
                        aria-label="Move row down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-3 border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Saved with the rest of the page.
        </p>
        <Button size="sm" className="ml-auto" onClick={onClose}>
          Done
        </Button>
      </div>
    </Card>
  );
}
