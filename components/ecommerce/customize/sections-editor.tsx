"use client";
// coding-standard: maintained

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import {
  HOME_PRESET_SECTIONS,
  SECTION_IDS,
  SECTION_LABELS,
  type SectionId,
} from "@/components/storefront/home/home-sections";
import { sectionInstances } from "@/lib/storefront-templates";
import type { StoreHomeSection } from "@/lib/storefront-client";
import { Button } from "@/ui/components/button";
import { PartHint } from "@/components/ecommerce/customize/part-group";

/**
 * Customize → Home page → **Sections**: the merchant's homepage as an ordered,
 * toggleable list.
 *
 * This is what makes the editor follow the applied theme rather than showing a
 * fixed six rows — after applying Fashion Shine the list is *its* sections
 * (full-bleed hero, editorial split, …), because a theme now stamps
 * `homepageSections` and this reads the same draft field.
 *
 * Reorder is up/down buttons, not drag-and-drop, and deliberately: a homepage
 * has five or six rows, the list is inside an already-scrolling rail beside a
 * preview iframe, and pointer-drag inside that is both fiddly and unreachable by
 * keyboard. Two buttons are operable by everyone and need no dependency.
 */
export function SectionsEditor({
  sections,
  homeTemplate,
  onChange,
}: {
  sections: StoreHomeSection[];
  /** Drives the "reset" affordance — the default list this template implies. */
  homeTemplate: string;
  onChange: (next: StoreHomeSection[]) => void;
}) {
  // Empty means "never customised", and the storefront falls back to the home
  // template's default list. Showing that list here (rather than an empty box)
  // is what makes the first reorder an edit of what the merchant can actually
  // see, instead of building a page from nothing. Minted through the same
  // deterministic helper the storefront resolver uses, so the keys the merchant
  // starts editing are the keys their page already renders with.
  const effective = sections.length
    ? sections
    : sectionInstances(
        HOME_PRESET_SECTIONS[homeTemplate] ?? HOME_PRESET_SECTIONS.classic,
      );

  // One instance per type, for now. The model allows repeats — that is what
  // `key` is for — but a second copy of a section is only useful once it can be
  // pointed at different content, so the affordance arrives with per-section
  // config rather than offering two identical rows in the meantime.
  const used = new Set(effective.map((s) => s.type));
  const available = SECTION_IDS.filter((id) => !used.has(id));

  const move = (index: number, delta: number) => {
    const next = [...effective];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <ol className="space-y-1.5">
        {effective.map((section, i) => (
          <li
            key={section.key}
            className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-xs font-medium">
              {SECTION_LABELS[section.type as SectionId] ?? section.type}
            </span>
            <div className="flex flex-none items-center gap-0.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Move ${SECTION_LABELS[section.type as SectionId] ?? section.type} up`}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={i === effective.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move ${SECTION_LABELS[section.type as SectionId] ?? section.type} down`}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => onChange(effective.filter((s) => s.key !== section.key))}
                aria-label={`Remove ${SECTION_LABELS[section.type as SectionId] ?? section.type}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ol>

      {effective.length === 0 ? (
        <PartHint>
          Your homepage has no sections. Add at least one, or your shop opens on
          an empty page.
        </PartHint>
      ) : null}

      {available.length ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Add a section</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  // Key minted off the type plus the current length, so it
                  // cannot collide with an instance already in the list — the
                  // API refuses a duplicate key, and a collision here would
                  // surface as a save failure the merchant cannot act on.
                  onChange([...effective, { key: `${id}-${effective.length}`, type: id }])
                }
              >
                <Plus className="h-3 w-3" />
                {SECTION_LABELS[id]}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <PartHint>
        A section that has nothing to show hides itself — a campaign strip with no
        live campaign, or your promises band before you have written any.
      </PartHint>
    </div>
  );
}
