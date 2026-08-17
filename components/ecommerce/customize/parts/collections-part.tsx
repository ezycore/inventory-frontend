"use client";
// coding-standard: maintained

import { Pencil } from "lucide-react";
import { Button } from "@/ui/components/button";
import { OptionChip } from "@/ui/components/option-card";
import { cn } from "@/ui/lib/utils";
import {
  PartBlock,
  PartField,
  PartHint,
  PartLabel,
} from "@/components/ecommerce/customize/part-group";
import {
  TemplatePicker,
  TemplateSegmented,
} from "@/components/ecommerce/customize/parts/template-picker";
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

      {/* One block, two fields: both describe the category page, and as two
          `PartBlock`s they spent 64px of block padding saying so twice. */}
      <PartBlock label="Category pages" hint="Also applies to search results.">
        <PartField label="Products per row">
          <TemplateSegmented
            templateKey="collection"
            label="Products per row"
            value={draft.templates.collection}
            onChange={(v) => patchTemplate("collection", v)}
            glyph={(v) => <ColumnsGlyph value={v} />}
          />
        </PartField>

        <PartField label="Loading more products">
          <TemplateSegmented
            templateKey="pagination"
            label="Loading more products"
            value={draft.templates.pagination}
            onChange={(v) => patchTemplate("pagination", v)}
          />
        </PartField>
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

      {/* The tiles section is a different homepage row from the collections
          strip above — it only renders if "Category tiles" is in Home →
          Sections, which is why the hint says so rather than leaving an owner
          to wonder why nothing moved. */}
      <PartBlock
        label="Category tiles"
        hint="Used by the Category tiles section on the homepage. Over the photo needs a picture on every category — without one it falls back to a letter tile."
      >
        <TemplatePicker
          templateKey="categoryTiles"
          value={draft.templates.categoryTiles}
          onChange={(v) => patchTemplate("categoryTiles", v)}
        />
      </PartBlock>
    </>
  );
}

/**
 * What a category page's grid looks like at each step. `sidebar` draws the
 * filter column that is its actual difference; the other two differ only in how
 * many boxes are in the row, which is what the glyph counts.
 *
 * ⚠ **`sidebar` is a THREE-column grid, not two.** `shop/products/view.tsx`
 * resolves `grid3 || sidebar → sf-grid-3`, so the rail steals width from the
 * page, not a column from the grid. The first version of this glyph drew two
 * boxes, which in a field literally labelled "Products per row" was a wrong
 * answer to the only question it asks.
 */
const COLUMNS_IN_GLYPH: Record<string, number> = {
  "grid-3": 3,
  "grid-4": 4,
  sidebar: 3,
};

function ColumnsGlyph({ value }: { value: string }) {
  const tiles = COLUMNS_IN_GLYPH[value] ?? 3;
  const withRail = value === "sidebar";
  return (
    <span className="flex h-3 w-full gap-[2px]">
      {/* The rail is drawn SOLID against dimmed product tiles, not merely
          narrower. The glyph is ~30px wide, so a 4px rail beside three 6.7px
          tiles reads as four equal bars — i.e. as "4 per row", which is the
          option sitting next to this one. Weight separates them where width
          cannot. */}
      {withRail ? (
        <span className="h-full w-[4px] flex-none rounded-[1px] bg-current" />
      ) : null}
      {Array.from({ length: tiles }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-full flex-1 rounded-[1px] bg-current",
            withRail && "opacity-50",
          )}
        />
      ))}
    </span>
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
