"use client";
// coding-standard: maintained

import type { StoreFooterBlock } from "@/lib/storefront-client";
import { LINK_BLOCK_TYPES, blockWidth } from "@/lib/storefront-footer/blocks";
import { footerGroupStartsOpen } from "@/lib/storefront-footer/style";
import { stripVisibilityClass } from "@/lib/storefront-strip-display";
import { BottomBar, FooterShell } from "@/components/storefront/footer/footer-frame";
import { FooterBlockView } from "@/components/storefront/footer/footer-block-views";
import type { FooterProps } from "@/components/storefront/footer/footer-model";

/**
 * A composed footer — the merchant's blocks in their order, then the closing
 * line.
 *
 * Phone first: the row is one stacked column in block order, link blocks are
 * accordions, and a block switched off for phones is hidden by the shared
 * visibility classes. From 680px the row flows left to right: `wide` blocks
 * share the spare width, `auto` blocks size to their content, `narrow` holds
 * ~280px and `full` takes a line of its own. Content-sized link columns after a
 * wide brand block end up anchored right — the same shape the fixed layouts
 * were rebuilt around (`FooterColumns`).
 */
export function BlocksFooter({ blocks, ...props }: FooterProps & { blocks: StoreFooterBlock[] }) {
  const style = props.footerStyle;
  let linkIndex = 0;

  return (
    <FooterShell footerStyle={style}>
      <div className="sf-fb-row" data-align={style?.align === "center" ? "center" : undefined}>
        {blocks.map((block) => {
          const isLinks = LINK_BLOCK_TYPES.includes(block.type);
          const startsOpen = isLinks
            ? footerGroupStartsOpen(style?.phoneGroups, linkIndex++)
            : true;
          const visibility = stripVisibilityClass(block.showOnDesktop, block.showOnMobile);
          return (
            <div
              key={block.id}
              className={["sf-fb", `sf-fb-${blockWidth(block)}`, isLinks ? "sf-fb-links" : "", visibility ?? ""]
                .filter(Boolean)
                .join(" ")}
            >
              <FooterBlockView block={block} props={props} startsOpen={startsOpen} />
            </div>
          );
        })}
      </div>
      <BottomBar
        name={props.name}
        currency={props.store?.currency}
        note={props.note}
        store={props.store}
        t={props.t}
        footerPaymentMethods={props.footerPaymentMethods}
        footerStyle={style}
        center={style?.align === "center"}
      />
    </FooterShell>
  );
}
