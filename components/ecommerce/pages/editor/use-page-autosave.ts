"use client";
// coding-standard: maintained

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage, isApiError } from "@/lib/error-handling";
import { useSaveStorefrontPageDraft, type StorefrontPage } from "@/services/api";
import { savableSections, type EditorSection } from "./section-instances";
import { loadedSections } from "./use-page-editor";

/** How long after the last edit the draft saves. */
export const AUTOSAVE_DELAY_MS = 1200;

export interface SaveProblem {
  /** `conflict`: the draft moved on elsewhere; `invalid`: the backend refused a section; `failed`: anything else. */
  kind: "conflict" | "invalid" | "failed";
  message: string;
}

export interface PageAutosave {
  /** True while the sections on screen differ from the saved draft. */
  dirty: boolean;
  saving: boolean;
  problem: SaveProblem | null;
  /** Save now instead of waiting. Resolves `false` when it did not save — publish checks this first. */
  flush: () => Promise<boolean>;
  /** Take a page the server just answered with (publish, discard, restore) as the saved state. */
  adopt: (page: StorefrontPage) => void;
}

const savedStateOf = (page: StorefrontPage) => ({
  json: JSON.stringify(savableSections(loadedSections(page))),
  version: page.draftVersion,
});

function problemOf(error: unknown): SaveProblem {
  const code = isApiError(error) ? error.code : undefined;
  if (code === "STOREFRONT_PAGE_DRAFT_CONFLICT") {
    return {
      kind: "conflict",
      message: "This page was saved somewhere else. Reload to continue — edits made here since the last save are not saved.",
    };
  }
  if (code === "SECTION_INVALID" || code === "STOREFRONT_PAGE_TOO_LARGE") {
    return { kind: "invalid", message: getErrorMessage(error) };
  }
  return { kind: "failed", message: "Couldn't save your changes." };
}

/**
 * Saves the page's draft a moment after the merchant stops editing, and says
 * where that stands.
 *
 * `sections` is what a save would send (`PageEditor.savable`), so an unfinished
 * section never triggers one. Each save is pinned to the draft version this
 * editor last saw. One editor per page is assumed (owner decision, plan §17):
 * when the backend refuses a stale version, autosave stops and asks for a reload
 * rather than trying to merge. Content that failed to save is not retried until
 * it changes — or the merchant asks — so a refused section cannot loop.
 */
export function usePageAutosave(page: StorefrontPage, sections: EditorSection[]): PageAutosave {
  const { mutateAsync, isPending: saving } = useSaveStorefrontPageDraft();
  const [saved, setSaved] = useState(() => savedStateOf(page));
  const [failure, setFailure] = useState<(SaveProblem & { json: string }) | null>(null);
  const json = useMemo(() => JSON.stringify(sections), [sections]);
  const dirty = json !== saved.json;

  const flush = useCallback(async () => {
    if (!dirty) return true;
    try {
      const response = await mutateAsync({
        id: page._id,
        body: { sections, draftVersion: saved.version },
      });
      setSaved({ json, version: response.data?.draftVersion ?? saved.version + 1 });
      setFailure(null);
      return true;
    } catch (error) {
      setFailure({ ...problemOf(error), json });
      return false;
    }
  }, [dirty, json, mutateAsync, page._id, saved.version, sections]);

  const adopt = useCallback((next: StorefrontPage) => {
    setSaved(savedStateOf(next));
    setFailure(null);
  }, []);

  const blocked = saving || failure?.kind === "conflict" || failure?.json === json;
  useEffect(() => {
    if (!dirty || blocked) return;
    const timer = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dirty, blocked, flush]);

  // Leaving with unsaved edits asks first — the browser's own prompt.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return {
    dirty,
    saving,
    problem: failure ? { kind: failure.kind, message: failure.message } : null,
    flush,
    adopt,
  };
}
