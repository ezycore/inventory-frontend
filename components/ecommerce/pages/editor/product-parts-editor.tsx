"use client";
// coding-standard: maintained

import { useState } from "react";
import { Eye, EyeOff, Lock, Plus, Trash2 } from "lucide-react";
import { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import {
  ADDED_PRODUCT_PARTS,
  buyingOrderHolds,
  isLockedPart,
  isSinglePart,
  partTargets,
  type ProductPartKind,
} from "@/lib/storefront-builder/product-parts";
import type { CatalogProduct } from "@/lib/storefront-client";
import { Button } from "@/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { cn } from "@/ui/lib/utils";
import { newInstanceId, type EditorBlock, type EditorDevice, type EditorSection } from "./section-instances";
import { DragHandle, DropLine } from "@/ui/components/drag-handle";
import {
  ADD_DESCRIPTIONS,
  PART_LABELS,
  REFUSED,
  editorParts,
  kindOf,
  partLabel,
  singleId,
} from "./product-part-labels";
import { PartDetails } from "./product-part-details";
import { useDragReorder } from "@/ui/hooks/use-drag-reorder";

/**
 * The product page's column beside the photos, part by part — `product-main`'s
 * blocks, edited as one short list rather than the card-per-item list other
 * sections use, because most parts have nothing to set: the merchant is
 * arranging, not filling in.
 *
 * A page that never arranged its parts stores none and shows the column as it
 * always was (`editorParts`); the first change writes the whole list. Parts are
 * dragged by their handle (`useDragReorder`), hidden with the eye, and the
 * merchant's own parts are added and removed here. The ways to order are locked
 * on, and a move that would put the options or quantity below the buy buttons
 * is refused with a reason (`buyingOrderHolds`).
 */
export function ProductPartsEditor({
  section,
  device,
  previewProduct,
  onChange,
}: {
  section: EditorSection;
  device: EditorDevice;
  /** The product the preview is drawn around, for a part limited to some products. */
  previewProduct?: CatalogProduct | null;
  onChange: (section: EditorSection) => void;
}) {
  const parts = editorParts(section.blocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const max = SECTION_SPECS["product-main"].blocks.max;
  const specs = SECTION_SPECS["product-main"].blocks.settings;

  const save = (next: EditorBlock[]): boolean => {
    const holds = buyingOrderHolds(next.map((block) => ({ part: kindOf(block) })));
    setRefused(!holds);
    if (holds) onChange({ ...section, blocks: next });
    return holds;
  };
  const { listRef, drag, handleProps } = useDragReorder((from, to) => {
    const next = [...parts];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSelectedId(moved.id);
    setAnnouncement(save(next) ? `${partLabel(moved)} moved to position ${to + 1} of ${parts.length}.` : REFUSED);
  });
  const update = (id: string, settings: Record<string, unknown>) =>
    save(parts.map((block) => (block.id === id ? { ...block, settings } : block)));
  const toggle = (block: EditorBlock) => {
    const { hidden: _hidden, ...rest } = block.settings;
    update(block.id, block.settings.hidden ? rest : { ...rest, hidden: true });
  };
  const add = (part: ProductPartKind) => {
    const id = isSinglePart(part) ? singleId(part) : newInstanceId(part, parts.map((block) => block.id));
    if (save([...parts, { id, settings: { part } }])) setSelectedId(id);
  };
  const remove = (id: string) => {
    save(parts.filter((block) => block.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = parts.find((block) => block.id === selectedId) ?? null;
  const present = new Set(parts.map(kindOf));

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold">Beside the photos</h3>
        <p className="text-xs text-muted-foreground">
          Drag to change the order shoppers see. The photos keep their own column.
        </p>
      </div>

      <ol ref={listRef} className="space-y-1">
        {parts.map((block, index) => {
          const kind = kindOf(block);
          const hidden = block.settings.hidden === true && !isLockedPart(kind);
          const untitled = kind === "collapsible" && !block.settings.title;
          const note = [
            kind === "collapsible" ? "Collapsible text" : null,
            partTargets(block.settings) ? "On some products" : null,
          ]
            .filter(Boolean)
            .join(" · ");
          const dragging = drag?.from === index;
          const moving = drag !== null && drag.to !== drag.from;
          return (
            <li
              key={block.id}
              data-drag-row
              className={cn("relative", dragging && "z-10")}
              style={dragging ? { transform: `translateY(${drag.offset}px)` } : undefined}
            >
              {moving && drag.to < drag.from && index === drag.to ? <DropLine edge="top" /> : null}
              <div
                className={cn(
                  "flex items-center gap-0.5 rounded-md border py-1 pl-0.5 pr-1",
                  block.id === selectedId ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60",
                  dragging && "border-primary bg-card shadow-lg",
                )}
              >
                <DragHandle label={partLabel(block)} dragging={dragging} {...handleProps(index, parts.length)} />
                <button
                  type="button"
                  onClick={() => setSelectedId(block.id)}
                  aria-current={block.id === selectedId || undefined}
                  className="min-w-0 flex-1 py-0.5 text-left"
                >
                  <span className={cn("block truncate text-sm font-medium", hidden && "text-muted-foreground")}>
                    {partLabel(block)}
                  </span>
                  {hidden ? (
                    <span className="block text-xs text-muted-foreground">Hidden from shoppers</span>
                  ) : untitled ? (
                    <span className="block text-xs text-amber-600 dark:text-amber-400">Add a title — it shows nothing until then</span>
                  ) : note ? (
                    <span className="block text-xs text-muted-foreground">{note}</span>
                  ) : null}
                </button>
                {isLockedPart(kind) ? (
                  <span className="flex h-7 w-7 items-center justify-center text-muted-foreground" title="Always shown">
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                    <span className="sr-only">Always shown</span>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    aria-label={`${hidden ? "Show" : "Hide"} ${partLabel(block)}`}
                    title={hidden ? "Show" : "Hide"}
                    onClick={() => toggle(block)}
                  >
                    {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                )}
                {(ADDED_PRODUCT_PARTS as readonly string[]).includes(kind) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-600"
                    aria-label={`Remove ${partLabel(block)}`}
                    title="Remove"
                    onClick={() => remove(block.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
              {moving && drag.to > drag.from && index === drag.to ? <DropLine edge="bottom" /> : null}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {refused ? (
        <p role="status" className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {REFUSED}
        </p>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="w-full border-dashed" disabled={parts.length >= max}>
            <Plus className="mr-2 h-4 w-4" />
            Add a part
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {ADDED_PRODUCT_PARTS.map((part) => (
            <DropdownMenuItem
              key={part}
              disabled={isSinglePart(part) && present.has(part)}
              onSelect={() => add(part)}
              className="flex-col items-start gap-0.5"
            >
              <span className="font-medium">{PART_LABELS[part]}</span>
              <span className="text-xs text-muted-foreground">
                {isSinglePart(part) && present.has(part) ? "Already on the page" : ADD_DESCRIPTIONS[part]}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Keyed by part: the products field holds its own mode ("categories"
          before any is chosen), which must not carry over to the next part. */}
      {selected ? (
        <div key={selected.id} className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <h4 className="text-sm font-semibold">{partLabel(selected)}</h4>
          <PartDetails
            block={selected}
            section={section}
            device={device}
            specs={specs}
            previewProduct={previewProduct}
            onChange={(settings) => update(selected.id, settings)}
          />
        </div>
      ) : null}
    </div>
  );
}
