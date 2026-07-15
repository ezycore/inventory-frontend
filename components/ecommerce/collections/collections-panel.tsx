"use client";
// coding-standard: maintained

import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useReorderCollections, useUpdateCollection } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import {
  CollectionRow,
  type CollectionRowValue,
} from "@/components/ecommerce/collections/collection-row";

/**
 * Edit-in-place collections panel. Takes over the Customize left rail — never a
 * modal: the live preview must stay visible so reordering/hiding repaints the
 * store header and home chips as you go (the draft is lifted to
 * CustomizeWorkspace, which streams it to the preview iframe).
 *
 * Owns persistence: "Save collections" diffs the draft against the on-open
 * snapshot and issues only the calls that changed (one reorder + one update per
 * touched row); Cancel/back/Esc restore the snapshot.
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
  const update = useUpdateCollection();
  const reorder = useReorderCollections();
  const snapshot = useRef<CollectionRowValue[]>(
    JSON.parse(JSON.stringify(collections)),
  );

  const cancel = () => {
    setCollections(snapshot.current);
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (i: number, p: Partial<CollectionRowValue>) =>
    setCollections(collections.map((c, idx) => (idx === i ? { ...c, ...p } : c)));
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= collections.length) return;
    const next = [...collections];
    [next[i], next[t]] = [next[t], next[i]];
    setCollections(next);
  };

  const base = snapshot.current;
  const orderChanged =
    collections.length !== base.length ||
    collections.some((c, i) => c._id !== base[i]?._id);
  const touched = collections.filter((c) => {
    const was = base.find((b) => b._id === c._id);
    return (
      !!was && (was.displayName !== c.displayName || was.isListed !== c.isListed)
    );
  });
  const dirty = orderChanged || touched.length > 0;
  const saving = update.isPending || reorder.isPending;

  const submit = async () => {
    try {
      // Field edits first: reorder's response reseeds the collections cache, so
      // running it last means the list the UI keeps already has these applied.
      for (const c of touched) {
        await update.mutateAsync({
          id: c._id,
          displayName: c.displayName.trim(),
          isListed: c.isListed,
        });
      }
      if (orderChanged) await reorder.mutateAsync(collections.map((c) => c._id));
      onClose();
    } catch {
      // Error toast already shown; stay open so nothing is lost.
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-left-6 flex h-full min-h-0 flex-col gap-0 p-0 shadow-none duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <button
          type="button"
          onClick={cancel}
          aria-label="Back (discard changes)"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Collections</h3>
          <p className="text-[11px] text-muted-foreground">
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
              disabled={saving}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onDisplayNameChange={(v) => patch(i, { displayName: v })}
              onToggleListed={(isListed) => patch(i, { isListed })}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
        {dirty && (
          <span className="mr-auto text-[11px] text-muted-foreground">
            Unsaved changes
          </span>
        )}
        <Button variant="outline" size="sm" onClick={cancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save collections"}
        </Button>
      </div>
    </Card>
  );
}
