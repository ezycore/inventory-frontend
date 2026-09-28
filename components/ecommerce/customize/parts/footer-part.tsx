"use client";
// coding-standard: maintained

import { useState } from "react";
import type { StorefrontFooterBlock, StorefrontFooterStyle } from "@/types";
import {
  blocksFromLayout,
  groupsFromBlocks,
  styleForLayout,
  type FooterLayout,
} from "@/lib/storefront-footer/blocks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/components/alert-dialog";
import { PartBlock } from "@/components/ecommerce/customize/part-group";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import { useNavLinkOptions } from "@/components/ecommerce/customize/use-nav-link-options";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { FooterBlockList } from "@/components/ecommerce/customize/footer/footer-block-list";
import { FooterBottomLineFields } from "@/components/ecommerce/customize/footer/footer-bottom-line-fields";
import { FooterStyleFields } from "@/components/ecommerce/customize/footer/footer-style-fields";

/**
 * Footer — the whole of it, in four sections: a starting layout, the blocks,
 * the closing bottom line and the look (plan
 * `docs/plan/storefront-footer-builder.md`).
 *
 * **Layouts are starting points.** A store that has never edited a block keeps
 * its fixed layout, drawn exactly as before; the list below shows that layout
 * spelt as blocks. The first block edit saves the list and the store draws its
 * own blocks from then on. Picking a layout again goes back to the fixed one,
 * after a confirm — it replaces the blocks — keeping the link groups.
 *
 * **What one block shows is edited inside that block** — the about line and
 * footer logo in the brand block, the promises in the promises block — so the
 * panel has no separate Wording, Pictures or Store promises sections. Bottom
 * line and Look apply to both kinds of footer, so they never need the switch.
 */
export function FooterPart({
  draft,
  patch,
  patchTemplate,
}: Pick<CustomizeDraftApi, "draft" | "patch" | "patchTemplate">) {
  const layout = draft.templates.footer as FooterLayout;
  const composed = draft.footerBlocks !== null;
  const blocks =
    draft.footerBlocks ??
    blocksFromLayout({ layout, groups: draft.footerGroups, contentPages: draft.footerContentPages });
  const linkOptions = useNavLinkOptions(draft.collections);
  const [pendingLayout, setPendingLayout] = useState<string | null>(null);

  const setStyle = (next: Partial<StorefrontFooterStyle>) =>
    patch({ footerStyle: { ...draft.footerStyle, ...next } });
  // The first edit carries the layout's own frame (the centred one centres) so
  // the footer does not jump shape the moment it becomes blocks.
  const setBlocks = (next: StorefrontFooterBlock[]) =>
    patch(
      composed
        ? { footerBlocks: next }
        : { footerBlocks: next, footerStyle: { ...styleForLayout(layout), ...draft.footerStyle } },
    );
  // The fixed centred layout centres its bottom line; a composed footer does when its blocks are centred.
  const defaultBottom = (composed ? draft.footerStyle.align === "center" : layout === "simple") ? "center" : "spread";
  const applyLayout = (value: string) => {
    patchTemplate("footer", value);
    if (composed) patch({ footerBlocks: null, footerGroups: groupsFromBlocks(blocks) });
  };

  return (
    <>
      <PartBlock
        label="Start from a layout"
        hint={
          composed
            ? "You have built your own footer. Picking a layout replaces your blocks with it."
            : "Change any block below and the footer becomes your own."
        }
      >
        <TemplatePicker
          templateKey="footer"
          value={composed ? "" : layout}
          onChange={(v) => (composed ? setPendingLayout(v) : applyLayout(v))}
        />
      </PartBlock>

      <PartBlock label="Blocks" hint="On a phone the blocks stack in this order.">
        <FooterBlockList
          blocks={blocks}
          setBlocks={setBlocks}
          linkOptions={linkOptions}
          draft={draft}
          patch={patch}
        />
      </PartBlock>

      <PartBlock label="Bottom line">
        <FooterBottomLineFields draft={draft} patch={patch} defaultAlign={defaultBottom} />
      </PartBlock>

      <PartBlock label="Look">
        <FooterStyleFields
          style={draft.footerStyle}
          setStyle={setStyle}
          brandColor={draft.brandColor}
          composed={composed}
        />
      </PartBlock>

      <AlertDialog open={pendingLayout !== null} onOpenChange={(open) => !open && setPendingLayout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your footer blocks?</AlertDialogTitle>
            <AlertDialogDescription>
              The footer goes back to this layout. Your link groups are kept; other blocks you
              added are removed. Nothing changes on your shop until you save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my blocks</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingLayout) applyLayout(pendingLayout);
                setPendingLayout(null);
              }}
            >
              Use this layout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
