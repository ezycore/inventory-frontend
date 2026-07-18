// coding-standard: maintained
import { parseRichDoc } from "@/lib/storefront-rich-doc";
import { MarkdownView } from "@/components/storefront/markdown-view";
import { RichDocView } from "@/components/storefront/rich-doc-view";

/**
 * Renders a CMS page body in whichever format it is stored: rich-doc JSON
 * (pages saved through the rich-text editor) or legacy markdown text (pages
 * not yet re-saved — they convert lazily on next edit). Use this everywhere a
 * body is displayed read-only so both formats stay supported.
 */
export function ContentBodyView({ body }: { body: string }) {
  const doc = parseRichDoc(body);
  return doc ? <RichDocView doc={doc} /> : <MarkdownView source={body} />;
}
