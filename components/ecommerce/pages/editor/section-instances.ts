// coding-standard: maintained
import type {
  SectionDefinition,
  SectionFieldSpec,
  SectionPageContext,
} from "@/lib/storefront-builder/field-specs";
import { SECTION_SPECS, type SectionType } from "@/lib/storefront-builder/section-specs";
import { readSettings } from "@/lib/storefront-builder/settings";
import type { StorefrontPage, StorefrontPageSection } from "@/services/api";
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

/**
 * The page context a page's sections are validated for — the backend's
 * `pageContextOf`. A system page is its own context (`product`, `cart`…).
 */
export const pageContextOf = (page: Pick<StorefrontPage, "kind" | "systemKey">): SectionPageContext =>
  page.kind === "system" ? (page.systemKey ?? "home") : page.kind;

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

const blockReads = (definition: SectionDefinition, block: EditorBlock, context?: SectionPageContext) =>
  INSTANCE_ID.test(block.id) && definition.blocks !== undefined &&
  readSettings(definition.blocks.settings, block.settings, context) !== null;

/**
 * True when the section would pass the backend as it stands, blocks included.
 * `context` is the page it is on: a setting that page supplies (`fromPage`) is
 * not asked for there.
 */
export function isComplete(section: EditorSection, context?: SectionPageContext): boolean {
  const definition = specOf(section.type);
  if (!definition || definition.v !== section.v || !INSTANCE_ID.test(section.id)) return false;
  if (readSettings(definition.settings, section.settings, context) === null) return false;
  return (section.blocks ?? []).every((block) => blockReads(definition, block, context));
}

/**
 * What a draft save sends: complete sections, each with only the blocks that
 * read. An unfinished item stays in the editor and simply is not saved yet.
 */
export function savableSections(
  sections: readonly EditorSection[],
  context?: SectionPageContext,
): EditorSection[] {
  return sections.flatMap((section) => {
    const definition = specOf(section.type);
    if (!definition || definition.v !== section.v || !INSTANCE_ID.test(section.id)) return [];
    if (readSettings(definition.settings, section.settings, context) === null) return [];
    if (!section.blocks) return [section];
    return [{ ...section, blocks: section.blocks.filter((block) => blockReads(definition, block, context)) }];
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
 * the base and a phone value is an override; clearing the override goes back to
 * the desktop's.
 *
 * **An edit on the phone tab only ever writes the phone's value.** It used to
 * become the `base` when the desktop had none — so a merchant who chose Center
 * while looking at the phone silently centred their desktop page too, with the
 * note still reading "Same as desktop" and no "Reset to desktop" to undo it. A
 * base-less `{ mobile }` is now a valid stored value (the backend's
 * `checkField` accepts it for an optional field), and the desktop keeps
 * rendering whatever it rendered before: the section's own fallback, or the
 * Customize setting it follows.
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
  if (device === "mobile") {
    const { mobile: _previous, ...rest } = current ?? {};
    // Clearing a phone-only value leaves nothing to store: an empty container is
    // not a value, so the key goes the way a cleared optional field goes.
    if (blank && rest.base === undefined) {
      if (spec.optional) delete next[key];
      else next[key] = { base: "" };
    } else next[key] = blank ? rest : { ...rest, mobile: value };
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
