"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp, X } from "lucide-react";

import type { StoreSectionConfig } from "@/lib/storefront-client";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import { Button } from "@/ui/components/button";
import { PartHint } from "@/components/ecommerce/customize/part-group";

/** Mirrors `categoryIds` in the backend validator — a fifth card wraps alone. */
const MAX_BANNERS = 4;

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

  /* Emptying the list puts the section back on its built-in first-two
     behaviour rather than blanking it, the same rule the tag row follows — and
     the same reason: "showing no collections" is not something a merchant means
     by removing their last pick, and a section that renders nothing looks
     broken in the preview beside them. A heading typed on the row survives,
     which is why the config is patched rather than dropped when one exists. */
  const set = (categoryIds: string[]) => {
    if (categoryIds.length) return onChange({ categoryIds });
    onChange(config?.title?.trim() ? { categoryIds: undefined } : null);
  };

  const move = (index: number, delta: number) => {
    const next = [...chosen];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set(next);
  };

  const unphotographed = chosen.filter((id) => byId.get(id)?.hasImage === false);

  return (
    <div className="space-y-2 border-t px-2.5 py-2">
      {chosen.length ? (
        <ol className="space-y-1">
          {chosen.map((id, i) => {
            const collection = byId.get(id);
            const label = collection
              ? collection.displayName || collection.name
              : null;
            return (
              <li key={id} className="flex items-center gap-1">
                <span
                  className={`min-w-0 flex-1 truncate text-xs ${
                    label ? "" : "italic text-muted-foreground"
                  }`}
                >
                  {label ?? "Collection no longer shown"}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={`Move ${label ?? "collection"} up`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={i === chosen.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move ${label ?? "collection"} down`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => set(chosen.filter((c) => c !== id))}
                  aria-label={`Remove ${label ?? "collection"}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ol>
      ) : (
        <PartHint>
          Showing your first two collections. Pick your own to control which
          ones this block advertises, in your own order.
        </PartHint>
      )}

      {chosen.length < MAX_BANNERS ? (
        <select
          className="h-7 w-full rounded-md border bg-background px-1.5 text-xs"
          value=""
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
