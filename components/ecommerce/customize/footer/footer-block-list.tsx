"use client";
// coding-standard: maintained

import { useState } from "react";
import { ChevronDown, EyeOff, Plus, Trash2 } from "lucide-react";
import type { StorefrontFooterBlock } from "@/types";
import { SINGLE_USE_BLOCKS, brandPartsShown, newBlock } from "@/lib/storefront-footer/blocks";
import { FOOTER_BLOCKS_MAX, FOOTER_BLOCK_TYPES, type FooterBlockType } from "@/lib/storefront-footer/types";
import { Button } from "@/ui/components/button";
import { SimpleSelect } from "@/ui/components/simple-select";
import { cn } from "@/ui/lib/utils";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { MoveButtons } from "@/components/ecommerce/customize/menu-item-fields";
import { moveItem } from "@/components/ecommerce/customize/use-nav-link-options";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import {
  FooterBlockInspector,
  type LinkOptions,
} from "@/components/ecommerce/customize/footer/footer-block-inspector";
import { FooterPromisesNotice } from "@/components/ecommerce/customize/footer/footer-promises-notice";

export const BLOCK_LABELS: Record<FooterBlockType, { label: string; description: string }> = {
  brand: { label: "Shop name & about", description: "Logo, about text, phone and social icons" },
  links: { label: "Link group", description: "A heading and the links under it" },
  pages: { label: "Your pages", description: "Published pages marked “Show in footer”" },
  contact: { label: "Contact card", description: "Your number and chat buttons" },
  newsletter: { label: "Email sign-up", description: "Collect subscribers" },
  promises: { label: "Store promises", description: "Up to four promises with icons" },
  text: { label: "Text", description: "Address, opening hours, a note" },
  image: { label: "Picture", description: "An app badge, a certificate, a map" },
  logos: { label: "Logo strip", description: "Payment, courier or partner logos" },
  social: { label: "Social icons", description: "Your social links on their own" },
};

/** A line under the block's name, so a closed list still says what each one holds. */
function blockSummary(block: StorefrontFooterBlock, promises: number): string {
  if (block.type === "links") {
    const n = block.links?.length ?? 0;
    return `${block.title?.trim() || "Untitled"} · ${n} link${n === 1 ? "" : "s"}`;
  }
  if (block.type === "logos") return `${block.logos?.length ?? 0} logos`;
  if (block.type === "brand") {
    const parts = brandPartsShown(block);
    return parts.length ? parts.map((part) => part.label).join(" · ") : "Nothing shown";
  }
  if (block.type === "promises") {
    if (!promises) return "No promises yet";
    return `${promises} promise${promises === 1 ? "" : "s"} · ${block.arrange === "column" ? "in a column" : "in a row"}`;
  }
  return block.title?.trim() || BLOCK_LABELS[block.type].description;
}

/**
 * The footer's blocks, in order — the phone draws them top to bottom exactly
 * so. One block opens at a time: every inspector open at once would make the
 * 380px rail several screens tall.
 */
export function FooterBlockList({
  blocks,
  setBlocks,
  linkOptions,
  draft,
  patch,
}: {
  blocks: StorefrontFooterBlock[];
  setBlocks: (blocks: StorefrontFooterBlock[]) => void;
  linkOptions: LinkOptions;
} & Pick<CustomizeDraftApi, "draft" | "patch">) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState<FooterBlockType>("links");

  const present = new Set(blocks.map((b) => b.type));
  const addable = FOOTER_BLOCK_TYPES.filter(
    (type) => !(SINGLE_USE_BLOCKS.includes(type) && present.has(type)),
  );
  const addType = addable.includes(adding) ? adding : addable[0];

  const promises = draft.badges.filter((badge) => badge.text?.trim()).length;

  const patchBlock = (id: string, next: Partial<StorefrontFooterBlock>) =>
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...next } : b)));
  const add = (type: FooterBlockType) => {
    const block = newBlock(type);
    setBlocks([...blocks, block]);
    setOpenId(block.id);
  };

  return (
    <div className="space-y-2">
      {present.has("promises") || blocks.length >= FOOTER_BLOCKS_MAX ? null : (
        <FooterPromisesNotice
          badges={draft.badges}
          setBadges={(badges) => patch({ badges })}
          onAdd={() => add("promises")}
        />
      )}
      {blocks.length === 0 ? <PartHint>No blocks — the footer shows its bottom line only.</PartHint> : null}
      {blocks.map((block, i) => {
        const open = openId === block.id;
        const hidden = block.showOnDesktop === false || block.showOnMobile === false;
        return (
          <div key={block.id} className={cn("rounded-lg border bg-background", open && "ring-1 ring-primary/30")}>
            <div className="flex items-start gap-2 p-2.5">
              <MoveButtons
                index={i}
                count={blocks.length}
                onMove={(dir) => setBlocks(moveItem(blocks, i, dir))}
                size="h-3.5 w-3.5"
              />
              <button
                type="button"
                onClick={() => setOpenId(open ? null : block.id)}
                className="flex min-w-0 flex-1 items-start justify-between gap-2 text-left"
                aria-expanded={open}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {BLOCK_LABELS[block.type].label}
                    {hidden ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" aria-label="Hidden on one screen" /> : null}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{blockSummary(block, promises)}</span>
                </span>
                <ChevronDown className={cn("mt-0.5 h-4 w-4 flex-none transition-transform", open && "rotate-180")} />
              </button>
              <button
                type="button"
                onClick={() => setBlocks(blocks.filter((b) => b.id !== block.id))}
                className="flex-none pt-0.5 text-muted-foreground hover:text-red-600"
                aria-label={`Remove ${BLOCK_LABELS[block.type].label}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {open ? (
              <div className="border-t p-3">
                <FooterBlockInspector
                  block={block}
                  onChange={(next) => patchBlock(block.id, next)}
                  linkOptions={linkOptions}
                  draft={draft}
                  patch={patch}
                />
              </div>
            ) : null}
          </div>
        );
      })}

      {blocks.length < FOOTER_BLOCKS_MAX && addType ? (
        <div className="flex items-center gap-2 pt-1">
          <SimpleSelect
            value={addType}
            onValueChange={(v) => setAdding(v as FooterBlockType)}
            options={addable.map((type) => ({ value: type, ...BLOCK_LABELS[type] }))}
            className="h-9 flex-1"
          />
          <Button size="sm" variant="outline" onClick={() => add(addType)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add
          </Button>
        </div>
      ) : (
        <PartHint>That is the most a footer holds ({FOOTER_BLOCKS_MAX} blocks).</PartHint>
      )}
    </div>
  );
}
