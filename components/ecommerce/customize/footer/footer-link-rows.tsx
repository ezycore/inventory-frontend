"use client";
// coding-standard: maintained

import { ExternalLink, Trash2 } from "lucide-react";
import type { StorefrontFooterLink, StorefrontMenuItem } from "@/types";
import { footerLinkType, footerLinkValue } from "@/lib/storefront-footer/links";
import { cn } from "@/ui/lib/utils";
import {
  LinkFields,
  MoveButtons,
  type NavOption,
} from "@/components/ecommerce/customize/menu-item-fields";
import { moveItem } from "@/components/ecommerce/customize/use-nav-link-options";

/**
 * A footer link group's rows — the header menu's own row (`LinkFields`: label,
 * Category / Page / URL, then the picker or the address), plus reordering and,
 * for a typed address, "open in a new tab".
 *
 * A row saved before links were typed is `{ label, url }`; it shows as a URL row
 * and is rewritten in the typed shape by its first edit.
 */
export function FooterLinkRows({
  links,
  onChange,
  categoryOptions,
  pageOptions,
  resolveCategory,
}: {
  links: StorefrontFooterLink[];
  onChange: (links: StorefrontFooterLink[]) => void;
  categoryOptions: NavOption[];
  pageOptions: NavOption[];
  resolveCategory: (value: string) => string;
}) {
  const patch = (i: number, next: Partial<StorefrontFooterLink>) =>
    onChange(
      links.map((link, idx) => {
        if (idx !== i) return link;
        // The typed shape replaces the legacy `url` — keeping both would leave
        // two targets on one row.
        const rest: StorefrontFooterLink = { ...link };
        delete rest.url;
        return {
          ...rest,
          type: footerLinkType(link),
          value: footerLinkValue(link),
          ...next,
        };
      }),
    );

  return (
    <div className="space-y-2">
      {links.map((link, i) => {
        const type = footerLinkType(link);
        const asMenuItem: StorefrontMenuItem = {
          label: link.label,
          type,
          value: footerLinkValue(link),
        };
        return (
          <div key={i} className="flex items-start gap-2">
            <MoveButtons
              index={i}
              count={links.length}
              onMove={(dir) => onChange(moveItem(links, i, dir))}
              size="h-3.5 w-3.5"
            />
            <LinkFields
              item={asMenuItem}
              categoryOptions={categoryOptions}
              pageOptions={pageOptions}
              resolveCategory={resolveCategory}
              onChange={(p) =>
                patch(i, {
                  ...(p.label !== undefined ? { label: p.label } : {}),
                  ...(p.type !== undefined ? { type: p.type as StorefrontFooterLink["type"], value: "" } : {}),
                  ...(p.value !== undefined ? { value: p.value } : {}),
                })
              }
            />
            <div className="flex flex-none flex-col items-center gap-1 pt-1.5">
              {type === "url" ? (
                <button
                  type="button"
                  onClick={() => patch(i, { newTab: !link.newTab })}
                  className={cn(
                    "rounded p-0.5",
                    link.newTab ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                  aria-pressed={!!link.newTab}
                  aria-label="Open in a new tab"
                  title="Open in a new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onChange(links.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-red-600"
                aria-label="Remove link"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onChange([...links, { label: "", type: "url", value: "" }])}
        className="text-xs font-semibold text-primary"
      >
        + Add link
      </button>
    </div>
  );
}
