"use client";
// coding-standard: maintained

import dynamic from "next/dynamic";
import type { StorefrontFooterBlock } from "@/types";
import {
  DEFAULT_BLOCK_WIDTH,
  blockWidth,
} from "@/lib/storefront-footer/blocks";
import {
  FOOTER_TEXT_MAX_BYTES,
  type FooterBlockWidth,
  type FooterIconStyle,
} from "@/lib/storefront-footer/types";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { SegmentedField } from "@/ui/components/segmented-field";
import { PartField, PartHint, PartSwitch } from "@/components/ecommerce/customize/part-group";
import { ResponsiveVisibilityField } from "@/components/ecommerce/customize/parts/responsive-visibility-field";
import type { NavOption } from "@/components/ecommerce/customize/menu-item-fields";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { FooterLinkRows } from "@/components/ecommerce/customize/footer/footer-link-rows";
import { FooterImageField } from "@/components/ecommerce/customize/footer/footer-image-field";
import { FooterLogosField } from "@/components/ecommerce/customize/footer/footer-logos-field";
import { FooterNewsletterFields } from "@/components/ecommerce/customize/footer/footer-copy-fields";

// TipTap is heavy: only a merchant who opens a text block pays for it.
const RichTextEditor = dynamic(
  () => import("@/components/shared/rich-text-editor").then((module) => module.RichTextEditor),
  { ssr: false },
);

const WIDTH_OPTIONS: { value: FooterBlockWidth; label: string; description: string }[] = [
  { value: "auto", label: "Fit", description: "As wide as its content, on a computer" },
  { value: "narrow", label: "Narrow", description: "About a third of a laptop screen" },
  { value: "wide", label: "Wide", description: "Shares the spare room with other wide blocks" },
  { value: "full", label: "Full row", description: "A line of its own" },
];

/**
 * The promises band's three styles in its own words (`section-catalogue.ts`),
 * so a merchant matching the two reads one choice on both screens.
 */
const ICON_STYLE_OPTIONS: { value: FooterIconStyle; label: string; description: string }[] = [
  { value: "disc", label: "In a circle", description: "Each icon on a solid circle in your accent colour" },
  { value: "plain", label: "Icon only", description: "The icon alone, in your brand colour" },
  { value: "none", label: "No icons", description: "Just the words" },
];
/** Unset draws `plain` — what the footer showed before the setting. */
const DEFAULT_ICON_STYLE: FooterIconStyle = "plain";

export interface LinkOptions {
  categoryOptions: NavOption[];
  pageOptions: NavOption[];
  resolveCategory: (value: string) => string;
}

/**
 * One block's settings. Content first (what the block says), then where it sits
 * — its width on a computer and which screens show it. Phones always stack the
 * blocks in order, so width is a desktop-only question and says so.
 *
 * Blocks that draw the shop's shared wording (contact heading, sign-up copy)
 * edit that one copy here rather than a second one per block: the fixed
 * layouts read the same fields, and two sources would disagree. Promises are
 * edited in their own section, since page sections draw them too.
 */
export function FooterBlockInspector({
  block,
  onChange,
  linkOptions,
  draft,
  patch,
}: {
  block: StorefrontFooterBlock;
  onChange: (next: Partial<StorefrontFooterBlock>) => void;
  linkOptions: LinkOptions;
} & Pick<CustomizeDraftApi, "draft" | "patch">) {
  return (
    <div className="space-y-4">
      <BlockContent block={block} onChange={onChange} linkOptions={linkOptions} draft={draft} patch={patch} />
      <SegmentedField
        label="Width on a computer"
        value={blockWidth(block)}
        options={WIDTH_OPTIONS}
        onChange={(width) =>
          onChange({ width: width === DEFAULT_BLOCK_WIDTH[block.type] ? undefined : (width as FooterBlockWidth) })
        }
      />
      <ResponsiveVisibilityField
        showOnDesktop={block.showOnDesktop ?? true}
        showOnMobile={block.showOnMobile ?? true}
        onChange={onChange}
        what="block"
      />
    </div>
  );
}

function TitleInput({
  block,
  onChange,
  placeholder,
}: {
  block: StorefrontFooterBlock;
  onChange: (next: Partial<StorefrontFooterBlock>) => void;
  placeholder: string;
}) {
  return (
    <PartField label="Heading">
      <Input
        value={block.title ?? ""}
        onChange={(e) => onChange({ title: e.target.value })}
        maxLength={60}
        placeholder={placeholder}
      />
    </PartField>
  );
}

function BlockContent({
  block,
  onChange,
  linkOptions,
  draft,
  patch,
}: {
  block: StorefrontFooterBlock;
  onChange: (next: Partial<StorefrontFooterBlock>) => void;
  linkOptions: LinkOptions;
} & Pick<CustomizeDraftApi, "draft" | "patch">) {
  switch (block.type) {
    case "brand":
      return (
        <div className="space-y-3">
          <PartSwitch label="About your shop" checked={block.showAbout !== false} onCheckedChange={(v) => onChange({ showAbout: v })} />
          <PartSwitch label="Phone number" checked={block.showPhone !== false} onCheckedChange={(v) => onChange({ showPhone: v })} />
          <PartSwitch label="Social icons" checked={block.showSocial !== false} onCheckedChange={(v) => onChange({ showSocial: v })} />
          <PartHint>The about text is under Wording below; the phone number and social links come from Settings → General.</PartHint>
        </div>
      );
    case "links":
      return (
        <div className="space-y-3">
          <TitleInput block={block} onChange={onChange} placeholder="Help" />
          <FooterLinkRows links={block.links ?? []} onChange={(links) => onChange({ links })} {...linkOptions} />
        </div>
      );
    case "pages":
      return (
        <div className="space-y-2">
          <TitleInput block={block} onChange={onChange} placeholder="Information" />
          <PartHint>Lists your published pages that have “Show in footer” on (Online Store → Pages).</PartHint>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-2">
          <PartField label="Heading">
            <Input
              value={draft.footerContactHeading}
              onChange={(e) => patch({ footerContactHeading: e.target.value })}
              maxLength={60}
              placeholder="Order by phone"
            />
          </PartField>
          <PartHint>Shows your phone number (Settings → General) and chat buttons (WhatsApp button part). Hidden when you have neither.</PartHint>
        </div>
      );
    case "newsletter":
      return <FooterNewsletterFields draft={draft} patch={patch} />;
    case "promises":
      return (
        <div className="space-y-2">
          <PartField label="Icon style">
            <SegmentedField
              label="Icon style"
              value={block.iconStyle ?? DEFAULT_ICON_STYLE}
              options={ICON_STYLE_OPTIONS}
              onChange={(style) =>
                onChange({ iconStyle: style === DEFAULT_ICON_STYLE ? undefined : (style as FooterIconStyle) })
              }
            />
          </PartField>
          <PartHint>
            Shows your store promises — edit them under Store promises below. A promises band on a page has the same
            icon styles; pick the same one there so both match.
          </PartHint>
        </div>
      );
    case "text":
      return (
        <div className="space-y-3">
          <TitleInput block={block} onChange={onChange} placeholder="Visit us" />
          <PartField label="Text" hint="An address, opening hours, a short note — links and bold work.">
            <RichTextEditor
              value={block.body ?? ""}
              onChange={(body) => onChange({ body })}
              maxLength={FOOTER_TEXT_MAX_BYTES}
            />
          </PartField>
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <FooterImageField label="Picture" image={block.image} onChange={(image) => onChange({ image })} />
          <PartField label="Description" hint="Read aloud to shoppers using a screen reader.">
            <Input value={block.alt ?? ""} onChange={(e) => onChange({ alt: e.target.value })} maxLength={120} />
          </PartField>
          <PartField label="Link (optional)">
            <Input value={block.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} maxLength={300} placeholder="/pages/about or https://…" />
          </PartField>
          <PartField label="Largest width (px)">
            <NumberField value={block.maxWidth ?? null} onChange={(v) => onChange({ maxWidth: v ?? undefined })} min={60} max={600} precision={0} />
          </PartField>
        </div>
      );
    case "logos":
      return (
        <div className="space-y-3">
          <TitleInput block={block} onChange={onChange} placeholder="We accept" />
          <FooterLogosField logos={block.logos ?? []} onChange={(logos) => onChange({ logos })} />
          <PartField label="Logo height (px)">
            <NumberField value={block.logoHeight ?? null} onChange={(v) => onChange({ logoHeight: v ?? undefined })} min={20} max={64} precision={0} />
          </PartField>
        </div>
      );
    case "social":
      return (
        <div className="space-y-2">
          <TitleInput block={block} onChange={onChange} placeholder="Follow us" />
          <PartHint>Your social links are set in Settings → General.</PartHint>
        </div>
      );
    default:
      return null;
  }
}
