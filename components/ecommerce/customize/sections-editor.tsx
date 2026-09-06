"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import {
  HOME_PRESET_SECTIONS,
  SECTION_IDS,
  SECTION_LABELS,
  SOURCE_LABELS,
  type SectionId,
} from "@/lib/storefront-section-ids";
import { sectionInstances } from "@/lib/storefront-templates";
import {
  DEFAULT_SECTION_LIMIT,
  MAX_SECTION_LIMIT,
  MIN_SECTION_LIMIT,
  configFor,
  isConfigurableSection,
  mergeSectionConfig,
  sectionConfigKind,
} from "@/lib/storefront-sections";
import type { StoreHomeSection, StoreSectionConfig } from "@/lib/storefront-client";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import { Button } from "@/ui/components/button";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { CategoryRowConfig } from "@/components/ecommerce/customize/category-row-config";
import { TagRowConfig } from "@/components/ecommerce/customize/tag-row-config";
import { ProductRowConfig } from "@/components/ecommerce/customize/product-row-config";
import { StoreLinkHint } from "@/components/ecommerce/customize/store-link-hint";

/**
 * What "Add a section" offers.
 *
 * Usually one chip per section id. The product grid is the exception and gets
 * **two**, because the three grids that merged into it were how a merchant
 * expressed "featured" versus "new arrivals" — and "Product grid, then set its
 * source to newest" is not a thing anyone would find. Both chips add the same
 * component; they differ only in the `source` they arrive with, so the choice
 * stays a content decision the merchant can change later without swapping
 * sections.
 */
type AddEntry = {
  /** React key only — a type may appear twice. */
  id: string;
  label: string;
  type: SectionId;
  source?: StoreSectionConfig["source"];
};

const ADD_ENTRIES: AddEntry[] = SECTION_IDS.flatMap((id): AddEntry[] =>
  id === "featured-grid"
    ? [
        { id: "featured-grid:featured", label: SOURCE_LABELS.featured, type: id, source: "featured" as const },
        { id: "featured-grid:newest", label: SOURCE_LABELS.newest, type: id, source: "newest" as const },
      ]
    : [{ id, label: SECTION_LABELS[id], type: id }],
);

/**
 * Where a section appears — the one mobile-specific control on the homepage.
 *
 * **Three states, not two switches.** The announcement bar and the campaign
 * strip each use a pair of switches and have to warn when both are off; a
 * section does not need that state, because "nowhere" is what the Remove button
 * already means. One choice with no invalid combination is the simpler question
 * for a merchant, and it cannot be answered wrong.
 *
 * Page length is the problem this solves. A promises band with five entries is
 * a five-row stack on a phone, and an editorial split spends most of a screen
 * on one photograph before any product — both earn their place on a desktop
 * homepage, and until now the choice was keep it everywhere or lose it
 * everywhere.
 *
 * `undefined` on both fields is "everywhere", so a shop that never opens this
 * stores nothing.
 */
const WHERE_OPTIONS: {
  label: string;
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
}[] = [
  { label: "Everywhere" },
  { label: "Desktop only", showOnDesktop: true, showOnMobile: false },
  { label: "Mobile only", showOnDesktop: false, showOnMobile: true },
];

/** Which of the three a stored instance is in. Anything unset ⇒ everywhere. */
function whereIndex(section: StoreHomeSection): number {
  const desktop = section.showOnDesktop ?? true;
  const mobile = section.showOnMobile ?? true;
  if (desktop && mobile) return 0;
  return desktop ? 1 : 2;
}

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
  const usingPreset = sections.length === 0;
  const preset = sectionInstances(
    HOME_PRESET_SECTIONS[homeTemplate] ?? HOME_PRESET_SECTIONS.classic,
  );
  const effective = usingPreset ? preset.sections : sections;
  // The config the merchant is actually looking at: theirs, over whatever the
  // preset implies. Every read below goes through this rather than `config` —
  // editing the heading of a preset row whose source came from the preset must
  // not seed a fresh entry that drops that source on the floor.
  const effectiveConfig = usingPreset
    ? mergeSectionConfig(preset.config, config)
    : config;

  /* Every edit writes BOTH halves, which is what MATERIALIZES the preset the
     first time the merchant touches anything. Both directions matter:

     - Writing only the list would leave a preset-implied config behind, so a
       row that was "a grid, sourced newest" becomes a plain Featured row the
       moment anything is reordered.
     - Writing only the config is worse, and is a bug that shipped: the payload
       drops every `sectionConfig` entry whose key is not in `homepageSections`
       (`toSettingsPayload`), so on a shop that never composed its own page —
       14 of the 43 live ones — configuring a row was discarded at Save with no
       error and nothing on screen to explain it.

     Writing both on every edit is also what keeps the two calls order-free: a
     handler that removes a section and its config does it in ONE commit rather
     than two, so neither call can re-write what the other just changed. On a
     shop that already owns its list both writes are deep-equal no-ops, and
     dirty state is a JSON compare, so nothing reads as edited that wasn't. */
  const commit = (
    nextSections: StoreHomeSection[],
    nextConfig: StoreSectionConfig[],
  ) => {
    onChange(nextSections);
    onConfigChange(nextConfig);
  };

  /* A section may be added MORE THAN ONCE exactly when its CONFIG can tell two
     instances apart — that is what `key` is for, and what makes "here is the
     skin care, here are the devices" expressible. Everything else stays
     one-per-page: two heroes or two footers is a mistake, not an intent.

     The predicate was `isConfigurableSection` — "is this a product row" — which
     answered the same way only by accident, and stopped doing so the moment a
     second kind of configurable section existed. A promo-card block pointed at
     two collections and a tag row of brands beside one of occasions are both
     ordinary things to want, and both are distinguishable in the list. */
  const used = new Set(effective.map((s) => s.type));
  const available = ADD_ENTRIES.filter(
    (entry) => sectionConfigKind(entry.type) || !used.has(entry.type),
  );

  const setConfig = (key: string, patch: Partial<StoreSectionConfig> | null) => {
    if (patch === null) {
      commit(effective, effectiveConfig.filter((c) => c.key !== key));
      return;
    }
    const existing = configFor(effectiveConfig, key);
    /* A NEW product row needs a source — it is the whole point of configuring
       one. A tag or promo-card row does not: `source` means nothing to either,
       and storing "featured" on one would make the saved config read as a
       product row to anyone debugging the document. */
    const kind = sectionConfigKind(
      effective.find((s) => s.key === key)?.type ?? "",
    );
    const seed =
      kind === "products" ? { key, source: "featured" as const } : { key };
    commit(
      effective,
      existing
        ? effectiveConfig.map((c) => (c.key === key ? { ...c, ...patch } : c))
        : [...effectiveConfig, { ...seed, ...patch }],
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
    commit(next, effectiveConfig);
  };

  return (
    <div className="space-y-3">
      <ol className="space-y-1.5">
        {effective.map((section, i) => {
        /* One label, used for the visible name AND the three buttons. They read
           `SECTION_LABELS[type]` until 2026-09-06, which was survivable while
           two rows of one type was an unusual page — since the grids merged it
           is the DEFAULT page, so "Move Product grid up" appeared twice with
           nothing to tell a screen-reader user which row they were moving. */
        const label = sectionLabel(section, effectiveConfig, collections);
        return (
          <li key={section.key} className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-2.5 py-2">
            <span className="min-w-0 flex-1 truncate text-xs font-medium">
              {label}
            </span>
            <div className="flex flex-none items-center gap-0.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Move ${label} up`}
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
                aria-label={`Move ${label} down`}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                onClick={() =>
                  // Drop the config WITH the section, in one commit. Keeping it
                  // would be an orphan the server tolerates but the merchant
                  // cannot see or reach — and it would silently reappear if
                  // they re-added a section that minted the same key.
                  commit(
                    effective.filter((s) => s.key !== section.key),
                    effectiveConfig.filter((c) => c.key !== section.key),
                  )
                }
                aria-label={`Remove ${label}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {sectionConfigKind(section.type) === "tags" ? (
            <TagRowConfig
              config={configFor(effectiveConfig, section.key)}
              onChange={(patch) => setConfig(section.key, patch)}
            />
          ) : sectionConfigKind(section.type) === "categories" ? (
            <CategoryRowConfig
              config={configFor(effectiveConfig, section.key)}
              collections={collections}
              onChange={(patch) => setConfig(section.key, patch)}
            />
          ) : isConfigurableSection(section.type) ? (
            <RowConfig
              config={configFor(effectiveConfig, section.key)}
              collections={collections}
              sectionType={section.type}
              onChange={(patch) => setConfig(section.key, patch)}
            />
          ) : null}

          {/* Where it shows. Under the row's own config rather than beside the
              name: it is the last question a merchant asks about a section, and
              a chip group on the title line would crowd the three buttons. */}
          <div className="flex flex-wrap items-center gap-1.5 border-t px-2.5 py-2">
            <span className="mr-1 text-[11px] text-muted-foreground">Show on</span>
            {WHERE_OPTIONS.map((option, index) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={whereIndex(section) === index}
                onClick={() =>
                  commit(
                    effective.map((entry) =>
                      entry.key === section.key
                        ? {
                            key: entry.key,
                            type: entry.type,
                            // Rebuilt rather than spread: "Everywhere" has to
                            // REMOVE the two fields, and spreading would leave
                            // the old pair sitting under the new answer.
                            ...(option.showOnDesktop === undefined
                              ? {}
                              : {
                                  showOnDesktop: option.showOnDesktop,
                                  showOnMobile: option.showOnMobile,
                                }),
                          }
                        : entry,
                    ),
                    effectiveConfig,
                  )
                }
                className={`rounded-md border px-2 py-0.5 text-[11px] ${
                  whereIndex(section) === index
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          </li>
        );
        })}
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
          commit(
            [...effective, { key, type: "featured-grid" }],
            [...effectiveConfig, { key, source: "category" }],
          );
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
            {available.map((entry) => (
              <Button
                key={entry.id}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => {
                  // The API refuses a duplicate key, and a collision here would
                  // surface as a save failure the merchant cannot act on — so
                  // the key is minted against the list, not just its length.
                  const key = mintKey(entry.type);
                  commit(
                    [...effective, { key, type: entry.type }],
                    entry.source
                      ? [...effectiveConfig, { key, source: entry.source }]
                      : effectiveConfig,
                  );
                }}
              >
                <Plus className="h-3 w-3" />
                {entry.label}
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
  sectionType,
  onChange,
}: {
  config: StoreSectionConfig | undefined;
  collections: CollectionRowValue[];
  /** Passed down so the picker can say when a section draws fewer than it holds. */
  sectionType?: string;
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
          onChange={(e) => {
            const next = e.target.value as StoreSectionConfig["source"] | "";
            if (!next) return onChange(null);
            /* Leaving `manual` DROPS the picks. Patches are merged, so without
               this the ids stay on the document forever — invisible in the
               editor (the picker is only rendered for `manual`) and read by
               nobody except `orderByIds`, which used them to reorder whatever
               row the merchant switched to. The storefront now ignores them
               too; clearing here is what stops them accumulating. */
            onChange({
              source: next,
              ...(next === "manual" ? {} : { productIds: undefined }),
            });
          }}
        >
          <option value="">Default for this section</option>
          <option value="featured">Featured products</option>
          <option value="newest">New arrivals</option>
          <option value="category">One collection</option>
          <option value="manual">Products I pick</option>
        </select>
      </div>

      {source === "manual" ? (
        <ProductRowConfig
          config={config}
          sectionType={sectionType}
          onChange={onChange}
        />
      ) : null}

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
          {/* Hidden for a hand-picked row: the picked list IS the length, and
              a "show 8" that silently truncates a merchant's 10 chosen
              products — or pads to 8 when they picked 3 — is the row
              disagreeing with the picker directly above it. */}
          {source === "manual" ? null : (
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
          )}

          <div className="flex items-center gap-2">
            <label className="w-16 flex-none text-[11px] text-muted-foreground">Button</label>
            <label className="flex items-center gap-1.5 text-[11px]">
              <input
                type="checkbox"
                /* Unset means shown — every row had a "View all" before this
                   existed, so an absent flag must not remove it. */
                checked={config.showCta ?? true}
                onChange={(e) => onChange({ showCta: e.target.checked })}
              />
              Show
            </label>
          </div>

          {(config.showCta ?? true) ? (
            <>
              <div className="flex items-center gap-2">
                <label className="w-16 flex-none text-[11px] text-muted-foreground">Label</label>
                <input
                  className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs"
                  placeholder="View all"
                  maxLength={40}
                  value={config.ctaLabel ?? ""}
                  onChange={(e) => onChange({ ctaLabel: e.target.value || undefined })}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16 flex-none text-[11px] text-muted-foreground">Links to</label>
                <input
                  className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs"
                  /* A hand-picked row is the reason this exists: it has no
                     collection to derive a destination from, so the default
                     lands on the full catalogue. */
                  placeholder={
                    source === "manual" ? "/products" : "Where the products live"
                  }
                  maxLength={300}
                  value={config.ctaHref ?? ""}
                  onChange={(e) => onChange({ ctaHref: e.target.value || undefined })}
                />
              </div>
              <StoreLinkHint value={config.ctaHref ?? ""} />
            </>
          ) : null}
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
  /* The two sections configured by PICKING rather than by source name themselves
     after what they hold, for the same reason a collection row does: both may
     appear twice on one page, and "Category promo cards" or "Shop by tag" listed
     twice says nothing about which is which. Neither carries a `source`, so both
     are checked before the source branches below. */
  if (own.categoryIds?.length) {
    const names = own.categoryIds
      .map((id) => collections.find((c) => c._id === id))
      .filter(Boolean)
      .map((c) => c!.displayName || c!.name);
    if (names.length) return `${names.join(", ")} · ${base}`;
  }
  /* A tag row names its COUNT, not its tags: the editor holds the merchant's
     collections but not their tags (the picker fetches those itself), so the
     names are not available here — and a count still tells two rows apart. */
  if (own.tagIds?.length) {
    return `${own.tagIds.length} tag${own.tagIds.length === 1 ? "" : "s"} · ${base}`;
  }
  if (own.source === "category") {
    const picked = collections.find((c) => c._id === own.categoryId);
    return picked ? `${picked.displayName || picked.name} · ${base}` : `Pick a collection · ${base}`;
  }
  /* The two catalogue-wide sources name themselves for the same reason a
     collection row does: since the grids merged, "Product grid" twice down a
     list is the merchant's featured row and their new-arrivals row, and nothing
     on screen says which is which. Shared with the theme picker's running
     order, so the two lists cannot call the same row different things. */
  const named = own.source ? SOURCE_LABELS[own.source] : undefined;
  if (named) return `${named} · ${base}`;
  // A hand-picked row names its size, since it has no source to name it after —
  // and "Pick products" is the same nudge the empty collection row gives, for
  // the same half-finished state the API refuses on save.
  if (own.source === "manual") {
    const count = own.productIds?.length ?? 0;
    return count
      ? `${count} chosen product${count === 1 ? "" : "s"} · ${base}`
      : `Pick products · ${base}`;
  }
  return base;
}
