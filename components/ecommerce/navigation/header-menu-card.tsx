"use client";
// coding-standard: maintained

import { LayoutGrid, Menu, Pencil, Plus } from "lucide-react";
import type { HeaderMenuSource } from "@/lib/storefront-client";
import type { StorefrontMenuItem } from "@/types";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import {
  MenuItemRow,
  newMenuItem,
  type NavOption,
} from "@/components/ecommerce/navigation/menu-item-fields";

/**
 * Customize → Navigation → "Header menu": picks what the store header's top
 * links are built from, then edits that source.
 *
 * The source is explicit (`templates.headerMenu`) precisely because it used to
 * be inferred — a non-empty custom menu silently replaced the collections, with
 * nothing in the admin saying so.
 */
const SOURCES: {
  id: HeaderMenuSource;
  label: string;
  desc: string;
  icon: typeof LayoutGrid;
}[] = [
  {
    id: "collections",
    label: "Collections",
    desc: "Your listed categories, in order",
    icon: LayoutGrid,
  },
  {
    id: "custom",
    label: "Custom menu",
    desc: "Links you build, with dropdowns",
    icon: Menu,
  },
];

export function HeaderMenuCard({
  source,
  setSource,
  header,
  setHeader,
  collections,
  categoryOptions,
  pageOptions,
  onManageCollections,
}: {
  source: HeaderMenuSource;
  setSource: (v: HeaderMenuSource) => void;
  header: StorefrontMenuItem[];
  setHeader: (v: StorefrontMenuItem[]) => void;
  collections: CollectionRowValue[];
  categoryOptions: NavOption[];
  pageOptions: NavOption[];
  onManageCollections: () => void;
}) {
  const listed = collections.filter((c) => c.isListed);

  const patchItem = (i: number, patch: Partial<StorefrontMenuItem>) =>
    setHeader(header.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setHeader(header.filter((_, idx) => idx !== i));
  const moveItem = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= header.length) return;
    const next = [...header];
    [next[i], next[t]] = [next[t], next[i]];
    setHeader(next);
  };
  const addChild = (i: number) =>
    setHeader(
      header.map((it, idx) =>
        idx === i ? { ...it, children: [...(it.children ?? []), newMenuItem()] } : it,
      ),
    );
  const patchChild = (i: number, ci: number, patch: Partial<StorefrontMenuItem>) =>
    setHeader(
      header.map((it, idx) =>
        idx === i
          ? {
              ...it,
              children: (it.children ?? []).map((c, cidx) =>
                cidx === ci ? { ...c, ...patch } : c,
              ),
            }
          : it,
      ),
    );
  const removeChild = (i: number, ci: number) =>
    setHeader(
      header.map((it, idx) =>
        idx === i
          ? { ...it, children: (it.children ?? []).filter((_, x) => x !== ci) }
          : it,
      ),
    );

  return (
    <Card className="space-y-3 p-5 shadow-none">
      <div>
        <h3 className="text-sm font-semibold">Header menu</h3>
        <p className="text-xs text-muted-foreground">
          The links across the top of every store page.
        </p>
      </div>

      <div className="text-xs font-medium text-muted-foreground">
        Header menu shows
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SOURCES.map((s) => {
          const active = source === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s.id)}
              aria-pressed={active}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                active ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted/50",
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 flex-none text-primary" />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-1.5 text-xs font-semibold">
                  {s.label}
                  {s.id === "collections" && (
                    <span className="flex-none whitespace-nowrap rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                      {listed.length} listed
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {s.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {source === "collections" ? (
        <div className="space-y-2.5">
          <div className="overflow-hidden rounded-lg border">
            {listed.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">
                No collections are listed, so the header has no links.
              </p>
            ) : (
              listed.map((c, i) => (
                <div
                  key={c._id}
                  className="flex items-center gap-2.5 border-b p-2 text-[13px] last:border-0"
                >
                  <span className="w-3 flex-none text-[10px] tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="truncate font-medium">
                    {c.displayName || c.name}
                  </span>
                  <span className="ml-auto flex-none text-[11px] text-muted-foreground">
                    /{c.slug}
                  </span>
                </div>
              ))
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onManageCollections}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Manage collections
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {header.length === 0 ? (
            <p className="text-sm text-muted-foreground">No menu items yet.</p>
          ) : (
            header.map((item, i) => (
              <MenuItemRow
                key={i}
                item={item}
                index={i}
                count={header.length}
                categoryOptions={categoryOptions}
                pageOptions={pageOptions}
                onPatch={(patch) => patchItem(i, patch)}
                onRemove={() => removeItem(i)}
                onMove={(dir) => moveItem(i, dir)}
                onAddChild={() => addChild(i)}
                onPatchChild={(ci, patch) => patchChild(i, ci, patch)}
                onRemoveChild={(ci) => removeChild(i, ci)}
              />
            ))
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setHeader([...header, newMenuItem()])}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add item
          </Button>
          <div className="space-y-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            <p>
              Your collections still power the homepage category chips and the
              product filters — switching the header to a custom menu only
              changes these top links.
            </p>
            {/* Reachable from here too: the note says collections still matter,
                so don't make picking Collections the only way to manage them. */}
            <button
              type="button"
              onClick={onManageCollections}
              className="font-semibold underline underline-offset-2"
            >
              Manage collections
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
