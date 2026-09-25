"use client";
// coding-standard: maintained

import { useState } from "react";
import Link from "next/link";
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
import { PartBlock, PartHint } from "@/components/ecommerce/customize/part-group";
import { ResponsiveVisibilityField } from "@/components/ecommerce/customize/parts/responsive-visibility-field";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import { TrustBadgesField } from "@/components/ecommerce/customize/trust-badges-field";
import { useNavLinkOptions } from "@/components/ecommerce/customize/use-nav-link-options";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { FooterBlockList } from "@/components/ecommerce/customize/footer/footer-block-list";
import { FooterCopyFields } from "@/components/ecommerce/customize/footer/footer-copy-fields";
import { FooterPictureFields } from "@/components/ecommerce/customize/footer/footer-picture-fields";
import { FooterStyleFields } from "@/components/ecommerce/customize/footer/footer-style-fields";

/**
 * Footer — the whole of it: a starting layout, the blocks, the wording, the
 * look and the pictures (plan `docs/plan/storefront-footer-builder.md`).
 *
 * **Layouts are starting points.** A store that has never edited a block keeps
 * its fixed layout, drawn exactly as before; the list below shows that layout
 * spelt as blocks. The first block edit saves the list and the store draws its
 * own blocks from then on. Picking a layout again goes back to the fixed one,
 * after a confirm — it replaces the blocks — keeping the link groups.
 *
 * Wording, look and pictures apply to both, so they never need the switch.
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

      <PartBlock label="Wording">
        <FooterCopyFields draft={draft} patch={patch} />
      </PartBlock>

      <PartBlock label="Look">
        <FooterStyleFields
          style={draft.footerStyle}
          setStyle={setStyle}
          brandColor={draft.brandColor}
          composed={composed}
          defaultBottom={(composed ? draft.footerStyle.align === "center" : layout === "simple") ? "center" : "spread"}
        />
      </PartBlock>

      <PartBlock label="Pictures">
        <FooterPictureFields style={draft.footerStyle} setStyle={setStyle} />
      </PartBlock>

      <PartBlock
        label="Store promises"
        hint="Up to four promises you stand behind. Shown by a Store promises block and by promise sections on your pages; blank rows are not published."
      >
        <TrustBadgesField badges={draft.badges} setBadges={(badges) => patch({ badges })} />
      </PartBlock>

      <PartBlock
        label="Payment methods"
        hint="Choose where your enabled checkout methods appear in the footer. This does not disable them at checkout."
      >
        <ResponsiveVisibilityField
          showOnDesktop={draft.footerPaymentMethods.showOnDesktop}
          showOnMobile={draft.footerPaymentMethods.showOnMobile}
          onChange={(value) =>
            patch({ footerPaymentMethods: { ...draft.footerPaymentMethods, ...value } })
          }
          what="payment methods"
        />
      </PartBlock>

      <PartHint>
        Your phone number and social links are set in{" "}
        <Link href="/ecommerce/settings" className="underline underline-offset-2">
          Store settings
        </Link>
        .
      </PartHint>

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
