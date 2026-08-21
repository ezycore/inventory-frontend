"use client";
// coding-standard: maintained

import { OptionChip } from "@/ui/components/option-card";
import {
  PartBlock,
  PartLabel,
} from "@/components/ecommerce/customize/part-group";
import { SectionsEditor } from "@/components/ecommerce/customize/sections-editor";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import {
  resolveSections,
} from "@/lib/storefront-templates";
import {
  HOME_PRESET_SECTIONS,
  isSectionId,
} from "@/lib/storefront-section-ids";
import type { StorefrontHomeCollections } from "@/types";
import { resolveCategoryRowLayout } from "@/components/storefront/home/category-row-layout";

/**
 * The home page: which layout it starts from, the sections themselves, and the
 * styling of the two category sections a merchant can put in that list.
 *
 * **The last two blocks moved here from Collections on 2026-08-18, and the
 * reason is the preview.** Opening a part points the preview at a page that
 * actually shows it (`PART_PAGE`), and Collections points at the collection
 * page — correct for its per-row and pagination settings, and wrong for these
 * two, which style homepage sections. So they sat in a part whose preview could
 * never show them: a merchant changed the collections row or the tile style and
 * watched a page that does not contain either. Browser QA read both as dead
 * controls before noticing they were simply off-screen.
 *
 * Here they are beside the section list they belong to, under a preview that is
 * already pointed at the page they change — and each hint names the section it
 * styles, which is now a row visible directly above it.
 */
export function HomePart({
  draft,
  patch,
  patchTemplate,
  patchHomeTemplate,
}: Pick<
  CustomizeDraftApi,
  "draft" | "patch" | "patchTemplate" | "patchHomeTemplate"
>) {
  const effectiveSections = resolveSections(
    {
      theme: { homepageSections: draft.homepageSections },
      templates: { home: draft.templates.home },
    },
    { isSectionId, presets: HOME_PRESET_SECTIONS },
  );
  const hasCategoryChips = effectiveSections.some(
    (section) => section.type === "category-chips",
  );
  const hasCategoryTiles = effectiveSections.some(
    (section) => section.type === "category-tiles",
  );
  const hasCategoryRow = hasCategoryChips || hasCategoryTiles;
  const categoryRowHint = hasCategoryChips && hasCategoryTiles
    ? "Styles both Category chips and Category photo tiles above. Phones always show two per row in a grid."
    : hasCategoryTiles
      ? "Styles the Category photo tiles section above. Phones always show two per row in a grid."
      : "Styles the Category chips section above. Phones always show two per row in a grid.";

  return (
    <>
      {/* The home page is two questions: which starting layout, and then the
          sections themselves. The picker seeds the list; the editor owns it from
          then on — which is what makes these controls follow whatever theme was
          applied rather than a fixed six rows.

          The seeding is `patchHomeTemplate`, NOT `patchTemplate("home")`: the
          plain template write reaches the shop only as the fallback for an empty
          section list, which no store has, so it left this picker inert. See the
          hook for the whole path. */}
      <PartBlock
        label="Starting layout"
        hint="Replaces the sections below with that layout's own. Your wording, products and collections are untouched."
      >
        <TemplatePicker
          templateKey="home"
          value={draft.templates.home}
          onChange={patchHomeTemplate}
        />
      </PartBlock>

      <PartBlock
        label="Sections"
        hint="Your homepage, top to bottom. Reorder, remove, or add — the preview follows."
      >
        <SectionsEditor
          sections={draft.homepageSections}
          config={draft.sectionConfig}
          collections={draft.collections}
          homeTemplate={draft.templates.home}
          onChange={(homepageSections) => patch({ homepageSections })}
          onConfigChange={(sectionConfig) => patch({ sectionConfig })}
        />
      </PartBlock>

      {hasCategoryRow ? (
        <PartBlock label="Collections row" hint={categoryRowHint}>
          <HomeCollectionsField
            value={draft.homeCollections}
            defaultLayout={hasCategoryTiles ? "grid" : "strip"}
            onChange={(homeCollections) => patch({ homeCollections })}
          />
        </PartBlock>
      ) : (
        <PartBlock label="Category navigation">
          <p className="text-xs leading-snug text-muted-foreground">
            {draft.templates.shell === "rail"
              ? "Categories are already shown in the Page layout sidebar. Switch Page layout to Stacked, then add Category chips or Category photo tiles above to place a row on the home page."
              : "This home page has no category row. Add Category chips or Category photo tiles in Sections above to configure one."}
          </p>
        </PartBlock>
      )}

      {/* A different homepage row from the collections strip above, and only
          rendered when "Category photo tiles" is in the section list — which is
          why the hint names it rather than leaving an owner to wonder why
          nothing moved. */}
      {hasCategoryTiles ? (
        <PartBlock
          label="Category tiles"
          hint="Styles the Category photo tiles section above. Over the photo needs a picture on every category — without one it falls back to a letter tile."
        >
          <TemplatePicker
            templateKey="categoryTiles"
            value={draft.templates.categoryTiles}
            onChange={(v) => patchTemplate("categoryTiles", v)}
          />
        </PartBlock>
      ) : null}
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
  defaultLayout,
  onChange,
}: {
  value: StorefrontHomeCollections;
  defaultLayout: "strip" | "grid";
  onChange: (next: StorefrontHomeCollections) => void;
}) {
  const { layout, columns, align } = resolveCategoryRowLayout(
    value,
    defaultLayout,
  );
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
        <PartLabel>Alignment</PartLabel>
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
