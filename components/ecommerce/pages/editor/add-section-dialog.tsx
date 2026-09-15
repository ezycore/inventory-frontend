"use client";
// coding-standard: maintained

import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";
import type { SectionType } from "@/lib/storefront-builder/section-specs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { SECTION_CATALOGUE, SECTION_GROUPS } from "./section-catalogue";
import { specOf } from "./section-instances";

/** The section types a page of this kind may hold and the storefront can draw, in catalogue order. */
export function addableSections(context: SectionPageContext): SectionType[] {
  return (Object.keys(SECTION_CATALOGUE) as SectionType[]).filter((type) => {
    const spec = specOf(type);
    const fits = spec && (spec.pages === "all" || spec.pages.includes(context));
    return SECTION_CATALOGUE[type].addable && fits;
  });
}

/**
 * The add-section library: every section this page can hold, grouped as in plan
 * §8, each with one line on what it is for. Picking one adds it below the section
 * that is open — or at the end — and opens it.
 */
export function AddSectionDialog({
  open,
  onOpenChange,
  context,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: SectionPageContext;
  onAdd: (type: SectionType) => void;
}) {
  const types = addableSections(context);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a section</DialogTitle>
          <DialogDescription>
            It goes below the section you have open, or at the end of the page.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {SECTION_GROUPS.map((group) => {
            const inGroup = types.filter((type) => SECTION_CATALOGUE[type].group === group);
            if (inGroup.length === 0) return null;
            return (
              <section key={group} aria-label={group}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {inGroup.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        onAdd(type);
                        onOpenChange(false);
                      }}
                      className="rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <span className="block text-sm font-medium">{SECTION_CATALOGUE[type].label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {SECTION_CATALOGUE[type].description}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
