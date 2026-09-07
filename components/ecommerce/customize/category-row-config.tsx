"use client";
// coding-standard: maintained

import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, X } from "lucide-react";

import { useUploadStorefrontImage } from "@/services/api";
import type { StoreSectionCard, StoreSectionConfig } from "@/lib/storefront-client";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import {
  DEFAULT_BANNER_COUNT,
  MAX_BANNER_COUNT,
  cardHasOverrides,
  configHasSettings,
  recommendedCardImage,
  resolveBannerLayout,
  resolveCardHeight,
  resolveCardRatio,
  sectionCard,
} from "@/lib/storefront-sections";
import { Button } from "@/ui/components/button";
import { cn } from "@/ui/lib/utils";
import { CategoryCardFields } from "@/components/ecommerce/customize/category-card-fields";
import { CategoryRowLayoutFields } from "@/components/ecommerce/customize/category-row-layout-fields";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { useImageRatioWarning } from "@/components/shared/image-ratio-warning";

/**
 * Customize → Home page → Sections → the **category promo cards** row.
 *
 * **Picked from the collections already in hand, not fetched.** The sections
 * editor is given the merchant's own collections so it can name a row after the
 * one it points at; this control reuses that list, so opening the panel costs
 * nothing and an unlisted collection can be filtered out honestly — a hidden
 * collection would save cleanly, render nothing, and give the merchant no clue
 * why their card never appeared.
 *
 * **Order is edited, not sorted.** The block is a merchandising decision and
 * which department leads it is the decision the merchant came to make; sorting
 * it alphabetically throws that away, exactly as it would on the hand-picked
 * product row.
 *
 * A pick that no longer resolves stays in the list and is named rather than
 * dropped: the storefront already skips it, so removing it here silently would
 * leave a merchant unable to see or tidy the row.
 */
export function CategoryRowConfig({
  config,
  collections,
  onChange,
}: {
  config: StoreSectionConfig | undefined;
  collections: CollectionRowValue[];
  onChange: (patch: Partial<StoreSectionConfig> | null) => void;
}) {
  const chosen = config?.categoryIds ?? [];
  const listed = collections.filter((c) => c.isListed);
  const byId = new Map(listed.map((c) => [c._id, c]));
  const unchosen = listed.filter((c) => !chosen.includes(c._id));
  /* One card open at a time. Five collapsed fields per card times four cards is
     a rail nobody can see the top of, and a merchant is writing one
     advertisement at a time anyway. */
  const [openCard, setOpenCard] = useState<string | null>(null);
  const upload = useUploadStorefrontImage();
  const fileInput = useRef<HTMLInputElement>(null);
  /* Which card the file dialog was opened FOR. The input is one element reused
     by every card — a separate `<input type="file">` per card is four hidden
     elements and four refs for one interaction. */
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  /* What this row's pictures should be cropped to, derived from the DESKTOP
     composition — the larger of the two screens, so one file serves the phone
     as well. Recomputed as the merchant changes the shape, the picture width or
     the height, so the number under the upload button always describes the card
     they are looking at. */
  const layout = resolveBannerLayout(config);
  const cardRatio = resolveCardRatio(config);
  const cardHeight = resolveCardHeight(config);
  /* ⚠ **Memoised, and it is not an optimisation.** `useImageRatioWarning`
     compares this prop by IDENTITY to reset itself when a field's shape changes
     — it was written for the module-level constants in `RECOMMENDED`, and this
     is the first caller to hand it a computed one. A fresh object every render
     makes that comparison always true, so the hook sets state on every render
     and React throws "Too many re-renders". Keyed on the four primitives the
     size is derived from, so it changes exactly when the recommendation does. */
  const recommended = useMemo(
    () =>
      recommendedCardImage({
        shape: layout.desktop.shape,
        split: layout.desktop.split,
        ratio: cardRatio,
        height: cardHeight,
      }),
    [layout.desktop.shape, layout.desktop.split, cardRatio, cardHeight],
  );
  /* Measured in the browser after a pick, through the one hook every image
     field in the app shares — so this warning cannot drift into a third dialect
     of the same sentence. */
  const { warning: ratioWarning, check: checkRatio, clear: clearRatio } =
    useImageRatioWarning(recommended);

  /**
   * Every write from this panel and the layout one below it.
   *
   * ⚠ **The one place that decides whether the row's config still exists**, and
   * it earns that by asking the config rather than by listing fields. A config
   * holding nothing but its `key` is a saved record of a merchant deciding
   * nothing, so it goes — but "nothing" used to be spelled out by hand as
   * `chosen.length > 0 || config.title`, which was true of the two settings
   * that existed when it was written and quietly became DATA LOSS as the row
   * grew: a merchant who had turned on Full width and picked a picture shape,
   * with no collections chosen, lost both by pressing "Photo on top", because
   * neither field was on the list. `configHasSettings` walks the merged result
   * instead, so a setting added next month is protected the day it is added.
   */
  const apply = (patch: Partial<StoreSectionConfig> | null) => {
    if (patch === null) return onChange(null);
    const merged = { ...(config ?? { key: "" }), ...patch };
    onChange(configHasSettings(merged) ? patch : null);
  };

  /* Emptying the list puts the section back on its built-in first-two
     behaviour rather than blanking it, the same rule the tag row follows — and
     the same reason: "showing no collections" is not something a merchant means
     by removing their last pick, and a section that renders nothing looks
     broken in the preview beside them. Anything else the merchant set on the
     row survives — `apply` drops the config only when the row is genuinely
     back to holding nothing. */
  const set = (categoryIds: string[]) => {
    /* Overrides follow their card. A pick removed from the row leaves copy
       behind that nothing renders and no panel shows, and it would silently
       come back if the merchant re-added the collection later — a card they
       thought was blank arriving pre-written. Order is untouched: `cards` is
       keyed, not positional. */
    const cards = config?.cards?.filter((c) => categoryIds.includes(c.categoryId));
    const keptCards = cards?.length ? cards : undefined;
    apply(
      categoryIds.length
        ? { categoryIds, cards: keptCards }
        : { categoryIds: undefined, cards: undefined },
    );
  };

  /* Write one card's overrides, keyed by the collection it points at.
     Trimmed on the way in and dropped when nothing is left, so a stored entry
     always means the merchant wrote something — the same rule `cardShape`
     follows when it declines to store its own default. */
  const patchCard = (
    categoryId: string,
    patch: Partial<Omit<StoreSectionCard, "categoryId">>,
  ) => {
    const existing = config?.cards ?? [];
    const next: StoreSectionCard = {
      ...(sectionCard(config, categoryId) ?? { categoryId }),
      ...patch,
    };
    const kept = existing.filter((c) => c.categoryId !== categoryId);
    const cards = cardHasOverrides(next) ? [...kept, next] : kept;
    apply({ cards: cards.length ? cards : undefined });
  };

  const pickImage = (categoryId: string) => {
    setUploadFor(categoryId);
    fileInput.current?.click();
  };

  const onFile = async (file: File, categoryId: string) => {
    void checkRatio(file);
    try {
      const res = await upload.mutateAsync(file);
      if (res.data) patchCard(categoryId, { image: res.data });
    } catch {
      // handleMutationError already toasted; leave the card as it was.
    } finally {
      setUploadFor(null);
    }
  };

  const move = (index: number, delta: number) => {
    const next = [...chosen];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set(next);
  };

  /* The cards actually on screen. Falls back to the block's own first two when
     nothing is picked, so every count below describes what the merchant is
     looking at rather than what they have chosen. */
  const shown = chosen.length
    ? chosen
    : listed.slice(0, DEFAULT_BANNER_COUNT).map((c) => c._id);
  /* The one thing that decides whether this block sells anything: a promo card
     is mostly photograph, and one with none renders a flat tinted rectangle.

     ⚠ Counts what the card will SHOW, not what the collection holds. It used to
     ask only `hasImage`, so a merchant who had just uploaded a picture for this
     card was still told the collection had none and sent to Collections to fix
     something they had already fixed. The description hint below was written
     card-aware from the start; this one was not, and the two disagreeing about
     the same card is worse than either being wrong alone. */
  const unphotographed = shown.filter(
    (id) => !sectionCard(config, id)?.image && byId.get(id)?.hasImage === false,
  );
  /* The other half of what makes this block an advertisement. A card with no
     sentence is a photograph, a name and a button — the shop still works, so
     this is a hint and not a warning, but it is the single most common reason
     the block looks emptier than the merchant expected.

     ⚠ Counts what the card will PRINT, not what the collection holds — a card
     with its own copy is described whatever the collection says, and telling a
     merchant otherwise sends them to write a line they have already written. */
  const undescribed = shown.filter(
    (id) =>
      !sectionCard(config, id)?.description?.trim() &&
      !byId.get(id)?.description?.trim(),
  );

  return (
    <div className="space-y-2 border-t px-2.5 py-2">
      {/* One input for every card — see `uploadFor`. Uploads land immediately
          (the file has to exist on the server before a settings PATCH can name
          it), which is the same bargain every image in Customize makes. */}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadFor) void onFile(file, uploadFor);
          e.target.value = "";
        }}
      />
      {chosen.length ? (
        <ol className="space-y-1">
          {chosen.map((id, i) => (
            <PickedCard
              key={id}
              collection={byId.get(id)}
              card={sectionCard(config, id)}
              open={openCard === id}
              first={i === 0}
              last={i === chosen.length - 1}
              uploading={uploadFor === id && upload.isPending}
              onToggle={() => setOpenCard(openCard === id ? null : id)}
              onMove={(delta) => move(i, delta)}
              onRemove={() => set(chosen.filter((c) => c !== id))}
              recommended={recommended}
              ratioWarning={ratioWarning}
              onPatch={(patch) => {
                if (patch.image === null) clearRatio();
                patchCard(id, patch);
              }}
              onPickImage={() => pickImage(id)}
            />
          ))}
        </ol>
      ) : (
        <PartHint>
          Showing your first two collections. Pick your own to control which
          ones this block advertises, in your own order — then open a card to
          give it its own title, description, picture and button.
        </PartHint>
      )}

      {/* Said where the cards are, not three settings further down. The
          per-card fields are the answer to most of what a merchant wants from
          this block, and they are invisible until a row is opened. */}
      {chosen.length ? (
        <PartHint>
          Open a card to give it its own title, description, picture and button.
          Anything you leave empty uses the collection&apos;s own — and nothing
          here changes the collection itself.
        </PartHint>
      ) : null}

      {chosen.length < MAX_BANNER_COUNT ? (
        <select
          className="h-7 w-full rounded-md border bg-background px-1.5 text-xs"
          value=""
          aria-label="Add a collection to this row"
          disabled={!unchosen.length}
          onChange={(e) => e.target.value && set([...chosen, e.target.value])}
        >
          <option value="">
            {listed.length ? "Add a collection…" : "No visible collections yet"}
          </option>
          {unchosen.map((c) => (
            <option key={c._id} value={c._id}>
              {c.displayName || c.name}
            </option>
          ))}
        </select>
      ) : (
        <PartHint>
          Four is the most this block shows — a fifth card wraps onto a row of
          its own.
        </PartHint>
      )}

      <CategoryRowLayoutFields config={config} onChange={apply} />

      {/* Said once, for the row. A card with nothing to say is a picture, a name
          and a button — the storefront shortens it so the block still looks
          deliberate (`.sf-banner-row--terse`), but short is not the same as
          good, and a merchant staring at one has no way to know a sentence is
          what is missing. Points at the card's OWN description, not the
          collection's: writing here advertises this block and leaves the
          collection page alone. */}
      {undescribed.length ? (
        <PartHint>
          {undescribed.length === shown.length
            ? "These cards show a name and a button only."
            : `${undescribed.length} of these cards show a name and a button only.`}{" "}
          {/* ⚠ Only one of these sentences is ever true. The per-card editor
              lives inside the picked list, so with nothing picked there is no
              card to open — and this hint said "open a card above" to a
              merchant looking at a panel that had none. */}
          {chosen.length
            ? "Open a card above and write its description — it appears here and nowhere else."
            : "Pick your own collections above to give each card its own description."}
        </PartHint>
      ) : null}

      {/* The one thing that decides whether this block sells anything. A promo
          card is mostly photograph, and a collection with none renders a flat
          tinted rectangle where the picture should be — which looks like a
          loading failure rather than a design. */}
      {unphotographed.length ? (
        <PartHint tone="warn">
          {unphotographed.length === 1
            ? "One of these collections has no picture, so its card shows a blank panel."
            : `${unphotographed.length} of these collections have no picture, so their cards show blank panels.`}{" "}
          Add one under Collections.
        </PartHint>
      ) : null}
    </div>
  );
}

/**
 * One picked collection — the row a merchant reorders, removes, and opens to
 * write that card's own copy.
 *
 * Its own component because the panel around it was past the repo's component
 * ceiling carrying it, and because the row has real logic of its own: a pick
 * that no longer resolves still has to be shown and named, rather than dropped
 * on the merchant's behalf.
 */
function PickedCard({
  collection,
  card,
  open,
  first,
  last,
  uploading,
  recommended,
  ratioWarning,
  onToggle,
  onMove,
  onRemove,
  onPatch,
  onPickImage,
}: {
  /** `undefined` when the pick no longer resolves — hidden, or deleted. */
  collection: CollectionRowValue | undefined;
  card: StoreSectionCard | undefined;
  open: boolean;
  first: boolean;
  last: boolean;
  uploading: boolean;
  /** The picture size this row's cards want — see `recommendedCardImage`. */
  recommended: { w: number; h: number };
  ratioWarning: string | null;
  onToggle: () => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
  onPatch: (patch: Partial<Omit<StoreSectionCard, "categoryId">>) => void;
  onPickImage: () => void;
}) {
  const label = collection ? collection.displayName || collection.name : null;

  return (
    <li className="space-y-1">
      <div className="flex items-center gap-1">
        {/* The name opens the card rather than sitting beside a separate
            toggle: the row IS the card, and a rail this narrow cannot afford a
            control whose only job is to reveal one. A pick that no longer
            resolves stays un-openable — there is no collection left to write
            copy against. */}
        <button
          type="button"
          disabled={!label}
          aria-expanded={open}
          /* Named explicitly rather than by its contents: the row also carries
             a "custom" badge, so the accessible name would change the moment a
             merchant wrote anything — and "Cushion custom" is not what a screen
             reader should announce for a control that opens an editor. */
          aria-label={label ? `Edit the ${label} card` : undefined}
          onClick={onToggle}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1 text-left text-xs",
            label ? "hover:text-foreground" : "italic text-muted-foreground",
          )}
        >
          <ChevronDown
            className={cn(
              "h-3 w-3 flex-none text-muted-foreground transition-transform",
              open && "rotate-180",
              !label && "invisible",
            )}
          />
          <span className="min-w-0 truncate">
            {label ?? "Collection no longer shown"}
          </span>
          {/* Marks a card the merchant has written, so a collapsed list still
              says which ones carry their own copy. */}
          {card && cardHasOverrides(card) ? (
            <span className="flex-none rounded bg-primary/10 px-1 py-0.5 text-[10px] font-semibold text-primary">
              custom
            </span>
          ) : null}
          {/* ⚠ **The row has to say that it opens.** It shipped as the name
              plus a chevron, and that reads as a list item with a decoration —
              the first merchant to see it reported the whole feature missing
              ("no image upload, edit title, description, button, href.
              nothing...why?") while looking straight at the control that
              reveals all five. A caret is an affordance only to someone who
              already knows something is behind it. Naming what is inside costs
              one muted word and removes the guess. */}
          {label ? (
            <span className="ml-auto flex-none text-[10px] font-medium text-primary">
              {open ? "Close" : "Edit card"}
            </span>
          ) : null}
        </button>
        <RowButton
          label={`Move ${label ?? "collection"} up`}
          disabled={first}
          onClick={() => onMove(-1)}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </RowButton>
        <RowButton
          label={`Move ${label ?? "collection"} down`}
          disabled={last}
          onClick={() => onMove(1)}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </RowButton>
        <RowButton label={`Remove ${label ?? "collection"}`} onClick={onRemove}>
          <X className="h-3.5 w-3.5" />
        </RowButton>
      </div>
      {open && label ? (
        <CategoryCardFields
          card={card}
          collectionName={label}
          collectionDescription={collection?.description ?? ""}
          hasCollectionImage={collection?.hasImage === true}
          uploading={uploading}
          recommended={recommended}
          ratioWarning={ratioWarning}
          onChange={onPatch}
          onPickImage={onPickImage}
          onClearImage={() => onPatch({ image: null })}
        />
      ) : null}
    </li>
  );
}

function RowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-7 w-7 text-muted-foreground"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </Button>
  );
}
