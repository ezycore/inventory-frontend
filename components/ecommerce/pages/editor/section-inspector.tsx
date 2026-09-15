"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import type { SectionType } from "@/lib/storefront-builder/section-specs";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { SECTION_CATALOGUE, sectionLabel } from "./section-catalogue";
import {
  isComplete,
  specOf,
  type EditorBlock,
  type EditorDevice,
  type EditorSection,
} from "./section-instances";
import { SettingsFields } from "./settings-fields";

type Screen = "desktop" | "mobile";

const catalogueEntry = (type: string) =>
  Object.hasOwn(SECTION_CATALOGUE, type) ? SECTION_CATALOGUE[type as SectionType] : undefined;

function moveBlock(blocks: EditorBlock[], index: number, delta: -1 | 1): EditorBlock[] {
  const to = index + delta;
  if (to < 0 || to >= blocks.length) return blocks;
  const next = [...blocks];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/** Shown everywhere is the default, stored as no `visibility` at all rather than two `true`s. */
function withVisibility(section: EditorSection, screen: Screen, visible: boolean): EditorSection {
  const hidden = {
    desktop: screen === "desktop" ? !visible : section.visibility?.desktop === false,
    mobile: screen === "mobile" ? !visible : section.visibility?.mobile === false,
  };
  const { visibility: _previous, ...rest } = section;
  if (!hidden.desktop && !hidden.mobile) return rest;
  return {
    ...rest,
    visibility: {
      ...(hidden.desktop ? { desktop: false } : {}),
      ...(hidden.mobile ? { mobile: false } : {}),
    },
  };
}

/**
 * The open section's settings — the rail's second view: its own settings, its
 * repeatable items (each with its settings, order and remove), and which screens
 * it shows on.
 *
 * Every change applies at once: the preview redraws on the next render.
 */
export function SectionInspector({
  section,
  device,
  onChange,
  onAddBlock,
  onClose,
}: {
  section: EditorSection;
  device: EditorDevice;
  onChange: (section: EditorSection) => void;
  onAddBlock: () => void;
  onClose: () => void;
}) {
  const spec = specOf(section.type);
  const entry = catalogueEntry(section.type);
  const item = entry?.item ?? "Item";

  const header = (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-base font-semibold">{sectionLabel(section.type)}</h2>
        {entry ? <p className="text-xs text-muted-foreground">{entry.description}</p> : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-none"
        aria-label="Back to sections"
        title="Back to sections"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  if (!spec || spec.v !== section.v) {
    return (
      <div className="space-y-4">
        {header}
        <p className="text-sm text-muted-foreground">
          This section was made by a newer version of the editor and cannot be changed here.
        </p>
      </div>
    );
  }

  const blocks = section.blocks ?? [];
  const setBlocks = (next: EditorBlock[]) => onChange({ ...section, blocks: next });

  return (
    <div className="space-y-6">
      {header}

      {isComplete(section) ? null : (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Fill in the fields marked * — this section is not saved until they are.
        </p>
      )}

      <SettingsFields
        idPrefix={section.id}
        specs={spec.settings}
        settings={section.settings}
        device={device}
        onChange={(settings) => onChange({ ...section, settings })}
      />

      {spec.blocks ? (
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{item}s</h3>
            <span className="text-xs text-muted-foreground">
              {blocks.length} of {spec.blocks.max}
            </span>
          </div>
          {blocks.map((block, index) => (
            <div key={block.id} className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-medium">
                  {item} {index + 1}
                </span>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Move ${item.toLowerCase()} ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => setBlocks(moveBlock(blocks, index, -1))}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Move ${item.toLowerCase()} ${index + 1} down`}
                    disabled={index === blocks.length - 1}
                    onClick={() => setBlocks(moveBlock(blocks, index, 1))}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-red-600"
                    aria-label={`Remove ${item.toLowerCase()} ${index + 1}`}
                    onClick={() => setBlocks(blocks.filter((other) => other.id !== block.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <SettingsFields
                idPrefix={`${section.id}-${block.id}`}
                specs={spec.blocks!.settings}
                settings={block.settings}
                device={device}
                onChange={(settings) =>
                  setBlocks(blocks.map((other) => (other.id === block.id ? { ...other, settings } : other)))
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={blocks.length >= spec.blocks.max}
            onClick={onAddBlock}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {item.toLowerCase()}
          </Button>
        </div>
      ) : null}

      <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-semibold">Show on</h3>
        {(["desktop", "mobile"] as const).map((screen) => (
          <div key={screen} className="flex items-center justify-between gap-2">
            <Label htmlFor={`${section.id}-show-${screen}`}>
              {screen === "desktop" ? "Computers and tablets" : "Phones"}
            </Label>
            <Switch
              id={`${section.id}-show-${screen}`}
              checked={section.visibility?.[screen] !== false}
              onCheckedChange={(checked) => onChange(withVisibility(section, screen, checked))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
