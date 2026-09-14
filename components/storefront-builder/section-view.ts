// coding-standard: maintained
import type { SectionFieldSpec } from "@/lib/storefront-builder/field-specs";
import type { SectionData } from "@/lib/storefront-builder/section-data";
import type { SettingsOf } from "@/lib/storefront-builder/settings";

/**
 * The contract between the page renderer and one section view.
 *
 * A view is a **pure function of these props** (plan §5.3): no fetching, no
 * request reads, no `"use client"`. That is what lets one view render on the
 * server for shoppers and inside the editor's preview, and what keeps a page
 * cacheable. Anything that moves or reacts is an island
 * (`components/storefront-builder/islands/island-map.tsx`), never a view.
 */

/** Store facts every section may need. Resolved once per page, not per section. */
export interface SectionContext {
  /** Public link base: `/shop` on a tenant host, `""` on a custom domain. */
  base: string;
  currency?: string;
}

export interface SectionViewProps<
  TSettings extends Record<string, SectionFieldSpec>,
  TBlock extends Record<string, SectionFieldSpec> = Record<string, never>,
> {
  /** The instance id — stable across saves, unique on the page. */
  id: string;
  settings: SettingsOf<TSettings>;
  /** Valid blocks only, in saved order. */
  blocks: { id: string; settings: SettingsOf<TBlock> }[];
  context: SectionContext;
  /** What the batched section-data call returned for this instance. */
  data?: SectionData;
}
