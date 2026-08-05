"use client";
// coding-standard: maintained

import { Pencil } from "lucide-react";
import { Button } from "@/ui/components/button";
import { PartBlock, PartHint } from "@/components/ecommerce/customize/part-group";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import { PagePresetRow } from "@/components/ecommerce/customize/page-preset-row";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Collections — which categories the shop lists, in what order, and how their
 * product pages look. The listing layout and the pagination mode live here
 * rather than under a separate "Collection page" heading because a merchant
 * thinking about their category pages is thinking about one thing.
 */
export function CollectionsPart({
  draft,
  patchTemplate,
  applyPagePreset,
  onManageCollections,
}: {
  onManageCollections: () => void;
} & Pick<CustomizeDraftApi, "draft" | "patchTemplate" | "applyPagePreset">) {
  const listed = draft.collections.filter((c) => c.isListed);

  return (
    <>
      <PartBlock label="Listed collections">
        {draft.collections.length === 0 ? (
          <PartHint>
            No categories yet. Create them under Products → Categories, then come
            back to choose which ones the shop lists.
          </PartHint>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-background">
            {listed.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">
                None of your {draft.collections.length} categories are listed, so
                shoppers can only find products through search.
              </p>
            ) : (
              listed.map((c, i) => (
                <div
                  key={c._id}
                  className="flex items-center gap-2.5 border-b p-2 text-sm last:border-0"
                >
                  <span className="w-3 flex-none text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="truncate font-medium">
                    {c.displayName || c.name}
                  </span>
                  <span className="ml-auto flex-none text-xs text-muted-foreground">
                    /{c.slug}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={draft.collections.length === 0}
          onClick={onManageCollections}
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Rename, reorder or hide
        </Button>
      </PartBlock>

      <PartBlock
        label="Start from"
        hint="Sets the grid and the loading style together — then change either below."
      >
        <PagePresetRow
          pageKey="collection"
          draft={draft}
          onApply={applyPagePreset}
        />
      </PartBlock>

      <PartBlock label="Products per row">
        <TemplatePicker
          templateKey="collection"
          value={draft.templates.collection}
          onChange={(v) => patchTemplate("collection", v)}
        />
      </PartBlock>

      <PartBlock
        label="Loading more products"
        hint="Applies to category pages and search results."
      >
        <TemplatePicker
          templateKey="pagination"
          value={draft.templates.pagination}
          onChange={(v) => patchTemplate("pagination", v)}
        />
      </PartBlock>
    </>
  );
}
