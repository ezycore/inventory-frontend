"use client";
// coding-standard: maintained

import { useCallback, useMemo, useState } from "react";
import type { SectionType } from "@/lib/storefront-builder/section-specs";
import type { StorefrontPage } from "@/services/api";
import {
  duplicateSection,
  moveSection,
  newBlock,
  newSection,
  removeSection,
  savableSections,
  type EditorDevice,
  type EditorSection,
} from "./section-instances";

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
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  addBlock: (id: string) => void;
}

/** The sections the editor opens with: the draft if there is one, otherwise what is live. */
export const loadedSections = (page: StorefrontPage): EditorSection[] =>
  structuredClone(page.draft?.sections ?? page.published?.sections ?? []);

/**
 * The page editor's working state: the sections, which one is selected, and the
 * device being edited. Everything lives here, above the rail and the preview,
 * so opening one section's settings never discards another's edit.
 *
 * Saving is not in here yet (Phase 3, step 4); `savable` is what it will send.
 */
export function usePageEditor(page: StorefrontPage): PageEditor {
  const [sections, setSections] = useState(() => loadedSections(page));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<EditorDevice>("desktop");

  // Built outside a state updater on purpose: the id is random, and React may run
  // an updater twice — the selection would then name a section that was not the
  // one inserted.
  const add = useCallback(
    (type: SectionType) => {
      const section = newSection(type, sections);
      const after = sections.findIndex((item) => item.id === selectedId);
      const at = after < 0 ? sections.length : after + 1;
      setSections([...sections.slice(0, at), section, ...sections.slice(at)]);
      setSelectedId(section.id);
    },
    [sections, selectedId],
  );

  const update = useCallback((id: string, change: (section: EditorSection) => EditorSection) => {
    setSections((current) => current.map((section) => (section.id === id ? change(section) : section)));
  }, []);

  const move = useCallback((id: string, delta: -1 | 1) => {
    setSections((current) => moveSection(current, id, delta));
  }, []);

  const duplicate = useCallback((id: string) => {
    setSections((current) => duplicateSection(current, id));
  }, []);

  const remove = useCallback((id: string) => {
    setSections((current) => removeSection(current, id));
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const addBlock = useCallback((id: string) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) return section;
        const taken = current.flatMap((item) => [item.id, ...(item.blocks ?? []).map((block) => block.id)]);
        return {
          ...section,
          blocks: [...(section.blocks ?? []), newBlock(section.type as SectionType, taken)],
        };
      }),
    );
  }, []);

  const savable = useMemo(() => savableSections(sections), [sections]);
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
    duplicate,
    remove,
    addBlock,
  };
}
