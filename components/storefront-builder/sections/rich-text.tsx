// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { parseRichDoc } from "@/lib/storefront-rich-doc";
import { RichDocView } from "@/components/storefront/rich-doc-view";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["rich-text"]["settings"];

/** Comfortable reading measure for prose, whatever the section's width. */
const PROSE_MAX_WIDTH = 780;

/**
 * Merchant-written rich text. The backend refuses a body that is not a rich-doc
 * document, so there is no markdown fallback here (unlike `ContentBodyView`,
 * which still has legacy CMS bodies to read).
 */
export function RichTextSection({ settings }: SectionViewProps<Spec>) {
  const doc = parseRichDoc(settings.body);
  if (!doc) return null;
  return (
    <div style={{ maxWidth: PROSE_MAX_WIDTH, marginInline: "auto" }}>
      <RichDocView doc={doc} />
    </div>
  );
}
