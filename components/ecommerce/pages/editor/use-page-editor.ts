"use client";
// coding-standard: maintained

import { useCallback, useMemo, useRef, useState } from "react";
import type { SectionType } from "@/lib/storefront-builder/section-specs";
import type { StorefrontPage } from "@/services/api";
import { record, redo as redoStep, startHistory, undo as undoStep, type History } from "./history";
import {
  duplicateSection,
  moveSection,
  moveSectionTo,
  newBlock,
  newSection,
  removeSection,
  pageContextOf,
  savableSections,
  type EditorDevice,
  type EditorSection,
} from "./section-instances";
import type { StoreFacts } from "./section-defaults";

/** Edits to one section closer together than this are one undo step. */
const MERGE_WINDOW_MS = 1000;

export interface PageEditor {
  sections: EditorSection[];
  /** What a draft save would send right now — see `savableSections`. */
  savable: EditorSection[];
  selectedId: string | null;
  selected: EditorSection | null;
  /** Which screen the preview shows, and which value a responsive field edits. */
  device: EditorDevice;
  setDevice: (device: EditorDevice) => void;
  select: (id: string | null) => void;
  add: (type: SectionType) => void;
  update: (id: string, change: (section: EditorSection) => EditorSection) => void;
  move: (id: string, delta: -1 | 1) => void;
  /** Drag and drop: `id` to position `to` (`moveSectionTo`). */
  moveTo: (id: string, to: number) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  addBlock: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  /**
   * Replace every section with ones the server answered with — a discard, a
   * restore. Clears the history: the page it described no longer exists.
   */
  reset: (sections: EditorSection[]) => void;
}

/** The sections the editor opens with: the draft if there is one, otherwise what is live. */
export const loadedSections = (page: StorefrontPage): EditorSection[] =>
  structuredClone(page.draft?.sections ?? page.published?.sections ?? []);

/**
 * The page editor's working state: the sections with their undo history, which
 * one is selected, and the device being edited. Everything lives here, above the
 * rail and the preview, so opening one section's settings never discards
 * another's edit.
 */
export function usePageEditor(page: StorefrontPage, store?: StoreFacts): PageEditor {
  const [history, setHistory] = useState<History<EditorSection[]>>(() =>
    startHistory(loadedSections(page)),
  );
  // A page holding one section opens on that section's settings: the list would
  // be a single row whose only use is to be clicked, and every system page
  // (cart, checkout, product, …) and every new store page starts that way.
  // Decided once, when the editor opens — not from the current count, which
  // would reopen the settings the moment the merchant went back or deleted
  // their way down to one.
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    history.present.length === 1 ? history.present[0].id : null,
  );
  const [device, setDevice] = useState<EditorDevice>("desktop");
  // The last edit's section and time, to fold quick edits of one section into one step.
  const lastEdit = useRef<{ id: string; at: number } | null>(null);
  const sections = history.present;

  const change = useCallback(
    (next: (current: EditorSection[]) => EditorSection[], sectionId?: string) => {
      const now = Date.now();
      const previous = lastEdit.current;
      const merge = sectionId !== undefined && previous?.id === sectionId && now - previous.at < MERGE_WINDOW_MS;
      lastEdit.current = sectionId === undefined ? null : { id: sectionId, at: now };
      setHistory((current) => record(current, next(current.present), merge));
    },
    [],
  );

  // Built outside a state updater on purpose: the id is random, and React may run
  // an updater twice — the selection would then name a section that was not the
  // one inserted.
  const add = useCallback(
    (type: SectionType) => {
      const section = newSection(type, sections, store);
      const after = sections.findIndex((item) => item.id === selectedId);
      const at = after < 0 ? sections.length : after + 1;
      const next = [...sections.slice(0, at), section, ...sections.slice(at)];
      change(() => next);
      setSelectedId(section.id);
    },
    [change, sections, selectedId, store],
  );

  const update = useCallback(
    (id: string, edit: (section: EditorSection) => EditorSection) => {
      change((current) => current.map((section) => (section.id === id ? edit(section) : section)), id);
    },
    [change],
  );

  const move = useCallback(
    (id: string, delta: -1 | 1) => change((current) => moveSection(current, id, delta)),
    [change],
  );

  const moveTo = useCallback(
    (id: string, to: number) => change((current) => moveSectionTo(current, id, to)),
    [change],
  );

  const duplicate = useCallback(
    (id: string) => change((current) => duplicateSection(current, id)),
    [change],
  );

  const remove = useCallback(
    (id: string) => {
      change((current) => removeSection(current, id));
      setSelectedId((current) => (current === id ? null : current));
    },
    [change],
  );

  const addBlock = useCallback(
    (id: string) => {
      change((current) =>
        current.map((section) => {
          if (section.id !== id) return section;
          const taken = current.flatMap((item) => [item.id, ...(item.blocks ?? []).map((block) => block.id)]);
          return {
            ...section,
            blocks: [...(section.blocks ?? []), newBlock(section.type as SectionType, taken)],
          };
        }),
      );
    },
    [change],
  );

  const undo = useCallback(() => {
    lastEdit.current = null;
    setHistory(undoStep);
  }, []);

  const redo = useCallback(() => {
    lastEdit.current = null;
    setHistory(redoStep);
  }, []);

  const reset = useCallback((next: EditorSection[]) => {
    lastEdit.current = null;
    setHistory(startHistory(next));
  }, []);

  const context = pageContextOf(page);
  const savable = useMemo(() => savableSections(sections, context), [sections, context]);
  const selected = sections.find((section) => section.id === selectedId) ?? null;

  return {
    sections,
    savable,
    selectedId,
    selected,
    device,
    setDevice,
    select: setSelectedId,
    add,
    update,
    move,
    moveTo,
    duplicate,
    remove,
    addBlock,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    reset,
  };
}
