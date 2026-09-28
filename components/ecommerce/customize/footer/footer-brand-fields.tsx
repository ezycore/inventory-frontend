"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import type { StorefrontFooterBlock, StorefrontFooterStyle } from "@/types";
import { brandBlockShowsAnything } from "@/lib/storefront-footer/blocks";
import { Textarea } from "@/ui/components/textarea";
import { PartHint, PartSwitch } from "@/components/ecommerce/customize/part-group";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { FooterLogoFields } from "@/components/ecommerce/customize/footer/footer-picture-fields";

/** One switchable part of the brand block, with its own settings under it while it is on. */
function BrandPart({
  label,
  ariaLabel,
  checked,
  onCheckedChange,
  children,
}: {
  label: string;
  ariaLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-md bg-muted/40 p-3">
      <PartSwitch label={label} ariaLabel={ariaLabel} checked={checked} onCheckedChange={onCheckedChange} />
      {checked && children ? <div className="space-y-2 border-l-2 pl-3">{children}</div> : null}
    </div>
  );
}

/**
 * The brand block's content: what it shows, and — under each part — the
 * settings that only this block draws. The footer logo and the about line used
 * to sit in their own sections of the Footer panel, far from the switches that
 * decide whether they appear at all.
 *
 * The switches belong to the block (`onChange`, so the first one moves a fixed
 * layout onto blocks); the logo and about text are shop-wide copy and style
 * (`patch`), shared with the fixed layouts, so editing them never does.
 */
export function FooterBrandFields({
  block,
  onChange,
  draft,
  patch,
}: {
  block: StorefrontFooterBlock;
  onChange: (next: Partial<StorefrontFooterBlock>) => void;
} & Pick<CustomizeDraftApi, "draft" | "patch">) {
  const setStyle = (next: Partial<StorefrontFooterStyle>) =>
    patch({ footerStyle: { ...draft.footerStyle, ...next } });

  return (
    <div className="space-y-3">
      <BrandPart
        label="Logo & shop name"
        ariaLabel="Show the logo and shop name in the footer"
        checked={block.showLogo !== false}
        onCheckedChange={(v) => onChange({ showLogo: v })}
      >
        <FooterLogoFields style={draft.footerStyle} setStyle={setStyle} />
      </BrandPart>

      <BrandPart
        label="About your shop"
        ariaLabel="Show the about text in the footer"
        checked={block.showAbout !== false}
        onCheckedChange={(v) => onChange({ showAbout: v })}
      >
        <Textarea
          value={draft.footerText}
          onChange={(e) => patch({ footerText: e.target.value })}
          maxLength={280}
          rows={3}
          placeholder="A line or two about what you sell and where you deliver."
          aria-label="About your shop"
        />
        <PartHint>Press Enter for a new line. Leave empty to use the default line.</PartHint>
      </BrandPart>

      <div className="space-y-3 rounded-md bg-muted/40 p-3">
        <PartSwitch
          label="Phone number"
          ariaLabel="Show the phone number in the footer"
          checked={block.showPhone !== false}
          onCheckedChange={(v) => onChange({ showPhone: v })}
        />
        <PartSwitch
          label="Social icons"
          ariaLabel="Show social icons in the footer"
          checked={block.showSocial !== false}
          onCheckedChange={(v) => onChange({ showSocial: v })}
        />
        <PartHint>Both come from Settings → General.</PartHint>
      </div>

      {brandBlockShowsAnything(block) ? null : (
        <PartHint tone="warn">Nothing left to show — remove this block instead.</PartHint>
      )}
    </div>
  );
}
