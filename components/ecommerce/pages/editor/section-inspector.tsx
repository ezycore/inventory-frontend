"use client";
// coding-standard: maintained

import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";
import type { SectionType } from "@/lib/storefront-builder/section-specs";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { SECTION_CATALOGUE, isCoreSection, sectionLabel } from "./section-catalogue";
import {
  isComplete,
  specOf,
  type EditorBlock,
  type EditorDevice,
  type EditorSection,
} from "./section-instances";
import { SectionStyleFields } from "./section-style-fields";
import { isFieldVisible } from "./field-visibility";
import { SettingsFields } from "./settings-fields";

type Screen = "desktop" | "mobile";

const catalogueEntry = (type: string) =>
  Object.hasOwn(SECTION_CATALOGUE, type) ? SECTION_CATALOGUE[type as SectionType] : undefined;

/**
 * Core sections whose real controls live outside the builder, and where.
 *
 * A checkout, a cart and an account area are **shapes on this page** and
 * **rules for the whole shop** at the same time. The shape is a section setting;
 * the rules are not, because they apply to orders taken elsewhere too — a
 * landing page's order form is the checkout with its own product
 * (`islands/order-form.tsx`), and pausing orders empties every Buy button in the
 * shop. So the settings stay in Store settings and this says where they went,
 * rather than leaving a merchant to search a page whose preview shows the very
 * fields they are looking for.
 */
const ELSEWHERE: Partial<Record<string, { text: string; href: string; label: string }>> = {
  "checkout-form": {
    text: "What the checkout asks for — required fields, the address format, your own questions, the minimum order — is set for the whole shop in",
    href: "/ecommerce/settings",
    label: "Store settings → Checkout.",
  },
  "cart-lines": {
    text: "Delivery charges, payment methods and the minimum order are set for the whole shop in",
    href: "/ecommerce/settings",
    label: "Store settings.",
  },
};

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
 * The open section's settings — the rail's second view, in two tabs. Content:
 * its own settings, its repeatable items (each with its settings, order and
 * remove), and which screens it shows on. Style: the box it sits in
 * (`SectionStyleFields`).
 *
 * Every change applies at once: the preview redraws on the next render.
 */
export function SectionInspector({
  section,
  device,
  onChange,
  onAddBlock,
  onClose,
  context,
  siblingAnchors = [],
}: {
  section: EditorSection;
  device: EditorDevice;
  /** The page being edited, for the settings that page supplies itself. */
  context?: SectionPageContext;
  /** Link names the other sections on this page already use, to list and to warn on. */
  siblingAnchors?: string[];
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
      {/* Named, not an X: with one section the rail opens here, so this button is
          also the only way to the section list and its "Add section". */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 flex-none gap-1 px-2 text-muted-foreground hover:text-foreground"
        title="Back to sections"
        onClick={onClose}
      >
        <ArrowLeft className="h-4 w-4" />
        Sections
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
  const blockSettings = blocks.map((block) => block.settings);
  /* The items list itself, for a section that ignores every item it has in some
     configuration — then the LIST is what must go, not a field inside it. */
  const showsBlocks = isFieldVisible("blocks", section.type, {
    settings: section.settings,
    blocks: blockSettings,
  });
  const setBlocks = (next: EditorBlock[]) => onChange({ ...section, blocks: next });

  return (
    <div className="space-y-6">
      {header}

      {isComplete(section, context) ? null : (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Fill in the fields marked * — this section is not saved until they are.
        </p>
      )}

      <Tabs defaultValue="content" className="gap-6">
        <TabsList className="w-full">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {ELSEWHERE[section.type] ? (
            <p className="rounded-md border bg-muted/50 px-3 py-2 text-xs leading-snug text-muted-foreground">
              {ELSEWHERE[section.type].text}{" "}
              <Link href={ELSEWHERE[section.type].href} className="font-medium text-primary hover:underline">
                {ELSEWHERE[section.type].label}
              </Link>
            </p>
          ) : null}

          <SettingsFields
            idPrefix={section.id}
            sectionType={section.type}
            specs={spec.settings}
            settings={section.settings}
            device={device}
            blocks={blockSettings}
            context={context}
            onChange={(settings) => onChange({ ...section, settings })}
          />

          {spec.blocks && showsBlocks ? (
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
                    sectionType={section.type}
                    specs={spec.blocks!.settings}
                    settings={block.settings}
                    device={device}
                    sectionSettings={section.settings}
                    blocks={blockSettings}
                    blockIndex={index}
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

          {/* Not for the core section: the storefront skips a section hidden for a
              screen, and a cart or checkout missing on phones is a shop that cannot
              sell there. The API refuses it too (`assertCoreSection`). */}
          {isCoreSection(section.type) ? null : (
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
          )}
        </TabsContent>

        <TabsContent value="style">
          {entry?.pinned ? (
            <p className="text-sm text-muted-foreground">
              This section is pinned to the screen rather than placed on the page, so it has no box to style.
            </p>
          ) : (
            <SectionStyleFields
              section={section}
              device={device}
              onChange={onChange}
              siblingAnchors={siblingAnchors}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
