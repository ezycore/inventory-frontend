"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import Link from "next/link";
import { Info, Search } from "lucide-react";
import { useLiveStoreSettings } from "@/components/ecommerce/use-live-store-settings";
import { useHasPermission } from "@/hooks/use-has-permission";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { resolveFilterSettings } from "@/lib/storefront-filters";
import {
  useProductOrder,
  useResetProductOrder,
  useSaveProductOrder,
  type ProductOrderTarget,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import { DragHandle, DropLine } from "@/ui/components/drag-handle";
import { Input } from "@/ui/components/input";
import { useDragReorder } from "@/ui/hooks/use-drag-reorder";
import { cn } from "@/ui/lib/utils";
import { ArrangeHeader } from "./arrange-header";
import { PlacedRow, UnplacedRow } from "./arrange-rows";
import {
  isDirty,
  matchesSearch,
  movePlaced,
  movePlacedToPosition,
  place,
  placeAll,
  placedIds,
  unplace,
  type ArrangeState,
} from "./arrange-state";
import { MoveToPositionDialog } from "./move-to-position-dialog";

/**
 * Arrange one storefront listing — All products, a category or a tag
 * (inventory-backend `docs/plan/storefront-product-order.md` §7).
 *
 * The working copy is `draft`; `null` means "the same as the server". Saving
 * seeds the query cache with what the server stored and drops the draft, so
 * ids the server refused (a product deleted since the screen loaded) vanish on
 * save instead of lingering until a reload.
 */
export function ArrangeProducts({
  target,
  title,
  backHref,
  backLabel,
  storeHref,
}: {
  target: ProductOrderTarget;
  title: string;
  backHref: string;
  backLabel: string;
  storeHref?: string;
}) {
  const { data, isLoading } = useProductOrder(target);
  const save = useSaveProductOrder(target);
  const reset = useResetProductOrder(target);
  const readOnly = !useHasPermission("storefront.manage");
  const { data: settings } = useLiveStoreSettings();
  const defaultSort = resolveFilterSettings(settings?.nav?.filters).sort.default;

  const saved = useMemo<ArrangeState>(
    () => ({ placed: data?.placed ?? [], unplaced: data?.unplaced ?? [] }),
    [data],
  );
  const [draft, setDraft] = useState<ArrangeState | null>(null);
  const [search, setSearch] = useState("");
  const [positionFor, setPositionFor] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const state = draft ?? saved;
  const dirty = draft !== null && isDirty(draft, saved);
  useUnsavedChangesWarning(dirty);

  const edit = (next: ArrangeState, message: string) => {
    setDraft(next);
    setAnnouncement(message);
  };
  const moveTo = (from: number, to: number) =>
    edit(
      movePlaced(state, from, to),
      `${state.placed[from]?.name} moved to position ${to + 1} of ${state.placed.length}.`,
    );
  const { listRef, drag, handleProps } = useDragReorder(moveTo);

  const searching = search.trim() !== "";
  const placed = state.placed.map((row, index) => ({ row, index })).filter(({ row }) => matchesSearch(row, search));
  const unplaced = state.unplaced
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => matchesSearch(row, search));
  const canDrag = !readOnly && !searching;

  if (isLoading || !data) {
    return <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">Loading products…</div>;
  }

  return (
    <div className="space-y-4">
      <ArrangeHeader
        title={title}
        backHref={backHref}
        backLabel={backLabel}
        storeHref={storeHref}
        hasCustomOrder={data.hasCustomOrder}
        dirty={dirty}
        readOnly={readOnly}
        saving={save.isPending || reset.isPending}
        onSave={() => save.mutate(placedIds(state), { onSuccess: () => setDraft(null) })}
        onDiscard={() => setDraft(null)}
        onReset={() => reset.mutate(undefined, { onSuccess: () => setDraft(null) })}
      />

      {settings && defaultSort !== "featured" ? (
        // Q3: a saved order IS the "Featured" sort. A store that opens on another
        // sort shows shoppers that one, so the arrangement would look ignored.
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <Info className="mt-0.5 h-4 w-4 flex-none" />
          <p className="min-w-0 flex-1">
            Your store opens its product lists on a different sort, so shoppers only see this order when
            they choose <strong>Featured</strong>. Make Featured the default sort to show it first.
          </p>
          <Link
            href="/ecommerce/customize?part=filters"
            className="flex-none text-xs font-semibold text-primary hover:underline"
          >
            Customize → Filters & sort
          </Link>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Shoppers see your order first, then everything not placed yet. Products that are out of stock always
        show after the ones they can buy.
      </p>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Find a product"
          aria-label="Find a product"
          className="pl-8"
        />
      </div>
      {searching && !readOnly ? (
        <p className="text-xs text-muted-foreground">Clear the search to drag. The ⋯ menu still moves products.</p>
      ) : null}

      <section className="space-y-2" aria-label="Your order">
        <h2 className="text-sm font-semibold">
          Your order <span className="font-normal text-muted-foreground">· {state.placed.length}</span>
        </h2>
        {state.placed.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Nothing placed yet — shoppers see the default order. Add products from below
            {state.unplaced.length > 0 ? ", or start from the current order." : "."}
          </p>
        ) : (
          <ol ref={listRef} className="space-y-1">
            {placed.map(({ row, index }) => {
              const dragging = drag?.from === index;
              const moving = drag !== null && drag.to !== drag.from;
              return (
                <li
                  key={row._id}
                  data-drag-row
                  className={cn("relative", dragging && "z-10 shadow-lg")}
                  style={dragging ? { transform: `translateY(${drag.offset}px)` } : undefined}
                >
                  {moving && drag.to < drag.from && index === drag.to ? <DropLine edge="top" /> : null}
                  <PlacedRow
                    row={row}
                    index={index}
                    count={state.placed.length}
                    readOnly={readOnly}
                    handle={
                      canDrag ? (
                        <DragHandle
                          label={row.name}
                          dragging={dragging}
                          {...handleProps(index, state.placed.length)}
                        />
                      ) : null
                    }
                    onMove={(to) => moveTo(index, to)}
                    onMoveToPosition={() => setPositionFor(index)}
                    onRemove={() => edit(unplace(state, index), `${row.name} removed from your order.`)}
                  />
                  {moving && drag.to > drag.from && index === drag.to ? <DropLine edge="bottom" /> : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {state.unplaced.length > 0 ? (
        <section className="space-y-2" aria-label="Not placed yet">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              Not placed yet <span className="font-normal text-muted-foreground">· {state.unplaced.length}</span>
            </h2>
            {readOnly ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => edit(placeAll(state), `${state.unplaced.length} products added to your order.`)}
              >
                {state.placed.length === 0 ? "Start from the current order" : "Add all below your order"}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            In the order shoppers see them now, after your order. New products land here.
          </p>
          <ul className="space-y-1">
            {unplaced.map(({ row, index }) => (
              <li key={row._id}>
                <UnplacedRow
                  row={row}
                  readOnly={readOnly}
                  onPlace={(where) =>
                    edit(place(state, index, where), `${row.name} added to the ${where} of your order.`)
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.truncated ? (
        <p className="text-xs text-muted-foreground">
          This list holds more products than one order can place (5,000). The rest show after your order.
        </p>
      ) : null}

      {positionFor !== null && state.placed[positionFor] ? (
        <MoveToPositionDialog
          name={state.placed[positionFor].name}
          current={positionFor + 1}
          count={state.placed.length}
          onMove={(position) =>
            edit(
              movePlacedToPosition(state, positionFor, position),
              `${state.placed[positionFor].name} moved to position ${position}.`,
            )
          }
          onClose={() => setPositionFor(null)}
        />
      ) : null}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
