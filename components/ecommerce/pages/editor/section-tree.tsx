"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";
import { Button } from "@/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { OrderConfirmDialog } from "@/components/ecommerce/orders/order-confirm-dialog";
import { cn } from "@/ui/lib/utils";
import { isCoreSection, sectionLabel } from "./section-catalogue";
import { isComplete, type EditorSection } from "./section-instances";
import { DragHandle, DropLine } from "@/ui/components/drag-handle";
import { useDragReorder } from "@/ui/hooks/use-drag-reorder";

const rowButton = "h-7 w-7 text-muted-foreground hover:text-foreground";

function RowButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Button type="button" variant="ghost" size="icon" className={rowButton} aria-label={label} title={label} onClick={onClick}>
      {children}
    </Button>
  );
}

/**
 * The page's sections in order — the rail's list.
 *
 * A row's name opens the section's settings. Its handle drags it to a new place
 * (or, focused, moves it with the arrow keys — `useDragReorder`); the eye hides
 * it; everything else is in its ⋯ menu, which also carries Move up and Move down
 * for anyone who would rather not drag. An unfinished section says so, because
 * it is not being saved until it is finished (`savableSections`).
 */
export function SectionTree({
  sections,
  selectedId,
  onSelect,
  onMove,
  onMoveTo,
  onToggle,
  onDuplicate,
  onRemove,
  onAdd,
  context,
}: {
  sections: EditorSection[];
  /** The page being edited, so a setting that page supplies is not reported missing. */
  context?: SectionPageContext;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onMoveTo: (id: string, to: number) => void;
  onToggle: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const [removing, setRemoving] = useState<EditorSection | null>(null);
  // Said aloud after a move: a screen reader does not see a row change places.
  const [announcement, setAnnouncement] = useState("");
  const { listRef, drag, handleProps } = useDragReorder((from, to) => {
    const section = sections[from];
    if (!section) return;
    onMoveTo(section.id, to);
    setAnnouncement(`${sectionLabel(section.type)} moved to position ${to + 1} of ${sections.length}.`);
  });

  return (
    <div className="space-y-3">
      {sections.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          This page is empty. Add a section to start.
        </p>
      ) : (
        <ol ref={listRef} className="space-y-1">
          {sections.map((section, index) => {
            const label = sectionLabel(section.type);
            const selected = section.id === selectedId;
            const complete = isComplete(section, context);
            const core = isCoreSection(section.type);
            const dragging = drag?.from === index;
            const moving = drag !== null && drag.to !== drag.from;
            return (
              <li
                key={section.id}
                data-drag-row
                className={cn("relative", dragging && "z-10")}
                style={dragging ? { transform: `translateY(${drag.offset}px)` } : undefined}
              >
                {moving && drag.to < drag.from && index === drag.to ? <DropLine edge="top" /> : null}
                <div
                  className={cn(
                    "flex items-center gap-0.5 rounded-md border py-1.5 pl-0.5 pr-1",
                    selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60",
                    dragging && "border-primary bg-card shadow-lg",
                  )}
                >
                  <DragHandle label={label} dragging={dragging} {...handleProps(index, sections.length)} />
                  <button
                    type="button"
                    onClick={() => onSelect(section.id)}
                    aria-current={selected || undefined}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className={cn("block truncate text-sm font-medium", !section.enabled && "text-muted-foreground")}>
                      {label}
                    </span>
                    {!complete ? (
                      <span className="block text-xs text-amber-600 dark:text-amber-400">Unfinished — not saved yet</span>
                    ) : !section.enabled ? (
                      <span className="block text-xs text-muted-foreground">Hidden from shoppers</span>
                    ) : section.visibility?.products ? (
                      <span className="block text-xs text-muted-foreground">On some products</span>
                    ) : null}
                  </button>
                  {/* A core section IS the page — the cart, the checkout, a content
                      page's body. It can be configured and moved, but hiding,
                      duplicating or removing it would leave an address the
                      storefront still serves with nothing on it, so those three
                      are not offered. The API refuses them too. */}
                  {core ? null : (
                    <RowButton label={section.enabled ? "Hide section" : "Show section"} onClick={() => onToggle(section.id)}>
                      {section.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </RowButton>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className={rowButton} aria-label={`More actions for ${label}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(section.id, -1)}>
                        <ArrowUp className="mr-2 h-4 w-4" />
                        Move up
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={index === sections.length - 1} onSelect={() => onMove(section.id, 1)}>
                        <ArrowDown className="mr-2 h-4 w-4" />
                        Move down
                      </DropdownMenuItem>
                      {core ? null : (
                        <>
                          <DropdownMenuItem onSelect={() => onDuplicate(section.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate section
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setRemoving(section)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove section
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {moving && drag.to > drag.from && index === drag.to ? <DropLine edge="bottom" /> : null}
              </li>
            );
          })}
        </ol>
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <Button type="button" variant="outline" className="w-full" onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add section
      </Button>

      <OrderConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing ? sectionLabel(removing.type) : "section"}?`}
        description="It comes off the page, along with everything in it. The live page keeps it until you publish."
        actionLabel="Remove"
        destructive
        onConfirm={() => {
          if (removing) onRemove(removing.id);
          setRemoving(null);
        }}
      />
    </div>
  );
}
