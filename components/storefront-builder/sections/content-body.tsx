// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["content-body"]["settings"];

/**
 * A content page's body — the core section of a page moved off the Content
 * screen. It draws through the storefront's own content frame and body reader,
 * so a moved page looks exactly as it did: the theme's frame
 * (`templates.contentLayout`), the title, the "Last updated" line, and the body
 * in whichever format it was written.
 *
 * An island because the frame follows the store's theme and the Customize
 * draft, and the date is written in the shopper's language. `layout` is this
 * page's own frame, overriding the store's for this page alone.
 */
export function ContentBodySection({ settings }: SectionViewProps<Spec>) {
  return (
    <Island
      name="content-frame"
      props={{
        title: settings.title,
        body: settings.body,
        updatedAt: settings.updatedAt,
        layout: settings.layout,
      }}
    />
  );
}
