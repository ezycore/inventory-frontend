// coding-standard: maintained
import type {
  ProductsDataRequest,
  SectionData,
  StoreListNeed,
} from "@/lib/storefront-builder/section-data";
import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";
import { sectionFrame, type SectionFrame } from "@/lib/storefront-builder/section-style";
import type { SectionContext } from "@/components/storefront-builder/section-view";
import {
  SECTION_REGISTRY,
  type PreparedSection,
} from "@/components/storefront-builder/section-registry";

/** One section instance as the public page API returns it. */
export interface PageSectionInstance {
  id: string;
  type: string;
  v: number;
  enabled: boolean;
  visibility?: { desktop?: boolean; mobile?: boolean };
  settings: unknown;
  style?: unknown;
  blocks?: unknown;
}

export interface PreparedPageSection {
  id: string;
  frame: SectionFrame;
  /** Which breakpoint hides it, if one does. */
  hide?: "desktop" | "mobile";
  section: PreparedSection;
}

const registryEntry = (type: string) =>
  Object.hasOwn(SECTION_REGISTRY, type)
    ? SECTION_REGISTRY[type as keyof typeof SECTION_REGISTRY]
    : undefined;

/**
 * Phase one of rendering a page: decide which instances can render and what
 * data they need. Skipped without a trace — never half-drawn — are instances
 * that are disabled, of a type or version this build does not render, missing a
 * required setting, pointing at nothing, or hidden on both phone and desktop.
 */
export function prepareSections(
  instances: readonly PageSectionInstance[],
  page?: SectionPageContext,
): PreparedPageSection[] {
  const prepared: PreparedPageSection[] = [];
  for (const instance of instances) {
    if (!instance.enabled) continue;
    const entry = registryEntry(instance.type);
    if (!entry || entry.v !== instance.v) continue;

    const desktop = instance.visibility?.desktop !== false;
    const mobile = instance.visibility?.mobile !== false;
    if (!desktop && !mobile) continue;

    const section = entry.prepare(instance, page);
    if (!section) continue;
    prepared.push({
      id: instance.id,
      frame: sectionFrame(instance.style, section.frame),
      hide: !desktop ? "desktop" : !mobile ? "mobile" : undefined,
      section,
    });
  }
  return prepared;
}

/** Every catalogue query the prepared sections need, keyed by instance id. */
export const sectionDataRequests = (sections: readonly PreparedPageSection[]): ProductsDataRequest[] =>
  sections.flatMap(({ section }) => (section.request ? [section.request] : []));

/** Every store-wide list the prepared sections read, once each. */
export const sectionListNeeds = (sections: readonly PreparedPageSection[]): StoreListNeed[] => [
  ...new Set(sections.flatMap(({ section }) => section.needs)),
];

/**
 * Phase two: draw the prepared sections with the data fetched for them. Each
 * one sits in the common frame (`.sfb-sec`), whose style box arrives as custom
 * properties; a section with nothing to show is left out entirely rather than
 * leaving its padding behind as an empty band.
 */
export function PageSections({
  sections,
  context,
  data,
  annotate = false,
}: {
  sections: readonly PreparedPageSection[];
  context: SectionContext;
  data: Readonly<Record<string, SectionData>>;
  /**
   * Stamp each section with `data-section-id`, for the editor's click-to-select.
   * Only the owner preview asks: a shopper's page carries no editor markup.
   */
  annotate?: boolean;
}) {
  return (
    <>
      {sections.map(({ id, frame, hide, section }) => {
        const sectionData = data[id];
        if (section.isEmpty(sectionData, context)) return null;
        return (
          <section
            key={id}
            // The merchant's own name for the section, so a button further up
            // the page can link to `#it`. Absent unless they typed one — an id
            // generated from the instance id would be unreadable in a link
            // field and would change when a section is duplicated (D6).
            id={frame.anchor}
            className="sfb-sec"
            data-width={frame.width}
            data-tone={frame.tone}
            data-hide={hide}
            data-border={frame.border ? "" : undefined}
            data-overlay={frame.overlay !== undefined ? "" : undefined}
            data-styled-width={frame.styledWidth ? "" : undefined}
            data-float={section.floating ? "" : undefined}
            data-section-id={annotate ? id : undefined}
            style={frame.style}
          >
            <div className="sfb-inner">{section.render(context, sectionData)}</div>
          </section>
        );
      })}
    </>
  );
}
