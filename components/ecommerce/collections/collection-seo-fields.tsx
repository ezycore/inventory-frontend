"use client";
// coding-standard: maintained

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/ui/components/input";
import { cn } from "@/ui/lib/utils";

/**
 * Per-collection search-engine overrides, collapsed by default.
 *
 * Collection pages (`/phones`, `/phones/accessories`) are usually a store's
 * best-converting organic landing pages — a shopper searching "kitchen
 * appliances dhaka" wants a category, not one product — and until now they were
 * the only merchant-facing entity with no SEO control at all.
 *
 * Collapsed because most merchants will never open it, and an always-visible
 * pair of text inputs on every row would bury the controls (listed / display
 * name / order) that everyone does use. Saves on blur, matching how the rest of
 * this tab behaves.
 *
 * Empty means "use the fallback", which the storefront resolves as the display
 * name and the category description — the same precedence the product page uses.
 */

/** Model limits (`category.model.ts` `storefront.seo`), matching Product. */
const MAX_TITLE = 70;
const MAX_DESCRIPTION = 200;

export function CollectionSeoFields({
  name,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onCommit,
}: {
  /** The collection's display name — the fallback, shown as placeholder. */
  name: string;
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCommit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasOverride = !!(title.trim() || description.trim());

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        <Search className="h-3.5 w-3.5" />
        Search listing
        {hasOverride && !open ? (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            custom
          </span>
        ) : null}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-2 grid gap-2 rounded-md border bg-muted/30 p-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Page title{" "}
              <span className="tabular-nums">
                ({title.length}/{MAX_TITLE})
              </span>
            </span>
            <Input
              value={title}
              maxLength={MAX_TITLE}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onCommit}
              placeholder={name}
              className="h-9"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Meta description{" "}
              <span className="tabular-nums">
                ({description.length}/{MAX_DESCRIPTION})
              </span>
            </span>
            <Input
              value={description}
              maxLength={MAX_DESCRIPTION}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onBlur={onCommit}
              placeholder="Uses the category description"
              className="h-9"
            />
          </label>
        </div>
      )}
    </div>
  );
}
