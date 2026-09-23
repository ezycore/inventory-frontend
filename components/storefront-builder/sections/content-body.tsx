// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { isRichDocEmpty } from "@/lib/storefront-rich-doc";

type Spec = (typeof SECTION_SPECS)["content-body"]["settings"];

/**
 * A content page's body — the core section of a page moved off the Content
 * screen. It draws through the storefront's own content frame and body reader,
 * so a moved page looks exactly as it did: the theme's frame
 * (`templates.contentLayout`), the title, the "Last updated" line, and the body
 * in whichever format it was written.
 *
 * **An empty section draws nothing.** The rich-text editor is the page's
 * starting point, not an obligation: a merchant may clear it and build the page
 * out of the sections around it. Drawing the frame anyway would put a blank
 * band — its padding, its hairline, its empty title — above whatever they built.
 * Empty means no heading AND nothing in the body; an emptied editor still
 * serializes a document, which is why this asks `isRichDocEmpty` rather than
 * checking the string.
 *
 * The section stays required and unremovable either way: this is a state of the
 * section, not its absence.
 *
 * An island because the frame follows the store's theme and the Customize
 * draft, and the date is written in the shopper's language. `layout` is this
 * page's own frame, overriding the store's for this page alone.
 */
export function ContentBodySection({ settings }: SectionViewProps<Spec>) {
  const title = settings.title?.trim() ?? "";
  const body = isRichDocEmpty(settings.body) ? "" : (settings.body ?? "");
  if (!title && !body) return null;
  return (
    <Island
      name="content-frame"
      props={{
        title,
        body,
        updatedAt: settings.updatedAt,
        layout: settings.layout,
      }}
    />
  );
}
