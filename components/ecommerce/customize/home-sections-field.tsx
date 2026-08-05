"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  HOME_SECTION_LABELS,
  resolveHomeSections,
  type HomeSectionId,
  type HomeVariant,
} from "@/lib/storefront-home-sections";
import { getHomeTemplateMeta } from "@/lib/storefront-home-templates";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";

/**
 * Reorder and switch off the blocks of the home page.
 *
 * The saved shape is "ordered ids of the sections that render", so a hidden
 * section is simply absent from the list. The editor therefore shows two groups:
 * the order itself, movable, and everything left over under "Hidden".
 *
 * `value` is `null` until the merchant touches something — that is what keeps a
 * store on its look's default order (see `CustomizeDraft.homepageSections`), so
 * the rows are rendered from the *resolved* order while the draft stays null.
 */
export function HomeSectionsField({
  value,
  variant,
  onChange,
}: {
  value: string[] | null;
  variant: HomeVariant;
  onChange: (next: HomeSectionId[]) => void;
}) {
  // Only the blocks THIS look implements. A template that has no design for a
  // block must not offer it — a merchant could switch it on and see nothing.
  const template = getHomeTemplateMeta(variant);
  const enabled = resolveHomeSections(value, template);
  const hidden = template.available.filter((id) => !enabled.includes(id));

  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= enabled.length) return;
    const next = [...enabled];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {enabled.map((id, i) => (
          <div
            key={id}
            className="flex items-center gap-1 rounded-lg border bg-background px-2 py-1.5"
          >
            <div className="flex flex-col">
              <ArrowButton
                label={`Move ${HOME_SECTION_LABELS[id]} up`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </ArrowButton>
              <ArrowButton
                label={`Move ${HOME_SECTION_LABELS[id]} down`}
                disabled={i === enabled.length - 1}
                onClick={() => move(i, 1)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </ArrowButton>
            </div>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
              {HOME_SECTION_LABELS[id]}
            </span>
            <Switch
              checked
              // A shop with no sections at all is not a layout choice, it is a
              // broken page — the last one on cannot be switched off.
              disabled={enabled.length === 1}
              onCheckedChange={() => onChange(enabled.filter((s) => s !== id))}
              aria-label={`Hide ${HOME_SECTION_LABELS[id]}`}
            />
          </div>
        ))}
      </div>

      {hidden.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Hidden
          </p>
          {hidden.map((id) => (
            <div
              key={id}
              className="flex items-center gap-2 rounded-lg border border-dashed px-2 py-1.5"
            >
              <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                {HOME_SECTION_LABELS[id]}
              </span>
              <Switch
                checked={false}
                onCheckedChange={() => onChange([...enabled, id])}
                aria-label={`Show ${HOME_SECTION_LABELS[id]}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded p-0.5 text-muted-foreground transition-colors",
        disabled
          ? "cursor-not-allowed opacity-30"
          : "hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
