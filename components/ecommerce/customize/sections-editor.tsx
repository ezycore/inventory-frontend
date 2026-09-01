"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import {
  HOME_PRESET_SECTIONS,
  SECTION_IDS,
  SECTION_LABELS,
  type SectionId,
} from "@/lib/storefront-section-ids";
import { sectionInstances } from "@/lib/storefront-templates";
import {
  DEFAULT_SECTION_LIMIT,
  MAX_SECTION_LIMIT,
  MIN_SECTION_LIMIT,
  configFor,
  isConfigurableSection,
  isTagConfigurableSection,
} from "@/lib/storefront-sections";
import type { StoreHomeSection, StoreSectionConfig } from "@/lib/storefront-client";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import { Button } from "@/ui/components/button";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { TagRowConfig } from "@/components/ecommerce/customize/tag-row-config";

/**
 * Customize → Home page → **Sections**: the merchant's homepage as an ordered,
 * toggleable list.
 *
 * This is what makes the editor follow the applied theme rather than showing a
 * fixed six rows — after applying Fashion Shine the list is *its* sections
 * (full-bleed hero, editorial split, …), because a theme now stamps
 * `homepageSections` and this reads the same draft field.
 *
 * Reorder is up/down buttons, not drag-and-drop, and deliberately: a homepage
 * has five or six rows, the list is inside an already-scrolling rail beside a
 * preview iframe, and pointer-drag inside that is both fiddly and unreachable by
 * keyboard. Two buttons are operable by everyone and need no dependency.
 */
export function SectionsEditor({
  sections,
  config,
  collections,
  homeTemplate,
  onChange,
  onConfigChange,
}: {
  sections: StoreHomeSection[];
  /** Per-section config, joined on `key`. Product sections only. */
  config: StoreSectionConfig[];
  /** The merchant's own collections — the only ones a row may point at. */
  collections: CollectionRowValue[];
  /** Drives the "reset" affordance — the default list this template implies. */
  homeTemplate: string;
  onChange: (next: StoreHomeSection[]) => void;
  onConfigChange: (next: StoreSectionConfig[]) => void;
}) {
  // Empty means "never customised", and the storefront falls back to the home
  // template's default list. Showing that list here (rather than an empty box)
  // is what makes the first reorder an edit of what the merchant can actually
  // see, instead of building a page from nothing. Minted through the same
  // deterministic helper the storefront resolver uses, so the keys the merchant
  // starts editing are the keys their page already renders with.
  const effective = sections.length
    ? sections
    : sectionInstances(
        HOME_PRESET_SECTIONS[homeTemplate] ?? HOME_PRESET_SECTIONS.classic,
      );

  // A product section may be added MORE THAN ONCE — that is what `key` is for,
  // and what makes "here is the skin care, here are the devices" expressible.
  // Everything else stays one-per-page: two heroes or two footers is a mistake,
  // not an intent, and there is no config that would tell them apart.
  const used = new Set(effective.map((s) => s.type));
  const available = SECTION_IDS.filter((id) => isConfigurableSection(id) || !used.has(id));

  const setConfig = (key: string, patch: Partial<StoreSectionConfig> | null) => {
    if (patch === null) {
      onConfigChange(config.filter((c) => c.key !== key));
      return;
    }
    const existing = configFor(config, key);
    // A NEW product row needs a source — it is the whole point of configuring
    // one. A tag row does not: `source` means nothing to `age-chips`, and
    // storing "featured" on it would make the saved config read as a product
    // row to anyone debugging the document.
    const seed = isTagConfigurableSection(
      effective.find((s) => s.key === key)?.type ?? "",
    )
      ? { key }
      : { key, source: "featured" as const };
    onConfigChange(
      existing
        ? config.map((c) => (c.key === key ? { ...c, ...patch } : c))
        : [...config, { ...seed, ...patch }],
    );
  };

  /** A unique key for a newly added instance — the API refuses a duplicate. */
  const mintKey = (type: string) => {
    let n = effective.length;
    let key = `${type}-${n}`;
    while (effective.some((s) => s.key === key)) key = `${type}-${++n}`;
    return key;
  };

  const move = (index: number, delta: number) => {
    const next = [...effective];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <ol className="space-y-1.5">
        {effective.map((section, i) => (
          <li key={section.key} className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-2.5 py-2">
            <span className="min-w-0 flex-1 truncate text-xs font-medium">
              {sectionLabel(section, config, collections)}
            </span>
            <div className="flex flex-none items-center gap-0.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Move ${SECTION_LABELS[section.type as SectionId] ?? section.type} up`}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={i === effective.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move ${SECTION_LABELS[section.type as SectionId] ?? section.type} down`}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => {
                  onChange(effective.filter((s) => s.key !== section.key));
                  // Drop the config with the section. Keeping it would be an
                  // orphan the server tolerates but the merchant cannot see or
                  // reach — and it would silently reappear if they re-added a
                  // section that happened to mint the same key.
                  setConfig(section.key, null);
                }}
                aria-label={`Remove ${SECTION_LABELS[section.type as SectionId] ?? section.type}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {isTagConfigurableSection(section.type) ? (
            <TagRowConfig
              config={configFor(config, section.key)}
              onChange={(patch) => setConfig(section.key, patch)}
            />
          ) : isConfigurableSection(section.type) ? (
            <RowConfig
              config={configFor(config, section.key)}
              collections={collections}
              onChange={(patch) => setConfig(section.key, patch)}
            />
          ) : null}
          </li>
        ))}
      </ol>

      {effective.length === 0 ? (
        <PartHint>
          Your homepage has no sections. Add at least one, or your shop opens on
          an empty page.
        </PartHint>
      ) : null}

      {/* The affordance the generic chips below do NOT provide. A collection row
          is built by adding a product section and re-pointing it, which nobody
          discovers: "Featured products" does not read as "an empty row you can
          aim at Skin care". So the common intent gets its own button, and it
          arrives already set to `category` with the picker open. */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 gap-1 text-xs"
        disabled={!collections.length}
        onClick={() => {
          const key = mintKey("featured-grid");
          onChange([...effective, { key, type: "featured-grid" }]);
          onConfigChange([...config, { key, source: "category" }]);
        }}
      >
        <Plus className="h-3 w-3" />
        Add a collection row
      </Button>
      {collections.length ? null : (
        <PartHint>
          You have no collections yet — add one under Collections and it can have
          its own row here.
        </PartHint>
      )}

      {available.length ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Add a section</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  // The API refuses a duplicate key, and a collision here would
                  // surface as a save failure the merchant cannot act on — so
                  // the key is minted against the list, not just its length.
                  onChange([...effective, { key: mintKey(id), type: id }])
                }
              >
                <Plus className="h-3 w-3" />
                {SECTION_LABELS[id]}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <PartHint>
        A section that has nothing to show hides itself — a campaign strip with no
        live campaign, or your promises band before you have written any.
      </PartHint>
    </div>
  );
}

/**
 * The four questions a product row answers: where its products come from,
 * which collection, what the heading says, and how many to show.
 *
 * Absent config is a real state and the default one — the row renders its
 * built-in source, exactly as it did before any of this existed. "Choose" is
 * therefore a real option, not a placeholder: picking it removes the config
 * rather than storing a source that happens to match.
 */
function RowConfig({
  config,
  collections,
  onChange,
}: {
  config: StoreSectionConfig | undefined;
  collections: CollectionRowValue[];
  onChange: (patch: Partial<StoreSectionConfig> | null) => void;
}) {
  const source = config?.source;
  return (
    <div className="space-y-2 border-t px-2.5 py-2">
      <div className="flex items-center gap-2">
        <label className="w-16 flex-none text-[11px] text-muted-foreground">Products</label>
        <select
          className="h-7 min-w-0 flex-1 rounded-md border bg-background px-1.5 text-xs"
          value={config ? source : ""}
          onChange={(e) =>
            e.target.value
              ? onChange({ source: e.target.value as StoreSectionConfig["source"] })
              : onChange(null)
          }
        >
          <option value="">Default for this section</option>
          <option value="featured">Featured products</option>
          <option value="newest">New arrivals</option>
          <option value="category">One collection</option>
        </select>
      </div>

      {source === "category" ? (
        <>
          <div className="flex items-center gap-2">
            <label className="w-16 flex-none text-[11px] text-muted-foreground">Collection</label>
            <select
              className="h-7 min-w-0 flex-1 rounded-md border bg-background px-1.5 text-xs"
              value={config?.categoryId ?? ""}
              onChange={(e) => onChange({ categoryId: e.target.value || undefined })}
            >
              {/* Empty is a half-finished row the API refuses on save. Offered
                  anyway, because the merchant picks the source before they pick
                  the collection and the alternative is auto-selecting one they
                  did not choose. */}
              <option value="">Pick a collection…</option>
              {/* Parent, then ITS children indented — not a flat list. The two
                  levels filter on different fields (`categoryId` vs
                  `subcategoryId`), and a merchant choosing a sub-collection
                  should be able to see that is what they are doing. */}
              {orderCollections(collections).map(({ collection, isChild }) => (
                <option key={collection._id} value={collection._id}>
                  {isChild ? "\u2014 " : ""}
                  {collection.displayName || collection.name}
                </option>
              ))}
            </select>
          </div>
          {config?.categoryId && !collections.some((c) => c._id === config.categoryId) ? (
            // A collection deleted since the row was set up. The row would save
            // (the id is well-formed) and then render nothing, with no clue why —
            // and the server rejects a foreign id with an error the merchant
            // cannot act on either. Say it here, where it can be fixed.
            <p className="text-[11px] text-destructive">
              This collection no longer exists. Pick another, or remove the row.
            </p>
          ) : null}
        </>
      ) : null}

      {config ? (
        <>
          <div className="flex items-center gap-2">
            <label className="w-16 flex-none text-[11px] text-muted-foreground">Heading</label>
            <input
              className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs"
              /* Blank is the BETTER default, not an empty field to fill in: the
                 shop's own wording follows the shopper's language, and a typed
                 heading is one string that cannot be translated. */
              placeholder="Your shop's own wording"
              maxLength={60}
              value={config.title ?? ""}
              onChange={(e) => onChange({ title: e.target.value || undefined })}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 flex-none text-[11px] text-muted-foreground">Show</label>
            <input
              type="number"
              className="h-7 w-20 rounded-md border bg-background px-2 text-xs"
              min={MIN_SECTION_LIMIT}
              max={MAX_SECTION_LIMIT}
              value={config.limit ?? DEFAULT_SECTION_LIMIT}
              onChange={(e) => onChange({ limit: Number(e.target.value) || undefined })}
            />
            <span className="text-[11px] text-muted-foreground">products</span>
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * Collections as the picker shows them: each top-level one followed by its own
 * children. The storefront filters a top-level row on `categoryId` and a child
 * row on `subcategoryId`, so the two are not interchangeable — a flat
 * alphabetical list hides which is which and invites picking the wrong one.
 */
function orderCollections(collections: CollectionRowValue[]) {
  return collections
    .filter((c) => !c.parentId)
    .flatMap((parent) => [
      { collection: parent, isChild: false },
      ...collections
        .filter((c) => c.parentId === parent._id)
        .map((child) => ({ collection: child, isChild: true })),
    ]);
}

/**
 * What a row is called in the list.
 *
 * A configured row is named by its CONTENT, not by the section it happens to be
 * built from: a `featured-grid` pointed at Skin care is "Skin care", because
 * reading "Featured products" three times down a list of three different
 * collection rows tells the merchant nothing about which is which.
 *
 * The section's own label is kept as a suffix so the merchant can still see
 * what shape the row is, which is the one thing the content name loses.
 */
function sectionLabel(
  section: StoreHomeSection,
  config: StoreSectionConfig[],
  collections: CollectionRowValue[],
): string {
  const base = SECTION_LABELS[section.type as SectionId] ?? section.type;
  const own = configFor(config, section.key);
  if (!own) return base;
  const title = own.title?.trim();
  if (title) return `${title} · ${base}`;
  if (own.source === "category") {
    const picked = collections.find((c) => c._id === own.categoryId);
    return picked ? `${picked.displayName || picked.name} · ${base}` : `Pick a collection · ${base}`;
  }
  return base;
}
