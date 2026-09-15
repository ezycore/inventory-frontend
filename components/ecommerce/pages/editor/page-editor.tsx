"use client";
// coding-standard: maintained

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";
import type { StorefrontPage } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { AddSectionDialog } from "./add-section-dialog";
import { PagePreviewFrame } from "./page-preview-frame";
import { SectionInspector } from "./section-inspector";
import { SectionTree } from "./section-tree";
import { usePageEditor } from "./use-page-editor";

/** Which sections a page may hold is decided by what kind of page it is. */
const contextOf = (page: StorefrontPage): SectionPageContext =>
  page.kind === "system" ? (page.systemKey ?? "home") : page.kind;

/**
 * The page editor (plan §13): the page's sections on the left — or, with one
 * open, its settings — and the page itself on the right, redrawn as it changes.
 *
 * All working state lives in `usePageEditor`, one level above the rail and the
 * preview, so switching between the list and a section never drops an edit.
 */
export function PageEditor({ page }: { page: StorefrontPage }) {
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  const editor = usePageEditor(page);
  const [adding, setAdding] = useState(false);
  const { selected } = editor;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          href="/ecommerce/pages"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Pages
        </Link>
        <h1 className="min-w-0 truncate text-xl font-bold tracking-tight">{page.title}</h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[440px_minmax(0,1fr)]">
        {/* The rail scrolls inside a fixed height, so a long settings panel never
            pushes the preview out of view. `min-w-0` on both columns keeps a
            stacked phone layout from being sized by its widest child. */}
        <div className="flex min-w-0 flex-col overflow-y-auto rounded-xl border bg-card p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-8.75rem)]">
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
          />
        </div>
      </div>

      <AddSectionDialog open={adding} onOpenChange={setAdding} context={contextOf(page)} onAdd={editor.add} />
    </div>
  );
}
