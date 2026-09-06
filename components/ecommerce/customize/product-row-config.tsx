"use client";
// coding-standard: maintained

import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";

import type { StoreSectionConfig } from "@/lib/storefront-client";
import { useSelectOptions } from "@/services/api";
import { selectOptions } from "@/services/api/select-options";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Skeleton } from "@/ui/components/skeleton";
import { PartHint } from "@/components/ecommerce/customize/part-group";

/** Mirrors `productIds` in the backend validator and `MAX_PICKED_PRODUCTS`. */
const MAX_PICKS = 24;
/** Search results shown at once. A picker, not a catalogue browser. */
const RESULT_LIMIT = 20;
/**
 * Sections that render fewer products than a merchant may pick, and how many
 * they actually show.
 *
 * `MinimalPicks` slices to six on purpose — it is an edit, not a catalogue —
 * and enforces that even for a configured row. Nothing said so in the picker,
 * so a merchant could add twenty-four and lose eighteen of them silently. The
 * cap is not lowered here: picks past the cap are kept (the section may be
 * re-pointed at a grid later, and a pick is never thrown away), the merchant is
 * simply told what this one will draw.
 */
const SECTION_RENDER_CAP: Record<string, number> = { "minimal-picks": 6 };

/**
 * Customize → Home page → Sections → the hand-picked product row.
 *
 * **Search, not a dropdown**, and that is the difference from `TagRowConfig`
 * beside it: a shop has a handful of tags and thousands of products, so the
 * `all=true` list that works for tags would download the entire catalogue into
 * a `<select>` nobody can scan. The query is server-side and debounced.
 *
 * **Order is edited, not sorted.** A curated row is a sequence — the merchant's
 * lead product earns the first slot — so the storefront re-sorts the API's
 * response back into this order (`orderByIds`). Sorting it any other way throws
 * away the only thing that distinguishes this source from "featured".
 *
 * A pick that no longer resolves is left in the list rather than pruned: a
 * product taken off the storefront for a week must come back when it returns,
 * and the row simply renders shorter meanwhile.
 */
export function ProductRowConfig({
  config,
  sectionType,
  onChange,
}: {
  config: StoreSectionConfig | undefined;
  /** The section this row configures — some render fewer picks than they hold. */
  sectionType?: string;
  onChange: (patch: Partial<StoreSectionConfig> | null) => void;
}) {
  const [term, setTerm] = useState("");
  const search = useDebounce(term.trim(), 300);
  const chosen = config?.productIds ?? [];

  /* Two separate queries on purpose. The SEARCH answers "what can I add" and
     changes on every keystroke; the LABELS answer "what did I already pick" and
     must not depend on the current search term — otherwise every chosen product
     loses its name the moment the merchant types something that excludes it. */
  const { data: results = [], isFetching } = useSelectOptions(
    search ? selectOptions("products", { all: false, search, limit: RESULT_LIMIT }) : null,
  );
  const { data: picked = [], isPending: picksLoading } = useSelectOptions(
    chosen.length ? selectOptions("products", { all: false, ids: chosen.join(","), limit: MAX_PICKS }) : null,
  );

  const labelFor = (id: string) =>
    picked.find((o) => String(o.value) === id)?.label ?? null;

  /* Has the merchant written anything on this row that is NOT the picks? The
     tag row can drop its whole config when the last chip goes, because chips are
     all it holds; this row also carries a heading and a button, and taking those
     away as a side effect of "remove this product" is a silent edit of work the
     merchant did somewhere else in the panel. Swapping all four picks — remove,
     remove, remove, remove, add — is an ordinary thing to do. */
  const hasOtherSettings =
    !!config?.title?.trim() ||
    !!config?.ctaLabel?.trim() ||
    !!config?.ctaHref?.trim() ||
    config?.showCta === false;

  const renderCap = sectionType ? SECTION_RENDER_CAP[sectionType] : undefined;

  const set = (productIds: string[]) => {
    if (productIds.length) return onChange({ source: "manual", productIds });
    /* Emptying the list cannot be SAVED as `source: "manual"` — the validator
       requires at least one pick — so the row has to leave the manual source
       either way. With nothing else on it that means removing the config, the
       same rule as the tag row; with a heading or a button on it, the row keeps
       those and falls back to the section's own products until the merchant
       picks again. "No products chosen" and "never configured" stay distinct. */
    onChange(
      hasOtherSettings ? { source: undefined, productIds: undefined } : null,
    );
  };

  const add = (id: string) => {
    if (chosen.includes(id) || chosen.length >= MAX_PICKS) return;
    set([...chosen, id]);
    setTerm("");
  };

  const move = (index: number, delta: number) => {
    const next = [...chosen];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set(next);
  };

  return (
    <div className="space-y-2">
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search products to add…"
        className="h-7 text-xs"
        aria-label="Search products"
      />

      {search ? (
        <div className="max-h-40 overflow-y-auto rounded-md border">
          {isFetching && results.length === 0 ? (
            <Skeleton className="m-1.5 h-6" />
          ) : results.length === 0 ? (
            <PartHint>No product matches “{search}”.</PartHint>
          ) : (
            results.map((option) => {
              const id = String(option.value);
              const already = chosen.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={already || chosen.length >= MAX_PICKS}
                  onClick={() => add(id)}
                  className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-xs hover:bg-muted disabled:opacity-50"
                >
                  <span className="truncate">{option.label}</span>
                  {already ? (
                    <span className="flex-none text-[10px] text-muted-foreground">Added</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}

      {chosen.length === 0 ? (
        <PartHint>
          Nothing picked yet. Search above to build the row — the order you add
          them is the order shoppers see.
        </PartHint>
      ) : (
        <ul className="space-y-1">
          {chosen.map((id, index) => {
            const label = labelFor(id);
            return (
              <li key={id} className="flex items-center gap-1 rounded-md border px-2 py-1">
                <span className="w-4 flex-none text-[11px] text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs">
                  {/* `picksLoading` matters: `picked` is empty until the request
                      lands, so without it every saved product reads as deleted
                      for the first few hundred milliseconds. "Not loaded yet"
                      and "this is gone" are different answers and only one of
                      them should alarm the merchant. */}
                  {label ?? (
                    picksLoading ? (
                      <Skeleton className="h-3 w-24" />
                    ) : (
                      <span className="text-muted-foreground">
                        Product no longer available
                      </span>
                    )
                  )}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${label ?? "product"} up`}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  disabled={index === chosen.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${label ?? "product"} down`}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => set(chosen.filter((x) => x !== id))}
                  aria-label={`Remove ${label ?? "product"}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {renderCap && chosen.length > renderCap ? (
        <PartHint tone="warn">
          This section shows the first {renderCap}. The rest stay saved but will
          not appear until you move them up or choose another section.
        </PartHint>
      ) : null}

      {chosen.length >= MAX_PICKS ? (
        <PartHint tone="warn">
          {MAX_PICKS} is the most one row can hold. A longer list belongs on a
          collection page.
        </PartHint>
      ) : null}
    </div>
  );
}
