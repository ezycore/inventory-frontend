"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";
import { Button } from "@/ui/components/button";
import { OrderConfirmDialog } from "@/components/ecommerce/orders/order-confirm-dialog";
import { cn } from "@/ui/lib/utils";
import { isCoreSection, sectionLabel } from "./section-catalogue";
import { isComplete, type EditorSection } from "./section-instances";

function RowButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/**
 * The page's sections in order — the rail's list.
 *
 * A row's name opens the section's settings; its buttons move, hide, copy or
 * remove it without opening it. An unfinished section says so, because it is not
 * being saved until it is finished (`savableSections`).
 */
export function SectionTree({
  sections,
  selectedId,
  onSelect,
  onMove,
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
  onToggle: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const [removing, setRemoving] = useState<EditorSection | null>(null);

  return (
    <div className="space-y-3">
      {sections.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          This page is empty. Add a section to start.
        </p>
      ) : (
        <ol className="space-y-1">
          {sections.map((section, index) => {
            const selected = section.id === selectedId;
            const complete = isComplete(section, context);
            return (
              <li
                key={section.id}
                className={cn(
                  "flex items-center gap-0.5 rounded-md border px-2 py-1.5",
                  selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(section.id)}
                  aria-current={selected || undefined}
                  className="min-w-0 flex-1 text-left"
                >
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      !section.enabled && "text-muted-foreground",
                    )}
                  >
                    {sectionLabel(section.type)}
                  </span>
                  {!complete ? (
                    <span className="block text-xs text-amber-600 dark:text-amber-400">
                      Unfinished — not saved yet
                    </span>
                  ) : !section.enabled ? (
                    <span className="block text-xs text-muted-foreground">Hidden from shoppers</span>
                  ) : null}
                </button>
                <RowButton label="Move up" disabled={index === 0} onClick={() => onMove(section.id, -1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </RowButton>
                <RowButton
                  label="Move down"
                  disabled={index === sections.length - 1}
                  onClick={() => onMove(section.id, 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </RowButton>
                {/* A core section IS the page — the cart, the checkout, a content
                    page's body. It can be configured and moved, but hiding,
                    duplicating or removing it would leave an address the
                    storefront still serves with nothing on it, so those three
                    are not offered. The API refuses them too. */}
                {isCoreSection(section.type) ? null : (
                  <>
                    <RowButton
                      label={section.enabled ? "Hide section" : "Show section"}
                      onClick={() => onToggle(section.id)}
                    >
                      {section.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </RowButton>
                    <RowButton label="Duplicate section" onClick={() => onDuplicate(section.id)}>
                      <Copy className="h-3.5 w-3.5" />
                    </RowButton>
                    <RowButton label="Remove section" onClick={() => setRemoving(section)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </RowButton>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}

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
