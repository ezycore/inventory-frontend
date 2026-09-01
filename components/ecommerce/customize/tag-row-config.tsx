"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp, X } from "lucide-react";

import type { StoreSectionConfig } from "@/lib/storefront-client";
import { useSelectOptions } from "@/services/api";
import { selectOptions } from "@/services/api/select-options";
import { Button } from "@/ui/components/button";
import { Skeleton } from "@/ui/components/skeleton";
import { PartHint } from "@/components/ecommerce/customize/part-group";

/**
 * Customize → Home page → Sections → the **Shop by age** row's config.
 *
 * A tag picker rather than a text list, because the row stores tag **ids**: the
 * section originally matched a hardcoded English vocabulary against tag names,
 * so a merchant who renamed `0-3M` to `0-3 Months` — or ran their shop in
 * Bangla — silently lost chips with nothing to tell them why. An id survives a
 * rename, and each chip reads its label back off the tag, so the storefront can
 * never disagree with Products → Tags.
 *
 * **Order is edited, not sorted.** The row is an age ladder and it only makes
 * sense in growth order; sorting it alphabetically gives "0-3M, 12-18M, 18-24M,
 * 2-3Y" and a parent has to read every chip to find theirs. So the merchant
 * arranges it, exactly as they arrange the sections above.
 */
export function TagRowConfig({
  config,
  onChange,
}: {
  config: StoreSectionConfig | undefined;
  onChange: (patch: Partial<StoreSectionConfig> | null) => void;
}) {
  /* ⚠ `isPending` is load-bearing, not polish. `options` is `[]` until the
     request lands, so without it EVERY saved tag resolves to no label and the
     panel accuses the merchant of having deleted all of them for the first few
     hundred milliseconds. "Not loaded yet" and "this tag is gone" are different
     answers and only one of them is alarming. */
  const { data: options = [], isPending } = useSelectOptions(
    selectOptions("tags"),
  );
  const chosen = config?.tagIds ?? [];
  const labelFor = (id: string) =>
    options.find((o) => String(o.value) === id)?.label ?? null;
  const unchosen = options.filter((o) => !chosen.includes(String(o.value)));

  const set = (tagIds: string[]) =>
    // An empty list is "show no chips", which is a real answer — but it is not
    // the same as never having configured the row, and the storefront tells
    // them apart. Clearing the last tag therefore REMOVES the config, putting
    // the row back on its built-in vocabulary rather than blanking it.
    tagIds.length ? onChange({ tagIds }) : onChange(null);

  const move = (index: number, delta: number) => {
    const next = [...chosen];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set(next);
  };

  return (
    <div className="space-y-2 border-t px-2.5 py-2">
      {chosen.length ? (
        <ol className="space-y-1">
          {chosen.map((id, i) => {
            const label = labelFor(id);
            return (
              <li key={id} className="flex items-center gap-1">
                {isPending ? (
                  <Skeleton className="h-3 w-24 flex-1" />
                ) : (
                  <span
                    className={`min-w-0 flex-1 truncate text-xs ${
                      label ? "" : "italic text-muted-foreground"
                    }`}
                  >
                    {/* Only reachable once the list has actually loaded: a tag
                        deleted since it was picked. Named rather than hidden —
                        the storefront already drops it, so a silent
                        disappearance would leave the merchant unable to tidy
                        the row. */}
                    {label ?? "Deleted tag"}
                  </span>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={`Move ${label ?? "tag"} up`}
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
                  aria-label={`Move ${label ?? "tag"} down`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => set(chosen.filter((c) => c !== id))}
                  aria-label={`Remove ${label ?? "tag"}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ol>
      ) : (
        <PartHint>
          Showing the built-in age list. Pick your own tags to control which
          chips appear, in your own order.
        </PartHint>
      )}

      {/* Capped to match the API, which refuses more: a chip row is a facet, and
          thirty of them is a tag list with extra steps. */}
      {chosen.length < 12 ? (
        <select
          className="h-7 w-full rounded-md border bg-background px-1.5 text-xs"
          value=""
          // Same distinction as the labels above: an empty dropdown reads as
          // "you have no tags", which is a different and more discouraging
          // claim than "not loaded yet".
          disabled={isPending}
          onChange={(e) => e.target.value && set([...chosen, e.target.value])}
        >
          <option value="">{isPending ? "Loading tags…" : "Add a tag…"}</option>
          {unchosen.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
