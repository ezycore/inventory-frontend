"use client";
// coding-standard: maintained

import { Pencil } from "lucide-react";
import { Button } from "@/ui/components/button";
import { OptionChip } from "@/ui/components/option-card";
import {
  PartBlock,
  PartHint,
  PartLabel,
} from "@/components/ecommerce/customize/part-group";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { resolveHomeCollections } from "@/lib/storefront-templates";
import type { StorefrontHomeCollections } from "@/types";

/**
 * Collections — which categories the shop lists, in what order, and how their
 * product pages look. The listing layout and the pagination mode live here
 * rather than under a separate "Collection page" heading because a merchant
 * thinking about their category pages is thinking about one thing.
 */
export function CollectionsPart({
  draft,
  patch,
  patchTemplate,
  onManageCollections,
}: {
  onManageCollections: () => void;
} & Pick<CustomizeDraftApi, "draft" | "patch" | "patchTemplate">) {
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

      <PartBlock
        label="On the homepage"
        hint="How the collections row is laid out under the hero. Phones always show two per row, whatever you pick here."
      >
        <HomeCollectionsField
          value={draft.homeCollections}
          onChange={(homeCollections) => patch({ homeCollections })}
        />
      </PartBlock>
    </>
  );
}

const LAYOUTS: {
  value: NonNullable<StorefrontHomeCollections["layout"]>;
  label: string;
}[] = [
  { value: "strip", label: "Scrolling strip" },
  { value: "grid", label: "Grid" },
];

const ALIGNMENTS: {
  value: NonNullable<StorefrontHomeCollections["align"]>;
  label: string;
}[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const COLUMN_CHOICES = [2, 3, 4, 5, 6];

/**
 * Layout / columns / alignment for the homepage collections row.
 *
 * Columns only appear under `grid`: a strip scrolls, so it has no column count
 * to set, and a disabled-but-visible row of numbers would only invite the
 * question of why it does nothing.
 */
function HomeCollectionsField({
  value,
  onChange,
}: {
  value: StorefrontHomeCollections;
  onChange: (next: StorefrontHomeCollections) => void;
}) {
  const { layout, columns, align } = resolveHomeCollections(value);
  const patch = (p: Partial<StorefrontHomeCollections>) =>
    onChange({ ...value, ...p });

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        {LAYOUTS.map((l) => (
          <OptionChip
            key={l.value}
            selected={layout === l.value}
            onSelect={() => patch({ layout: l.value })}
          >
            {l.label}
          </OptionChip>
        ))}
      </div>

      {layout === "grid" ? (
        <div className="space-y-1.5">
          <PartLabel>Collections per row</PartLabel>
          <div className="flex flex-wrap gap-2">
            {COLUMN_CHOICES.map((n) => (
              <OptionChip
                key={n}
                selected={columns === n}
                onSelect={() => patch({ columns: n })}
              >
                {n}
              </OptionChip>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <PartLabel>{layout === "grid" ? "Align in column" : "Align row"}</PartLabel>
        <div className="flex flex-wrap gap-2">
          {ALIGNMENTS.map((a) => (
            <OptionChip
              key={a.value}
              selected={align === a.value}
              onSelect={() => patch({ align: a.value })}
            >
              {a.label}
            </OptionChip>
          ))}
        </div>
      </div>
    </div>
  );
}
