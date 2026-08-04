"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import {
  CollectionRow,
  type CollectionRowValue,
} from "@/components/ecommerce/collections/collection-row";

/**
 * Edit-in-place collections panel. Takes over the Customize rail — never a
 * modal: the live preview must stay visible so reordering or hiding a category
 * repaints the store header and home chips as you go.
 *
 * Like the slides panel it owns no persistence. Collections are Category docs
 * rather than settings, so the page's Save diffs this list against the last
 * saved one and issues only the calls that changed (see `useCustomizeDraft`).
 */
export function CollectionsPanel({
  collections,
  setCollections,
  onClose,
}: {
  collections: CollectionRowValue[];
  setCollections: (v: CollectionRowValue[]) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patch = (i: number, p: Partial<CollectionRowValue>) =>
    setCollections(collections.map((c, idx) => (idx === i ? { ...c, ...p } : c)));
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= collections.length) return;
    const next = [...collections];
    [next[i], next[t]] = [next[t], next[i]];
    setCollections(next);
  };

  return (
    <Card className="animate-in fade-in slide-in-from-left-6 flex h-full min-h-0 flex-col gap-0 p-0 shadow-none duration-200">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to store parts"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Collections</h3>
          <p className="text-xs text-muted-foreground">
            Rename, reorder, or hide — the preview updates as you go.
          </p>
        </div>
      </div>

      {/* Rows — fills the fixed-height rail; header and footer stay pinned. */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {collections.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-muted-foreground">
            No categories yet. Create them under Products → Categories.
          </p>
        ) : (
          collections.map((c, i) => (
            <CollectionRow
              key={c._id}
              value={c}
              compact
              isFirst={i === 0}
              isLast={i === collections.length - 1}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onDisplayNameChange={(v) => patch(i, { displayName: v })}
              onToggleListed={(isListed) => patch(i, { isListed })}
            />
          ))
        )}
      </div>

      <div className="flex items-center gap-3 border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Saved with the rest of the page.
        </p>
        <Button size="sm" className="ml-auto" onClick={onClose}>
          Done
        </Button>
      </div>
    </Card>
  );
}
