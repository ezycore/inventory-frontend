"use client";
// coding-standard: maintained

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";
import {
  useDiscardStorefrontPageDraft,
  usePublishStorefrontPage,
  useRestoreStorefrontPageRevision,
  useUnpublishStorefrontPage,
  type StorefrontPage,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { StatusBadge } from "@/ui/components/status-badge";
import { OrderConfirmDialog } from "@/components/ecommerce/orders/order-confirm-dialog";
import { AddSectionDialog } from "./add-section-dialog";
import { EditorToolbar } from "./editor-toolbar";
import { PagePreviewFrame } from "./page-preview-frame";
import { PageSettingsDialog } from "./page-settings-dialog";
import { RevisionsDialog } from "./revisions-dialog";
import { SectionInspector } from "./section-inspector";
import { SectionTree } from "./section-tree";
import { usePageAutosave } from "./use-page-autosave";
import { loadedSections, usePageEditor } from "./use-page-editor";
import { useUndoShortcuts } from "./use-undo-shortcuts";

/** Which sections a page may hold is decided by what kind of page it is. */
const contextOf = (page: StorefrontPage): SectionPageContext =>
  page.kind === "system" ? (page.systemKey ?? "home") : page.kind;

/**
 * The page editor (plan §13): the page's sections on the left — or, with one
 * open, its settings — and the page itself on the right, redrawn as it changes.
 * The draft saves itself a moment after each edit; publishing makes it live.
 *
 * `page` is the page as the server last answered (the route reads it from the
 * query cache, which every write updates), so the toolbar always reflects the
 * saved draft. The sections being edited live in `usePageEditor`.
 */
export function PageEditor({ page }: { page: StorefrontPage }) {
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  const editor = usePageEditor(page);
  const autosave = usePageAutosave(page, editor.savable);
  useUndoShortcuts(editor.undo, editor.redo);

  const [adding, setAdding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirming, setConfirming] = useState<"discard" | "unpublish" | null>(null);

  const publish = usePublishStorefrontPage();
  const unpublish = useUnpublishStorefrontPage();
  const discard = useDiscardStorefrontPageDraft();
  const restore = useRestoreStorefrontPageRevision();
  const busy = publish.isPending || unpublish.isPending || discard.isPending || restore.isPending;
  const { selected } = editor;

  // The server replaced the draft: show exactly what it answered with.
  const takeServerDraft = (next: StorefrontPage | undefined) => {
    if (!next) return;
    autosave.adopt(next);
    editor.reset(loadedSections(next));
  };

  const onPublish = async () => {
    // Publish takes the saved draft, so the edits on screen go in first.
    if (!(await autosave.flush())) return;
    publish.mutate(page._id, { onSuccess: (response) => response.data && autosave.adopt(response.data) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/ecommerce/pages"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Pages
          </Link>
          <h1 className="min-w-0 truncate text-xl font-bold tracking-tight">{page.title}</h1>
          <StatusBadge status={page.status} />
        </div>
        <EditorToolbar
          page={page}
          autosave={autosave}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          busy={busy}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onOpenHistory={() => setHistoryOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onDiscard={() => setConfirming("discard")}
          onUnpublish={() => setConfirming("unpublish")}
          onPublish={() => void onPublish()}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[440px_minmax(0,1fr)]">
        {/* The rail scrolls inside a fixed height, so a long settings panel never
            pushes the preview out of view. `min-w-0` on both columns keeps a
            stacked phone layout from being sized by its widest child. */}
        <div className="flex min-w-0 flex-col overflow-y-auto rounded-xl border bg-card p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-11rem)]">
          {selected ? (
            <SectionInspector
              key={selected.id}
              section={selected}
              device={editor.device}
              onChange={(section) => editor.update(section.id, () => section)}
              onAddBlock={() => editor.addBlock(selected.id)}
              onClose={() => editor.select(null)}
            />
          ) : (
            <SectionTree
              sections={editor.sections}
              selectedId={editor.selectedId}
              onSelect={editor.select}
              onMove={editor.move}
              onToggle={(id) => editor.update(id, (section) => ({ ...section, enabled: !section.enabled }))}
              onDuplicate={editor.duplicate}
              onRemove={editor.remove}
              onAdd={() => setAdding(true)}
            />
          )}
        </div>

        <div className="min-w-0 lg:sticky lg:top-6">
          <PagePreviewFrame
            slug={slug}
            pageSlug={page.slug}
            sections={editor.sections}
            device={editor.device}
            onDeviceChange={editor.setDevice}
            selectedId={editor.selectedId}
            onSelect={editor.select}
            height="calc(100vh - 13.5rem)"
          />
        </div>
      </div>

      <AddSectionDialog open={adding} onOpenChange={setAdding} context={contextOf(page)} onAdd={editor.add} />
      <PageSettingsDialog page={page} open={settingsOpen} onOpenChange={setSettingsOpen} />
      <RevisionsDialog
        page={page}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        restoring={restore.isPending}
        onRestore={(version) =>
          restore.mutate(
            { id: page._id, version },
            {
              onSuccess: (response) => {
                takeServerDraft(response.data);
                setHistoryOpen(false);
              },
            },
          )
        }
      />
      <OrderConfirmDialog
        open={confirming === "discard"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Discard your changes?"
        description="The page goes back to what is live now. Everything changed since the last publish is lost."
        actionLabel="Discard"
        destructive
        onConfirm={() => {
          setConfirming(null);
          discard.mutate(page._id, { onSuccess: (response) => takeServerDraft(response.data) });
        }}
      />
      <OrderConfirmDialog
        open={confirming === "unpublish"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Unpublish this page?"
        description="Shoppers get a page-not-found at its address until you publish again. Your content stays here."
        actionLabel="Unpublish"
        destructive
        onConfirm={() => {
          setConfirming(null);
          unpublish.mutate(page._id);
        }}
      />
    </div>
  );
}
