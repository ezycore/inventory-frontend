// coding-standard: maintained
import type { ComponentType, ReactNode } from "react";
import type { SectionFieldSpec } from "@/lib/storefront-builder/field-specs";
import { SECTION_SPECS, type SectionType } from "@/lib/storefront-builder/section-specs";
import {
  productGridRequest,
  type ProductsDataRequest,
  type SectionData,
} from "@/lib/storefront-builder/section-data";
import { readBlocks, readSettings, type SettingsOf } from "@/lib/storefront-builder/settings";
import { parseRichDoc } from "@/lib/storefront-rich-doc";
import type { SectionContext, SectionViewProps } from "@/components/storefront-builder/section-view";
import { CallToActionSection } from "@/components/storefront-builder/sections/call-to-action";
import { FaqSection } from "@/components/storefront-builder/sections/faq";
import { ProductGridSection } from "@/components/storefront-builder/sections/product-grid";
import { RichTextSection } from "@/components/storefront-builder/sections/rich-text";

/** A section instance whose settings have been read and found renderable. */
export interface PreparedSection {
  /** The catalogue query this instance needs, if any. */
  request: ProductsDataRequest | null;
  /** True when, given its data, the section would draw nothing. */
  isEmpty: (data: SectionData | undefined) => boolean;
  render: (context: SectionContext, data: SectionData | undefined) => ReactNode;
}

export interface RenderableSection {
  v: number;
  /** `null` when a required setting does not read — the page skips the instance. */
  prepare: (instance: { id: string; settings: unknown; blocks?: unknown }) => PreparedSection | null;
}

interface SectionOptions<S extends Record<string, SectionFieldSpec>, B extends Record<string, SectionFieldSpec>> {
  /**
   * The catalogue query this section makes. Returning `null` means there is
   * nothing to query, and the instance is not rendered.
   */
  request?: (id: string, settings: SettingsOf<S>) => ProductsDataRequest | null;
  isEmpty?: (
    settings: SettingsOf<S>,
    blocks: { id: string; settings: SettingsOf<B> }[],
    data: SectionData | undefined,
  ) => boolean;
}

/**
 * Binds a spec to its view. Everything typed about a section — its settings, its
 * blocks, its data request — is checked here, once, and erased behind
 * `RenderableSection`, so the page renderer walks a mixed list without casts.
 */
function defineSection<
  S extends Record<string, SectionFieldSpec>,
  B extends Record<string, SectionFieldSpec> = Record<string, never>,
>(
  definition: { v: number; settings: S; blocks?: { max: number; settings: B } },
  View: ComponentType<SectionViewProps<S, B>>,
  options: SectionOptions<S, B> = {},
): RenderableSection {
  return {
    v: definition.v,
    prepare(instance) {
      const settings = readSettings(definition.settings, instance.settings);
      if (!settings) return null;
      const blocks = readBlocks(definition.blocks, instance.blocks);
      let request: ProductsDataRequest | null = null;
      if (options.request) {
        request = options.request(instance.id, settings);
        if (!request) return null;
      }
      return {
        request,
        isEmpty: (data) => options.isEmpty?.(settings, blocks, data) ?? false,
        render: (context, data) => (
          <View id={instance.id} settings={settings} blocks={blocks} context={context} data={data} />
        ),
      };
    },
  };
}

/**
 * Every section type this build renders. A type missing here is skipped on the
 * page rather than breaking it.
 *
 * `countdown` is specified but not rendered yet: its labels (days, hours,
 * minutes, seconds) have no Bangla terms in `docs/I18N-GLOSSARY.md`, and
 * storefront copy must not invent them.
 */
export const SECTION_REGISTRY: Partial<Record<SectionType, RenderableSection>> = {
  "rich-text": defineSection(SECTION_SPECS["rich-text"], RichTextSection, {
    isEmpty: (settings) => parseRichDoc(settings.body) === null,
  }),
  faq: defineSection(SECTION_SPECS.faq, FaqSection, {
    isEmpty: (_settings, blocks) => blocks.length === 0,
  }),
  "call-to-action": defineSection(SECTION_SPECS["call-to-action"], CallToActionSection),
  "product-grid": defineSection(SECTION_SPECS["product-grid"], ProductGridSection, {
    request: productGridRequest,
    isEmpty: (_settings, _blocks, data) => !data?.items.length,
  }),
};
