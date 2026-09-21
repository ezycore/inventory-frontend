"use client";
// coding-standard: maintained

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import {
  useReorderCollections,
  useStorefrontCollections,
  useUpdateCollection,
} from "@/services/api";
import { resolveHeaderMenu } from "@/lib/storefront-templates";
import { cn } from "@/ui/lib/utils";
import {
  CollectionRow,
  toRowValue,
} from "@/components/ecommerce/collections/collection-row";
import { CollectionSeoFields } from "@/components/ecommerce/collections/collection-seo-fields";
import { useLiveStoreSettings } from "@/components/ecommerce/use-live-store-settings";

/**
 * Catalog → Collections: the full-width home for the storefront category
 * overlay (listed / display name / order). Saves each field as you touch it —
 * the Customize collections panel is the in-place shortcut and drafts instead.
 *
 * Collections drive the homepage chips and product filters regardless of the
 * header, so the banner spells out whether the header is currently using them.
 */
export function CollectionsTab() {
  const { data: collections, isLoading } = useStorefrontCollections();
  // The live header, which a store on the builder keeps on its Site.
  const { data: settings } = useLiveStoreSettings();
  const updateCollection = useUpdateCollection();
  const reorder = useReorderCollections();
  // Display-name edits are local until blur, so typing doesn't fire a PATCH per keystroke.
  const [edits, setEdits] = useState<Record<string, string>>({});
  // Same policy for the two SEO fields, keyed `<id>:title` / `<id>:description`.
  const [seoEdits, setSeoEdits] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Loading collections…
      </div>
    );
  }

  const items = collections ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No categories yet. Create categories under Products → Categories; they
        appear here as storefront collections.
      </div>
    );
  }

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((c) => c._id));
  };

  const usedByHeader =
    resolveHeaderMenu(settings?.templates, (settings?.nav?.header ?? []).length > 0) ===
    "collections";
  const listedCount = items.filter((c) => c.storefront?.isListed !== false).length;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-start gap-2.5 rounded-lg border p-3 text-sm",
          usedByHeader
            ? "bg-primary/5"
            : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
        )}
      >
        <Info className="mt-0.5 h-4 w-4 flex-none" />
        <div className="min-w-0 flex-1">
          {usedByHeader ? (
            <>
              <div className="font-medium">
                These collections are your store header.
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Header menu is set to Collections, so the {listedCount} listed
                below appear as top links in this order. They also power the
                homepage chips and product filters.
              </p>
            </>
          ) : (
            <>
              <div className="font-medium">
                Your header uses a custom menu, so these don&apos;t appear in it.
              </div>
              <p className="mt-0.5 text-xs opacity-90">
                Collections still power the homepage category chips and the
                product filters. To put them back in the header, set Header menu
                to Collections.
              </p>
            </>
          )}
        </div>
        <Link
          href="/ecommerce/customize?part=header"
          className="flex flex-none items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Customize → Header
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        Choose which categories appear as collections on your store, set their
        display name, and put them in order.
      </p>

      <div className="overflow-hidden rounded-lg border bg-card">
        {items.map((c, i) => {
          const row = toRowValue(c);
          const seoTitle = seoEdits[`${c._id}:title`] ?? row.seoTitle;
          const seoDescription =
            seoEdits[`${c._id}:description`] ?? row.seoDescription;
          const setSeo = (key: "title" | "description") => (v: string) =>
            setSeoEdits((e) => ({ ...e, [`${c._id}:${key}`]: v }));

          return (
            <CollectionRow
              key={c._id}
              value={{ ...row, displayName: edits[c._id] ?? row.displayName }}
              isFirst={i === 0}
              isLast={i === items.length - 1}
              disabled={reorder.isPending}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onDisplayNameChange={(v) =>
                setEdits((e) => ({ ...e, [c._id]: v }))
              }
              onDisplayNameBlur={() => {
                const next = (edits[c._id] ?? row.displayName).trim();
                if (next !== row.displayName) {
                  updateCollection.mutate({ id: c._id, displayName: next });
                }
              }}
              onToggleListed={(isListed) =>
                updateCollection.mutate({ id: c._id, isListed })
              }
            >
              <CollectionSeoFields
                name={row.displayName || row.name}
                title={seoTitle}
                description={seoDescription}
                onTitleChange={setSeo("title")}
                onDescriptionChange={setSeo("description")}
                onCommit={() => {
                  // Only send what moved: a PATCH carrying an unchanged field is
                  // harmless but a blur on an untouched input would still fire one.
                  const title = seoTitle.trim();
                  const description = seoDescription.trim();
                  if (
                    title === row.seoTitle &&
                    description === row.seoDescription
                  ) {
                    return;
                  }
                  updateCollection.mutate({
                    id: c._id,
                    seoTitle: title,
                    seoDescription: description,
                  });
                }}
              />
            </CollectionRow>
          );
        })}
      </div>
    </div>
  );
}
