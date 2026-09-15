// coding-standard: maintained
import type { SectionDefinition, SectionFieldSpec } from "@/lib/storefront-builder/field-specs";
import { SECTION_SPECS, type SectionType } from "@/lib/storefront-builder/section-specs";
import { readSettings } from "@/lib/storefront-builder/settings";
import type { StorefrontPageSection } from "@/services/api";
import { BLOCK_DEFAULTS, SECTION_DEFAULTS } from "./section-defaults";

/**
 * Pure operations on a page's sections, as the editor holds them.
 *
 * The editor keeps what the merchant is in the middle of — a section with no
 * picture yet, an FAQ item with no answer — but the backend refuses a draft over
 * one invalid field, and names it. So the rule is: **the editor holds anything,
 * a save sends only what reads** (`savableSections`), using the same readers the
 * storefront renders with.
 */

export type EditorSection = StorefrontPageSection;
export type EditorBlock = NonNullable<EditorSection["blocks"]>[number];
export type EditorDevice = "desktop" | "mobile";
type Settings = Record<string, unknown>;

/** The backend's id grammar for sections and blocks. */
const INSTANCE_ID = /^[A-Za-z0-9_-]{1,40}$/;
const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export const specOf = (type: string): SectionDefinition | undefined =>
  Object.hasOwn(SECTION_SPECS, type) ? SECTION_SPECS[type as SectionType] : undefined;

/** An id in the backend's grammar, unused by anything in `taken`. */
export function newInstanceId(prefix: string, taken: Iterable<string>, random = Math.random): string {
  const used = new Set(taken);
  const safe = prefix.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 30) || "s";
  for (;;) {
    let suffix = "";
    for (let i = 0; i < 6; i += 1) suffix += ID_ALPHABET[Math.floor(random() * ID_ALPHABET.length)];
    const id = `${safe}-${suffix}`;
    if (!used.has(id)) return id;
  }
}

const allIds = (sections: readonly EditorSection[]) =>
  sections.flatMap((section) => [section.id, ...(section.blocks ?? []).map((block) => block.id)]);

export function newBlock(type: SectionType, taken: Iterable<string>): EditorBlock {
  return { id: newInstanceId("item", taken), settings: { ...(BLOCK_DEFAULTS[type] ?? {}) } };
}

export function newSection(type: SectionType, existing: readonly EditorSection[]): EditorSection {
  const spec = SECTION_SPECS[type];
  const defaults = SECTION_DEFAULTS[type];
  const taken = allIds(existing);
  const id = newInstanceId(type, taken);
  taken.push(id);
  const blocks = defaults.blocks?.map((settings) => {
    const block = { id: newInstanceId("item", taken), settings: { ...settings } };
    taken.push(block.id);
    return block;
  });
  return {
    id,
    type,
    v: spec.v,
    enabled: true,
    settings: { ...defaults.settings },
    ...(blocks ? { blocks } : {}),
  };
}

const blockReads = (definition: SectionDefinition, block: EditorBlock) =>
  INSTANCE_ID.test(block.id) && definition.blocks !== undefined &&
  readSettings(definition.blocks.settings, block.settings) !== null;

/** True when the section would pass the backend as it stands, blocks included. */
export function isComplete(section: EditorSection): boolean {
  const definition = specOf(section.type);
  if (!definition || definition.v !== section.v || !INSTANCE_ID.test(section.id)) return false;
  if (readSettings(definition.settings, section.settings) === null) return false;
  return (section.blocks ?? []).every((block) => blockReads(definition, block));
}

/**
 * What a draft save sends: complete sections, each with only the blocks that
 * read. An unfinished item stays in the editor and simply is not saved yet.
 */
export function savableSections(sections: readonly EditorSection[]): EditorSection[] {
  return sections.flatMap((section) => {
    const definition = specOf(section.type);
    if (!definition || definition.v !== section.v || !INSTANCE_ID.test(section.id)) return [];
    if (readSettings(definition.settings, section.settings) === null) return [];
    if (!section.blocks) return [section];
    return [{ ...section, blocks: section.blocks.filter((block) => blockReads(definition, block)) }];
  });
}

const isPlainObject = (value: unknown): value is Settings =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Nothing typed in — what clearing a field leaves behind. */
const isBlank = (value: unknown) => value === undefined || value === null || value === "";

/** The value a field shows for a device. A phone shows the desktop value until it has its own. */
export function fieldValue(settings: Settings, key: string, spec: SectionFieldSpec, device: EditorDevice): unknown {
  const value = settings[key];
  if (!spec.responsive) return value;
  if (!isPlainObject(value)) return undefined;
  return device === "mobile" && value.mobile !== undefined ? value.mobile : value.base;
}

/** True when the phone has a value of its own for a responsive field. */
export function hasPhoneValue(settings: Settings, key: string, spec: SectionFieldSpec): boolean {
  const value = settings[key];
  return Boolean(spec.responsive && isPlainObject(value) && value.mobile !== undefined);
}

/**
 * Settings with one field set for a device.
 *
 * Blank clears. An optional field's key is removed rather than stored empty (the
 * backend refuses `""` where it expects a link); a required field keeps its blank
 * so the section reads as unfinished. On a responsive field the desktop value is
 * the base; a phone value is an override, and clearing it goes back to the
 * desktop's — while a phone value with no desktop one becomes the base, because
 * a lone override is not a valid value.
 */
export function withFieldValue(
  settings: Settings,
  key: string,
  spec: SectionFieldSpec,
  value: unknown,
  device: EditorDevice,
): Settings {
  const next = { ...settings };
  const blank = isBlank(value) || (Array.isArray(value) && value.length === 0 && spec.optional);

  if (!spec.responsive) {
    if (blank && spec.optional) delete next[key];
    else next[key] = blank ? (value ?? "") : value;
    return next;
  }

  const current = isPlainObject(settings[key]) ? (settings[key] as Settings) : undefined;
  if (device === "mobile" && current?.base !== undefined) {
    const { mobile: _previous, ...rest } = current;
    next[key] = blank ? rest : { ...rest, mobile: value };
    return next;
  }
  if (blank) {
    if (spec.optional) delete next[key];
    else next[key] = { base: value ?? "" };
    return next;
  }
  next[key] = current?.mobile !== undefined && device === "desktop"
    ? { base: value, mobile: current.mobile }
    : { base: value };
  return next;
}

export function moveSection(sections: readonly EditorSection[], id: string, delta: -1 | 1): EditorSection[] {
  const from = sections.findIndex((section) => section.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= sections.length) return [...sections];
  const next = [...sections];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** A copy placed right after the original, with fresh section and block ids. */
export function duplicateSection(sections: readonly EditorSection[], id: string): EditorSection[] {
  const index = sections.findIndex((section) => section.id === id);
  if (index < 0) return [...sections];
  const original = sections[index];
  const taken = allIds(sections);
  const copyId = newInstanceId(original.type, taken);
  taken.push(copyId);
  const copy: EditorSection = {
    ...structuredClone(original),
    id: copyId,
    ...(original.blocks
      ? {
          blocks: original.blocks.map((block) => {
            const blockId = newInstanceId("item", taken);
            taken.push(blockId);
            return { ...structuredClone(block), id: blockId };
          }),
        }
      : {}),
  };
  return [...sections.slice(0, index + 1), copy, ...sections.slice(index + 1)];
}

export const removeSection = (sections: readonly EditorSection[], id: string): EditorSection[] =>
  sections.filter((section) => section.id !== id);
