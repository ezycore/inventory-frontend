"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { AlertTriangle, Check, History, Loader2, Redo2, Settings2, Undo2 } from "lucide-react";
import type { StorefrontPage } from "@/services/api";
import { Button } from "@/ui/components/button";
import type { PageAutosave } from "./use-page-autosave";

function IconButton({
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
      className="h-8 w-8"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/** Where the draft stands: saved, waiting, saving, or why it is not. */
export function SaveStatus({ autosave }: { autosave: PageAutosave }) {
  const { problem, saving, dirty } = autosave;
  if (problem) {
    return (
      <span
        role="status"
        className={
          problem.kind === "conflict"
            ? "flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
            : "flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400"
        }
      >
        <AlertTriangle className="h-3.5 w-3.5 flex-none" aria-hidden />
        {problem.message}
        {problem.kind === "conflict" ? (
          <button type="button" onClick={() => window.location.reload()} className="font-medium underline">
            Reload
          </button>
        ) : (
          <button type="button" onClick={() => void autosave.flush()} className="font-medium underline">
            Try again
          </button>
        )}
      </span>
    );
  }
  return (
    <span role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {saving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Saving…
        </>
      ) : dirty ? (
        "Unsaved changes"
      ) : (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden /> Draft saved
        </>
      )}
    </span>
  );
}

/**
 * The editor's actions: save status, undo and redo, history, page settings,
 * and the page's lifecycle — discard, unpublish, publish.
 *
 * Publish reads the page as the server last answered: a draft there, or edits
 * not yet saved here, are changes to publish.
 */
export function EditorToolbar({
  page,
  autosave,
  canUndo,
  canRedo,
  busy,
  onUndo,
  onRedo,
  onOpenHistory,
  onOpenSettings,
  onDiscard,
  onUnpublish,
  onPublish,
}: {
  page: StorefrontPage;
  autosave: PageAutosave;
  canUndo: boolean;
  canRedo: boolean;
  /** A lifecycle action is in flight. */
  busy: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onDiscard: () => void;
  onUnpublish: () => void;
  onPublish: () => void;
}) {
  const hasChanges = page.draft !== null || autosave.dirty;
  const live = page.status === "published";
  const publishLabel = live
    ? hasChanges
      ? "Publish changes"
      : "Published"
    : page.status === "disabled" && !hasChanges
      ? "Turn back on"
      : "Publish";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <SaveStatus autosave={autosave} />
      <div className="ml-auto flex flex-wrap items-center gap-1">
        <IconButton label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </IconButton>
        <Button type="button" variant="ghost" size="sm" onClick={onOpenHistory}>
          <History className="mr-1.5 h-4 w-4" />
          History
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onOpenSettings}>
          <Settings2 className="mr-1.5 h-4 w-4" />
          Page settings
        </Button>
        {page.draft && page.published ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onDiscard}>
            Discard changes
          </Button>
        ) : null}
        {live ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onUnpublish}>
            Unpublish
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={busy || autosave.saving || autosave.problem !== null || (live && !hasChanges)}
          onClick={onPublish}
        >
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          {publishLabel}
        </Button>
      </div>
    </div>
  );
}
